using IDo.Application.DTOs;

namespace IDo.Application.Abstractions.Realtime;

public interface ITaskRealtimeNotifier
{
    Task TaskStatusChangedAsync(Guid taskId, TaskDto task, CancellationToken cancellationToken = default);
    Task TaskCommentAddedAsync(Guid taskId, TaskCommentDto comment, CancellationToken cancellationToken = default);
}
