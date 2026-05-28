using IDo.Application.Abstractions.Identity;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[ApiController]
public abstract class ApiControllerBase(ICurrentUserService currentUser) : ControllerBase
{
    protected ActionResult<Guid> CurrentUserId()
    {
        return currentUser.UserId is { } userId
            ? userId
            : Unauthorized(new { error = "Send X-User-Id header until authentication is wired." });
    }
}
