using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.Common.Validation;
using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;

namespace IDo.Services.Services;

public sealed class TaskRequestService(
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider,
    INotificationService notifications,
    IProjectPermissionService permissions) : ITaskRequestService
{
    public Task<TaskRequestDto> SendTaskRequestAsync(Guid senderUserId, SendTaskRequestRequest request, CancellationToken cancellationToken = default) =>
        SendTaskAssignmentRequestAsync(senderUserId, request.TaskId, new RequestAssignTaskRequest(request.ReceiverUserId, request.Message), cancellationToken);

    public async Task<TaskRequestDto> SendTaskAssignmentRequestAsync(Guid senderUserId, Guid taskId, RequestAssignTaskRequest request, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");
        if (task.Status is IDoTaskStatus.Done or IDoTaskStatus.Archived) throw new RequestValidationException(["Completed or archived tasks cannot be assigned."]);
        if (task.ProjectId.HasValue)
        {
            if (!await permissions.CanEditTaskAsync(task.Id, senderUserId, cancellationToken)) throw new UnauthorizedAccessException("User cannot assign this task.");
            if (!await HasActiveMembershipOrPendingInviteAsync(task.ProjectId.Value, request.ReceiverUserId, cancellationToken)) throw new RequestValidationException(["Task request receiver must be an active project member or have a pending project invitation."]);
        }
        else if (task.CreatorUserId != senderUserId && task.AssigneeUserId != senderUserId)
        {
            throw new UnauthorizedAccessException("User cannot assign this task.");
        }

        if (request.ReceiverUserId == senderUserId)
        {
            task.AssigneeUserId = senderUserId;
            task.PendingAssigneeUserId = null;
            task.AssignmentStatus = ProjectTaskAssignmentStatus.Accepted;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return new TaskRequestDto(Guid.Empty, CollaborationRequestType.TaskAssignment, task.ProjectId, task.SectionId, task.Id, senderUserId, senderUserId, TaskRequestStatus.Accepted, $"Task assigned: {task.Title}", request.Message, dateTimeProvider.UtcNow, dateTimeProvider.UtcNow, null);
        }

        if (await unitOfWork.TaskRequests.GetTaskPendingRequestAsync(task.Id, request.ReceiverUserId, cancellationToken) is not null) throw new RequestValidationException(["Task already has a pending request for this receiver."]);
        task.PendingAssigneeUserId = request.ReceiverUserId;
        task.AssignmentStatus = ProjectTaskAssignmentStatus.Pending;

        var taskRequest = new TaskRequest
        {
            Type = CollaborationRequestType.TaskAssignment,
            ProjectId = task.ProjectId,
            SectionId = task.SectionId,
            TaskId = task.Id,
            SenderUserId = senderUserId,
            ReceiverUserId = request.ReceiverUserId,
            Title = $"Task assignment: {task.Title}",
            Message = request.Message
        };
        await unitOfWork.TaskRequests.AddAsync(taskRequest, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await notifications.CreateTaskRequestNotificationAsync(request.ReceiverUserId, taskRequest.Id, taskRequest.Title, task.Title, cancellationToken);
        return taskRequest.ToDto();
    }

    public Task<TaskRequestDto> AcceptTaskRequestAsync(Guid receiverUserId, Guid requestId, string? responseNote, CancellationToken cancellationToken = default) =>
        RespondAsync(receiverUserId, requestId, TaskRequestStatus.Accepted, responseNote, cancellationToken);

    public Task<TaskRequestDto> RejectTaskRequestAsync(Guid receiverUserId, Guid requestId, string? responseNote, CancellationToken cancellationToken = default) =>
        RespondAsync(receiverUserId, requestId, TaskRequestStatus.Rejected, responseNote, cancellationToken);

    public async Task<TaskRequestDto> CancelTaskRequestAsync(Guid senderUserId, Guid requestId, CancellationToken cancellationToken = default)
    {
        var request = await unitOfWork.TaskRequests.GetByIdAsync(requestId, cancellationToken) ?? throw new KeyNotFoundException("Request not found.");
        if (request.SenderUserId != senderUserId) throw new UnauthorizedAccessException("Only sender can cancel this request.");
        if (request.Status != TaskRequestStatus.Pending) throw new RequestValidationException(["Only pending requests can be cancelled."]);
        request.Status = TaskRequestStatus.Cancelled;
        request.RespondedAtUtc = dateTimeProvider.UtcNow;
        await ClearPendingTargetAsync(request, rejected: true, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return request.ToDto();
    }

    private async Task<TaskRequestDto> RespondAsync(Guid receiverUserId, Guid requestId, TaskRequestStatus status, string? responseNote, CancellationToken cancellationToken)
    {
        var request = await unitOfWork.TaskRequests.GetByIdAsync(requestId, cancellationToken) ?? throw new KeyNotFoundException("Request not found.");
        if (request.ReceiverUserId != receiverUserId) throw new UnauthorizedAccessException("Only receiver can respond to this request.");
        if (request.Status != TaskRequestStatus.Pending) throw new RequestValidationException(["Only pending requests can be answered."]);

        request.Status = status;
        request.ResponseNote = responseNote;
        request.RespondedAtUtc = dateTimeProvider.UtcNow;

        if (status == TaskRequestStatus.Accepted)
        {
            await AcceptTargetAsync(request, receiverUserId, cancellationToken);
        }
        else
        {
            await ClearPendingTargetAsync(request, rejected: true, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await notifications.CreateNotificationAsync(request.SenderUserId, NotificationType.TaskRequest, ResponseTitle(request), responseNote, relatedProjectId: request.ProjectId, relatedTaskId: request.TaskId, relatedTaskRequestId: request.Id, cancellationToken: cancellationToken);
        return request.ToDto();
    }

    private async Task AcceptTargetAsync(TaskRequest request, Guid receiverUserId, CancellationToken cancellationToken)
    {
        switch (request.Type)
        {
            case CollaborationRequestType.ProjectInvite:
                if (!request.ProjectId.HasValue) throw new RequestValidationException(["Project invite is invalid."]);
                var project = await unitOfWork.Projects.GetByIdAsync(request.ProjectId.Value, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
                if (project.Status == ProjectStatus.Archived) throw new RequestValidationException(["Archived project invitations cannot be accepted."]);
                var existingMember = await unitOfWork.ProjectMembers.GetMembershipAsync(project.Id, receiverUserId, cancellationToken);
                if (existingMember?.Status == ProjectMemberStatus.Active) throw new RequestValidationException(["User is already an active project member."]);
                if (existingMember is null)
                {
                    await unitOfWork.ProjectMembers.AddAsync(new ProjectMember
                    {
                        ProjectId = project.Id,
                        UserId = receiverUserId,
                        Role = ProjectMemberRole.Member,
                        Status = ProjectMemberStatus.Active,
                        InvitedByUserId = request.SenderUserId,
                        JoinedAtUtc = dateTimeProvider.UtcNow
                    }, cancellationToken);
                }
                else
                {
                    existingMember.Role = ProjectMemberRole.Member;
                    existingMember.Status = ProjectMemberStatus.Active;
                    existingMember.InvitedByUserId = request.SenderUserId;
                    existingMember.JoinedAtUtc = dateTimeProvider.UtcNow;
                    existingMember.RemovedAtUtc = null;
                }
                break;

            case CollaborationRequestType.SectionAssignment:
                if (!request.ProjectId.HasValue || !request.SectionId.HasValue) throw new RequestValidationException(["Section assignment is invalid."]);
                await EnsureActiveProjectMemberForAssignmentAsync(request.ProjectId.Value, receiverUserId, cancellationToken);
                var section = await unitOfWork.ProjectSections.GetByIdAsync(request.SectionId.Value, cancellationToken) ?? throw new KeyNotFoundException("Section not found.");
                section.AssignedUserId ??= receiverUserId;
                if (section.PendingAssignedUserId == receiverUserId) section.PendingAssignedUserId = null;
                section.AssignmentStatus = ProjectSectionAssignmentStatus.Accepted;
                section.Visibility = SectionVisibility.AssignedToMember;
                break;

            case CollaborationRequestType.TaskAssignment:
                if (!request.TaskId.HasValue) throw new RequestValidationException(["Task assignment is invalid."]);
                var task = await unitOfWork.Tasks.GetByIdAsync(request.TaskId.Value, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");
                if (task.ProjectId.HasValue) await EnsureActiveProjectMemberForAssignmentAsync(task.ProjectId.Value, receiverUserId, cancellationToken);
                if (task.ProjectId.HasValue) task.AssigneeUserId ??= receiverUserId;
                else task.AssigneeUserId = receiverUserId;
                if (task.PendingAssigneeUserId == receiverUserId) task.PendingAssigneeUserId = null;
                task.AssignmentStatus = ProjectTaskAssignmentStatus.Accepted;
                break;
        }
    }

    private async Task ClearPendingTargetAsync(TaskRequest request, bool rejected, CancellationToken cancellationToken)
    {
        if (request.Type == CollaborationRequestType.SectionAssignment && request.SectionId.HasValue)
        {
            var section = await unitOfWork.ProjectSections.GetByIdAsync(request.SectionId.Value, cancellationToken);
            if (section is not null && section.PendingAssignedUserId == request.ReceiverUserId)
            {
                section.PendingAssignedUserId = null;
                section.AssignmentStatus = rejected ? ProjectSectionAssignmentStatus.Rejected : ProjectSectionAssignmentStatus.None;
            }
        }
        else if (request.Type == CollaborationRequestType.TaskAssignment && request.TaskId.HasValue)
        {
            var task = await unitOfWork.Tasks.GetByIdAsync(request.TaskId.Value, cancellationToken);
            if (task is not null && task.PendingAssigneeUserId == request.ReceiverUserId)
            {
                task.PendingAssigneeUserId = null;
                task.AssignmentStatus = rejected ? ProjectTaskAssignmentStatus.Rejected : ProjectTaskAssignmentStatus.None;
            }
        }
        else if (request.Type == CollaborationRequestType.ProjectInvite && request.ProjectId.HasValue)
        {
            var member = await unitOfWork.ProjectMembers.GetMembershipAsync(request.ProjectId.Value, request.ReceiverUserId, cancellationToken);
            if (member?.Status == ProjectMemberStatus.Pending) member.Status = rejected ? ProjectMemberStatus.Rejected : ProjectMemberStatus.Removed;
        }
    }

    private static string ResponseTitle(TaskRequest request) => request.Status == TaskRequestStatus.Accepted
        ? $"{RequestLabel(request.Type)} accepted"
        : $"{RequestLabel(request.Type)} rejected";

    private async Task<bool> HasActiveMembershipOrPendingInviteAsync(Guid projectId, Guid receiverUserId, CancellationToken cancellationToken)
    {
        if (await unitOfWork.ProjectMembers.IsProjectMemberAsync(projectId, receiverUserId, cancellationToken)) return true;
        return await unitOfWork.TaskRequests.GetProjectInvitePendingRequestAsync(projectId, receiverUserId, cancellationToken) is not null;
    }

    private async Task EnsureActiveProjectMemberForAssignmentAsync(Guid projectId, Guid receiverUserId, CancellationToken cancellationToken)
    {
        if (await unitOfWork.ProjectMembers.IsProjectMemberAsync(projectId, receiverUserId, cancellationToken)) return;

        var invite = await unitOfWork.TaskRequests.GetProjectInvitePendingRequestAsync(projectId, receiverUserId, cancellationToken)
            ?? throw new RequestValidationException(["Receiver is no longer an active project member."]);
        var project = await unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
        if (project.Status == ProjectStatus.Archived) throw new RequestValidationException(["Archived project invitations cannot be accepted."]);

        var existingMember = await unitOfWork.ProjectMembers.GetMembershipAsync(project.Id, receiverUserId, cancellationToken);
        if (existingMember is null)
        {
            await unitOfWork.ProjectMembers.AddAsync(new ProjectMember
            {
                ProjectId = project.Id,
                UserId = receiverUserId,
                Role = ProjectMemberRole.Member,
                Status = ProjectMemberStatus.Active,
                InvitedByUserId = invite.SenderUserId,
                JoinedAtUtc = dateTimeProvider.UtcNow
            }, cancellationToken);
        }
        else
        {
            existingMember.Role = ProjectMemberRole.Member;
            existingMember.Status = ProjectMemberStatus.Active;
            existingMember.InvitedByUserId = invite.SenderUserId;
            existingMember.JoinedAtUtc = dateTimeProvider.UtcNow;
            existingMember.RemovedAtUtc = null;
        }

        invite.Status = TaskRequestStatus.Accepted;
        invite.RespondedAtUtc = dateTimeProvider.UtcNow;
    }

    private static string RequestLabel(CollaborationRequestType type) => type switch
    {
        CollaborationRequestType.ProjectInvite => "Project invite",
        CollaborationRequestType.SectionAssignment => "Section assignment",
        CollaborationRequestType.TaskAssignment => "Task assignment",
        _ => "Request"
    };
}
