using IDo.Application.Abstractions.Realtime;
using IDo.Application.DTOs;
using IDo.Web.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace IDo.Web.Realtime;

public sealed class SignalRTaskRealtimeNotifier(IHubContext<TaskHub> hubContext) : ITaskRealtimeNotifier
{
    public Task TaskStatusChangedAsync(Guid taskId, TaskDto task, CancellationToken cancellationToken = default) =>
        hubContext.Clients.Group(TaskHub.TaskGroup(taskId.ToString())).SendAsync("taskStatusChanged", task, cancellationToken);

    public Task TaskCommentAddedAsync(Guid taskId, TaskCommentDto comment, CancellationToken cancellationToken = default) =>
        hubContext.Clients.Group(TaskHub.TaskGroup(taskId.ToString())).SendAsync("taskCommentAdded", comment, cancellationToken);
}
