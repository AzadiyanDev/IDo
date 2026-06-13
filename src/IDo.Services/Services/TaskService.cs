using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Realtime;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.Common.Validation;
using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;

namespace IDo.Services.Services;

public sealed class TaskService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider, IProjectPermissionService permissions, ITaskRealtimeNotifier realtime, ITaskRequestService taskRequests) : ITaskService
{
    public Task<TaskDto> CreatePersonalTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default) => CreateTaskAsync(userId, request with { ProjectId = null, SectionId = null }, IDoTaskType.Personal, cancellationToken);

    public Task<TaskDto> CreateProjectTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default) => CreateTaskAsync(userId, request, IDoTaskType.Project, cancellationToken);

    public async Task<TaskDto> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanEditTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot edit this task.");
        task.Title = request.Title.Trim();
        task.Description = request.Description;
        task.Color = request.Color;
        task.Icon = request.Icon;
        task.DueDate = request.DueDate;
        task.DueTime = request.DueTime;
        task.ReminderAtUtc = request.ReminderAtUtc;
        task.Priority = request.Priority;
        if (task.Type == IDoTaskType.Project && request.AssigneeUserId.HasValue && request.AssigneeUserId != task.AssigneeUserId)
        {
            await taskRequests.SendTaskAssignmentRequestAsync(userId, task.Id, new RequestAssignTaskRequest(request.AssigneeUserId.Value, "Task reassignment requested."), cancellationToken);
        }
        else if (task.Type != IDoTaskType.Project)
        {
            task.AssigneeUserId = request.AssigneeUserId;
        }
        task.IsCountableInProgress = request.IsCountableInProgress;
        var previousStatus = task.Status;
        if (request.Status.HasValue)
        {
            ValidateStatusChange(task, request.Status.Value);
            ApplyStatus(task, request.Status.Value);
        }
        unitOfWork.Tasks.Update(task);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var dto = task.ToDto();
        if (previousStatus != task.Status) await realtime.TaskStatusChangedAsync(taskId, dto, cancellationToken);
        return dto;
    }

    public async Task<RolloverTasksResponse> RolloverUnfinishedTasksAsync(Guid userId, RolloverTasksRequest request, CancellationToken cancellationToken = default)
    {
        if (request.SourceDate == request.TargetDate) return new(request.SourceDate, request.TargetDate, 0, Array.Empty<TaskDto>());

        var personalTasks = await unitOfWork.Tasks.GetPersonalTasksByDateAsync(userId, request.SourceDate, cancellationToken);
        var projectTasks = await unitOfWork.Tasks.GetProjectTasksByDateAsync(userId, request.SourceDate, cancellationToken);
        var candidates = personalTasks
            .Concat(projectTasks)
            .Where(task => task.Status is not IDoTaskStatus.Done and not IDoTaskStatus.Archived)
            .GroupBy(task => task.Id)
            .Select(group => group.First())
            .ToArray();
        var movedTasks = new List<IDoTask>(candidates.Length);

        foreach (var task in candidates)
        {
            if (!await permissions.CanEditTaskAsync(task.Id, userId, cancellationToken)) continue;
            task.DueDate = request.TargetDate;
            unitOfWork.Tasks.Update(task);
            movedTasks.Add(task);
        }

        if (movedTasks.Count > 0) await unitOfWork.SaveChangesAsync(cancellationToken);

        return new(
            request.SourceDate,
            request.TargetDate,
            movedTasks.Count,
            movedTasks.Select(task => task.ToDto()).ToArray());
    }

    public Task<TaskDto> CompleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default) => ChangeStatusAsync(userId, taskId, IDoTaskStatus.Done, cancellationToken);

    public async Task<TaskDto> ChangeStatusAsync(Guid userId, Guid taskId, IDoTaskStatus status, CancellationToken cancellationToken = default)
    {
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanCompleteTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot change this task.");
        ValidateStatusChange(task, status);
        ApplyStatus(task, status);
        unitOfWork.Tasks.Update(task);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var dto = task.ToDto();
        await realtime.TaskStatusChangedAsync(taskId, dto, cancellationToken);
        return dto;
    }

    public async Task ArchiveTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanEditTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot archive this task.");
        ApplyStatus(task, IDoTaskStatus.Archived);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanEditTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot delete this task.");
        unitOfWork.Tasks.SoftDelete(task, userId);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<TaskCommentDto> AddCommentAsync(Guid userId, Guid taskId, CreateTaskCommentRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Body)) throw new RequestValidationException(["Comment body is required."]);
        var task = await RequireTask(taskId, cancellationToken);
        if (task.Type != IDoTaskType.Project) throw new RequestValidationException(["Personal todos do not support comments."]);
        if (!await CanViewTaskAsync(task, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot comment on this task.");
        var comment = new TaskComment { TaskId = taskId, UserId = userId, Body = request.Body.Trim(), CreatedByUserId = userId };
        await unitOfWork.TaskComments.AddAsync(comment, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        comment.User = await unitOfWork.Users.GetByIdAsync(userId, cancellationToken) ?? comment.User;
        var dto = comment.ToDto();
        await realtime.TaskCommentAddedAsync(taskId, dto, cancellationToken);
        return dto;
    }

    public async Task<TaskDetailsDto> GetTaskDetailsAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetTaskWithCommentsAsync(taskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");
        if (!await CanViewTaskAsync(task, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot view this task.");
        return new TaskDetailsDto(
            task.ToDto(),
            task.Project?.Title,
            task.Section?.Title,
            task.AssigneeUser?.FullName,
            task.CreatorUser.FullName,
            task.AssignmentStatus,
            task.Comments.OrderBy(x => x.CreatedAtUtc).Select(x => x.ToDto()).ToArray(),
            task.SentRequests.Where(x => x.Status == TaskRequestStatus.Pending).Select(x => x.ToDto()).ToArray());
    }

    private async Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskRequest request, IDoTaskType type, CancellationToken cancellationToken)
    {
        RequestValidators.Validate(request);
        if (type == IDoTaskType.Project)
        {
            if (request.ProjectId is null) throw new RequestValidationException(["Project task requires ProjectId."]);
            var project = await unitOfWork.Projects.GetByIdAsync(request.ProjectId.Value, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
            if (project.Status == ProjectStatus.Archived) throw new RequestValidationException(["Archived projects cannot receive new tasks."]);
            if (request.SectionId.HasValue)
            {
                var section = await unitOfWork.ProjectSections.GetByIdAsync(request.SectionId.Value, cancellationToken) ?? throw new KeyNotFoundException("Section not found.");
                if (section.ProjectId != request.ProjectId.Value || section.IsArchived) throw new RequestValidationException(["Task section is not available."]);
            }
            if (!await permissions.CanCreateTaskInSectionAsync(request.ProjectId.Value, request.SectionId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot create a task in this project section.");
            if (request.AssigneeUserId.HasValue && !await unitOfWork.ProjectMembers.IsProjectMemberAsync(request.ProjectId.Value, request.AssigneeUserId.Value, cancellationToken)) throw new RequestValidationException(["Project task assignee must be an active project member."]);
        }

        var task = new IDoTask
        {
            CreatorUserId = userId,
            AssigneeUserId = ResolveInitialAssignee(userId, request, type),
            ProjectId = request.ProjectId,
            SectionId = request.SectionId,
            HabitId = request.HabitId,
            Title = request.Title.Trim(),
            Description = request.Description,
            Color = request.Color,
            Icon = request.Icon,
            DueDate = request.DueDate,
            DueTime = request.DueTime,
            ReminderAtUtc = request.ReminderAtUtc,
            Type = type,
            AssignmentStatus = ResolveInitialAssignmentStatus(userId, request, type),
            Priority = request.Priority,
            IsCountableInProgress = request.IsCountableInProgress,
            CreatedByUserId = userId
        };
        await unitOfWork.Tasks.AddAsync(task, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        if (type == IDoTaskType.Project && request.AssigneeUserId.HasValue && request.AssigneeUserId.Value != userId)
        {
            await taskRequests.SendTaskAssignmentRequestAsync(userId, task.Id, new RequestAssignTaskRequest(request.AssigneeUserId.Value, "Please take ownership of this task."), cancellationToken);
        }

        return task.ToDto();
    }

    private async Task<IDoTask> RequireTask(Guid taskId, CancellationToken cancellationToken) => await unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");

    private Task<bool> CanViewTaskAsync(IDoTask task, Guid userId, CancellationToken cancellationToken)
    {
        return permissions.CanViewTaskAsync(task.Id, userId, cancellationToken);
    }

    private static void ValidateStatusChange(IDoTask task, IDoTaskStatus status)
    {
        if (task.Type != IDoTaskType.Project && status is IDoTaskStatus.InProgress or IDoTaskStatus.Review)
        {
            throw new RequestValidationException(["Personal todos move directly to Done."]);
        }
    }

    private void ApplyStatus(IDoTask task, IDoTaskStatus status)
    {
        task.Status = status;
        task.CompletedAtUtc = status == IDoTaskStatus.Done ? dateTimeProvider.UtcNow : null;
    }

    private static Guid? ResolveInitialAssignee(Guid userId, CreateTaskRequest request, IDoTaskType type)
    {
        if (type != IDoTaskType.Project) return request.AssigneeUserId ?? userId;
        if (!request.AssigneeUserId.HasValue) return null;
        return request.AssigneeUserId.Value == userId ? userId : null;
    }

    private static ProjectTaskAssignmentStatus ResolveInitialAssignmentStatus(Guid userId, CreateTaskRequest request, IDoTaskType type)
    {
        if (type != IDoTaskType.Project) return request.AssigneeUserId.HasValue ? ProjectTaskAssignmentStatus.Accepted : ProjectTaskAssignmentStatus.None;
        if (!request.AssigneeUserId.HasValue) return ProjectTaskAssignmentStatus.None;
        return request.AssigneeUserId.Value == userId ? ProjectTaskAssignmentStatus.Accepted : ProjectTaskAssignmentStatus.Pending;
    }
}
