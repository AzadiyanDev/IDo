using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[Route("api/profile")]
public sealed class ProfileController(ICurrentUserService currentUser, IUnitOfWork unitOfWork) : ApiControllerBase(currentUser)
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        var user = await unitOfWork.Users.GetByIdAsync(userId.Value, cancellationToken);
        return user is null ? NotFound() : Ok(user.ToDto());
    }

    [HttpPut]
    public async Task<IActionResult> Update(UserProfileDto request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        var user = await unitOfWork.Users.GetByIdAsync(userId.Value, cancellationToken);
        if (user is null) return NotFound();
        user.FullName = request.FullName;
        user.AvatarUrl = request.AvatarUrl;
        user.Email = request.Email;
        user.PhoneNumber = request.PhoneNumber;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(user.ToDto());
    }

    [HttpPut("settings")]
    public async Task<IActionResult> Settings(UserSettingsDto request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        var user = await unitOfWork.Users.GetByIdAsync(userId.Value, cancellationToken);
        if (user is null) return NotFound();
        user.Settings.NotificationsEnabled = request.NotificationsEnabled;
        user.Settings.Language = request.Language;
        user.Settings.Theme = request.Theme;
        user.Settings.WeekStartDay = request.WeekStartDay;
        user.Settings.DefaultReminderTime = request.DefaultReminderTime;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(user.ToDto());
    }
}
