using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[Route("api/task-requests")]
public sealed class TaskRequestsController(ICurrentUserService currentUser, ITaskRequestService taskRequestService, IUnitOfWork unitOfWork) : ApiControllerBase(currentUser)
{
    [HttpGet("inbox")]
    public async Task<IActionResult> Inbox(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok((await unitOfWork.TaskRequests.GetPendingRequestsForUserAsync(userId.Value, cancellationToken)).Select(x => x.ToDto()));
    }

    [HttpGet("sent")]
    public async Task<IActionResult> Sent(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok((await unitOfWork.TaskRequests.GetSentRequestsAsync(userId.Value, cancellationToken)).Select(x => x.ToDto()));
    }

    [HttpPost]
    public async Task<IActionResult> Send(SendTaskRequestRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskRequestService.SendTaskRequestAsync(userId.Value, request, cancellationToken));
    }

    [HttpPost("{id:guid}/accept")]
    public async Task<IActionResult> Accept(Guid id, RespondTaskRequestRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskRequestService.AcceptTaskRequestAsync(userId.Value, id, request.ResponseNote, cancellationToken));
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, RespondTaskRequestRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskRequestService.RejectTaskRequestAsync(userId.Value, id, request.ResponseNote, cancellationToken));
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await taskRequestService.CancelTaskRequestAsync(userId.Value, id, cancellationToken));
    }
}
