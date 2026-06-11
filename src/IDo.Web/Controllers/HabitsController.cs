using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[Route("api/habits")]
public sealed class HabitsController(ICurrentUserService currentUser, IHabitService habitService, IUnitOfWork unitOfWork) : ApiControllerBase(currentUser)
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok((await unitOfWork.Habits.GetUserHabitsAsync(userId.Value, cancellationToken)).Select(x => x.ToDto()));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        var end = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var start = from ?? end.AddDays(-89);
        return Ok(await habitService.GetHabitDetailsAsync(userId.Value, id, start, end, cancellationToken));
    }

    [HttpGet("today")]
    public async Task<IActionResult> Today([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await habitService.GetHabitsForTodayAsync(userId.Value, date ?? DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateHabitRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await habitService.CreateHabitAsync(userId.Value, request, cancellationToken));
    }

    [HttpPost("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateHabitRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await habitService.UpdateHabitAsync(userId.Value, id, request, cancellationToken));
    }

    [HttpPost("{id:guid}/delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        await habitService.DeleteHabitAsync(userId.Value, id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, [FromQuery] DateOnly date, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await habitService.CompleteHabitForDateAsync(userId.Value, id, date, cancellationToken));
    }

    [HttpGet("{id:guid}/progress")]
    public async Task<IActionResult> Progress(Guid id, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
    {
        var end = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var start = from ?? end.AddDays(-30);
        return Ok(new { habitId = id, successRate = await habitService.CalculateSuccessRateAsync(id, start, end, cancellationToken), currentStreak = await habitService.CalculateStreakAsync(id, end, cancellationToken) });
    }
}
