using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record ProjectMemberDto(
    Guid Id,
    Guid ProjectId,
    Guid UserId,
    ProjectMemberRole Role,
    ProjectMemberStatus Status,
    DateTime JoinedAtUtc,
    DateTime? RemovedAtUtc);
