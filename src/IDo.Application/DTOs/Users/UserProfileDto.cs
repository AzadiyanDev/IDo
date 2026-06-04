namespace IDo.Application.DTOs;

public sealed record UserProfileDto(
    Guid Id,
    string FullName,
    string? AvatarUrl,
    string? Email,
    string? PhoneNumber,
    bool IsActive,
    UserSettingsDto Settings);

public sealed record UpdateUserProfileRequest(
    string FullName,
    string UserName,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    UserSettingsDto Settings);
