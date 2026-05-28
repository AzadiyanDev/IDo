using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[Route("api/notifications")]
public sealed class NotificationsController(ICurrentUserService currentUser, IUnitOfWork unitOfWork, INotificationService notificationService) : ApiControllerBase(currentUser)
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok((await unitOfWork.Notifications.ListAsync(x => x.UserId == userId.Value, cancellationToken)).OrderByDescending(x => x.CreatedAtUtc).Select(x => x.ToDto()));
    }

    [HttpGet("unread")]
    public async Task<IActionResult> Unread(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok((await unitOfWork.Notifications.GetUnreadAsync(userId.Value, cancellationToken)).Select(x => x.ToDto()));
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> Read(Guid id, CancellationToken cancellationToken)
    {
        await notificationService.MarkAsReadAsync(id, cancellationToken);
        return NoContent();
    }
}
