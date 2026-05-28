using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Services;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[Route("api/today")]
public sealed class TodayController(ICurrentUserService currentUser, ITodayService todayService) : ApiControllerBase(currentUser)
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await todayService.GetTodayAsync(userId.Value, date ?? DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken));
    }
}
