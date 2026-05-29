using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.Common.Validation;
using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;

namespace IDo.Services.Services;

public sealed class TaskRequestService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider, INotificationService notifications) : ITaskRequestService
{
    public async Task<TaskRequestDto> SendTaskRequestAsync(Guid senderUserId, SendTaskRequestRequest request, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetByIdAsync(request.TaskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");
        if (task.ProjectId.HasValue && !await unitOfWork.ProjectMembers.IsProjectMemberAsync(task.ProjectId.Value, request.ReceiverUserId, cancellationToken)) throw new RequestValidationException(["Task request receiver must be an active project member."]);
        if (await unitOfWork.TaskRequests.GetTaskPendingRequestAsync(task.Id, cancellationToken) is not null) throw new RequestValidationException(["Task already has a pending request."]);
        var taskRequest = new TaskRequest { TaskId = task.Id, SenderUserId = senderUserId, ReceiverUserId = request.ReceiverUserId, Message = request.Message };
        await unitOfWork.TaskRequests.AddAsync(taskRequest, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await notifications.CreateTaskRequestNotificationAsync(request.ReceiverUserId, taskRequest.Id, "Task request", task.Title, cancellationToken);
        return taskRequest.ToDto();
    }

    public Task<TaskRequestDto> AcceptTaskRequestAsync(Guid receiverUserId, Guid requestId, string? responseNote, CancellationToken cancellationToken = default) => RespondAsync(receiverUserId, requestId, TaskRequestStatus.Accepted, responseNote, cancellationToken);
    public Task<TaskRequestDto> RejectTaskRequestAsync(Guid receiverUserId, Guid requestId, string? responseNote, CancellationToken cancellationToken = default) => RespondAsync(receiverUserId, requestId, TaskRequestStatus.Rejected, responseNote, cancellationToken);

    public async Task<TaskRequestDto> CancelTaskRequestAsync(Guid senderUserId, Guid requestId, CancellationToken cancellationToken = default)
    {
        var request = await unitOfWork.TaskRequests.GetByIdAsync(requestId, cancellationToken) ?? throw new KeyNotFoundException("Task request not found.");
        if (request.SenderUserId != senderUserId) throw new UnauthorizedAccessException("Only sender can cancel this request.");
        if (request.Status != TaskRequestStatus.Pending) throw new RequestValidationException(["Only pending requests can be cancelled."]);
        request.Status = TaskRequestStatus.Cancelled;
        request.RespondedAtUtc = dateTimeProvider.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return request.ToDto();
    }

    private async Task<TaskRequestDto> RespondAsync(Guid receiverUserId, Guid requestId, TaskRequestStatus status, string? responseNote, CancellationToken cancellationToken)
    {
        var request = await unitOfWork.TaskRequests.GetByIdAsync(requestId, cancellationToken) ?? throw new KeyNotFoundException("Task request not found.");
        if (request.ReceiverUserId != receiverUserId) throw new UnauthorizedAccessException("Only receiver can respond to this request.");
        if (request.Status != TaskRequestStatus.Pending) throw new RequestValidationException(["Only pending requests can be answered."]);
        request.Status = status;
        request.ResponseNote = responseNote;
        request.RespondedAtUtc = dateTimeProvider.UtcNow;
        var task = await unitOfWork.Tasks.GetByIdAsync(request.TaskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");
        if (status == TaskRequestStatus.Accepted) task.AssigneeUserId = receiverUserId;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await notifications.CreateTaskRequestNotificationAsync(request.SenderUserId, request.Id, status == TaskRequestStatus.Accepted ? "Task request accepted" : "Task request rejected", task.Title, cancellationToken);
        return request.ToDto();
    }
}
