namespace IDo.Application.DTOs;

public sealed record UserSearchResultDto(
    Guid UserId,
    string Username,
    string? DisplayName,
    string? AvatarUrl,
    bool IsActiveProjectMember,
    bool HasPendingProjectInvite);
