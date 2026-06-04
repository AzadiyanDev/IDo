using System.Net.Mail;
using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[Route("api/profile")]
public sealed class ProfileController(
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork,
    IIdentityAccountService identityAccounts,
    IWebHostEnvironment environment) : ApiControllerBase(currentUser)
{
    private static readonly HashSet<string> AllowedAvatarTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

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

    [HttpPut("account")]
    public async Task<IActionResult> UpdateAccount(UpdateUserProfileRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;

        var fullName = request.FullName.Trim();
        var userName = request.UserName.Trim();
        var email = request.Email.Trim();
        var phoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
        var errors = ValidateAccountUpdate(fullName, userName, email, phoneNumber);
        if (errors.Count > 0) return BadRequest(new { errors });

        var user = await unitOfWork.Users.GetByIdAsync(userId.Value, cancellationToken);
        if (user is null) return NotFound();

        var identityResult = await identityAccounts.UpdateAccountAsync(user.Id, userName, email, cancellationToken);
        if (!identityResult.Succeeded) return BadRequest(new { errors = identityResult.Errors });

        user.FullName = fullName;
        user.AvatarUrl = request.AvatarUrl;
        user.Email = email;
        user.PhoneNumber = phoneNumber;
        user.Settings.NotificationsEnabled = request.Settings.NotificationsEnabled;
        user.Settings.Language = request.Settings.Language;
        user.Settings.Theme = request.Settings.Theme;
        user.Settings.WeekStartDay = request.Settings.WeekStartDay;
        user.Settings.DefaultReminderTime = request.Settings.DefaultReminderTime;

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new AuthUserDto(user.Id, userName, email, user.ToDto()));
    }

    [HttpPost("avatar")]
    [RequestSizeLimit(2_500_000)]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        if (file.Length is 0) return BadRequest(new { error = "Avatar file is empty." });
        if (!AllowedAvatarTypes.Contains(file.ContentType)) return BadRequest(new { error = "Only JPG, PNG, and WebP images are supported." });

        var user = await unitOfWork.Users.GetByIdAsync(userId.Value, cancellationToken);
        if (user is null) return NotFound();

        var uploadsRoot = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads", "avatars");
        Directory.CreateDirectory(uploadsRoot);

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        extension = extension is ".jpg" or ".jpeg" or ".png" or ".webp" ? extension : ".jpg";
        var fileName = $"{user.Id:N}-{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsRoot, fileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        user.AvatarUrl = $"/uploads/avatars/{fileName}";
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

    private static List<string> ValidateAccountUpdate(string fullName, string userName, string email, string? phoneNumber)
    {
        var errors = new List<string>();
        if (fullName.Length is < 1 or > 160) errors.Add("Full name must be between 1 and 160 characters.");
        if (userName.Length is < 3 or > 64) errors.Add("Username must be between 3 and 64 characters.");
        if (userName.Any(char.IsWhiteSpace)) errors.Add("Username cannot contain whitespace.");
        if (string.IsNullOrWhiteSpace(email) || !IsValidEmail(email)) errors.Add("A valid email is required.");
        if (phoneNumber is { Length: > 32 }) errors.Add("Phone number must be 32 characters or fewer.");
        return errors;
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            return new MailAddress(email).Address.Equals(email, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }
}
