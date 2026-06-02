using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record ProjectMemberDto(
    Guid Id,
    Guid ProjectId,
    Guid UserId,
    string? UserDisplayName,
    string? UserAvatarUrl,
    ProjectMemberRole Role,
    ProjectMemberStatus Status,
    Guid? InvitedByUserId,
    DateTime JoinedAtUtc,
    DateTime? RemovedAtUtc);
