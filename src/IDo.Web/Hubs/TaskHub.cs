using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace IDo.Web.Hubs;

[Authorize]
public sealed class TaskHub : Hub
{
    public Task JoinTask(string taskId) => Groups.AddToGroupAsync(Context.ConnectionId, TaskGroup(taskId));
    public Task LeaveTask(string taskId) => Groups.RemoveFromGroupAsync(Context.ConnectionId, TaskGroup(taskId));
    public static string TaskGroup(string taskId) => $"task:{taskId}";
}
