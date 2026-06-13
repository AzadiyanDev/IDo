using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[Route("api/tasks")]
public sealed class TasksController(ICurrentUserService currentUser, ITaskService taskService, ITaskRequestService taskRequestService, IUnitOfWork unitOfWork) : ApiControllerBase(currentUser)
{
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskService.GetTaskDetailsAsync(userId.Value, id, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTaskRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        var result = request.ProjectId.HasValue
            ? await taskService.CreateProjectTaskAsync(userId.Value, request, cancellationToken)
            : await taskService.CreatePersonalTaskAsync(userId.Value, request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateTaskRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskService.UpdateTaskAsync(userId.Value, id, request, cancellationToken));
    }

    [HttpPost("rollover")]
    public async Task<IActionResult> Rollover(RolloverTasksRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskService.RolloverUnfinishedTasksAsync(userId.Value, request, cancellationToken));
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskService.CompleteTaskAsync(userId.Value, id, cancellationToken));
    }

    [HttpPost("{id:guid}/status")]
    public async Task<IActionResult> ChangeStatus(Guid id, ChangeTaskStatusRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskService.ChangeStatusAsync(userId.Value, id, request.Status, cancellationToken));
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        await taskService.ArchiveTaskAsync(userId.Value, id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        await taskService.DeleteTaskAsync(userId.Value, id, cancellationToken);
        return NoContent();
    }

    [HttpGet("overdue")]
    public async Task<IActionResult> Overdue([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        var tasks = await unitOfWork.Tasks.GetOverdueTasksAsync(userId.Value, date ?? DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
        return Ok(tasks.Select(x => x.ToDto()));
    }

    [HttpGet("assigned")]
    public async Task<IActionResult> Assigned(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        var tasks = await unitOfWork.Tasks.GetAssignedTasksAsync(userId.Value, cancellationToken);
        return Ok(tasks.Select(x => x.ToDto()));
    }

    [HttpPost("{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, CreateTaskCommentRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskService.AddCommentAsync(userId.Value, id, request, cancellationToken));
    }

    [HttpPost("{id:guid}/assign")]
    public async Task<IActionResult> Assign(Guid id, RequestAssignTaskRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskRequestService.SendTaskAssignmentRequestAsync(userId.Value, id, request, cancellationToken));
    }

    [HttpGet("{id:guid}/comments")]
    public async Task<IActionResult> Comments(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        var details = await taskService.GetTaskDetailsAsync(userId.Value, id, cancellationToken);
        return Ok(details.Comments);
    }
}
