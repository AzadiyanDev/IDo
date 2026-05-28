using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Services;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[Route("api/progress")]
public sealed class ProgressController(ICurrentUserService currentUser, IProgressService progressService) : ApiControllerBase(currentUser)
{
    [HttpGet("today")]
    public async Task<IActionResult> Today([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await progressService.GetTodayProgressAsync(userId.Value, date ?? DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken));
    }

    [HttpGet("weekly")]
    public async Task<IActionResult> Weekly([FromQuery] DateOnly? weekStartDate, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return Ok(await progressService.GetWeeklyActivityAsync(userId.Value, weekStartDate ?? today.AddDays(-(int)today.DayOfWeek), cancellationToken));
    }

    [HttpGet("habits")]
    public async Task<IActionResult> Habits([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        var end = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
        return Ok(await progressService.GetHabitProgressAsync(userId.Value, from ?? end.AddDays(-30), end, cancellationToken));
    }

    [HttpGet("projects")]
    public async Task<IActionResult> Projects(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await progressService.GetProjectProgressAsync(userId.Value, cancellationToken));
    }
}
