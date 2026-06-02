using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record ProjectSectionDto(
    Guid Id,
    Guid ProjectId,
    string Title,
    string? Description,
    string? Color,
    string? Icon,
    int Order,
    SectionVisibility Visibility,
    Guid? AssignedUserId,
    Guid? PendingAssignedUserId,
    IReadOnlyCollection<Guid> AssignedUserIds,
    IReadOnlyCollection<Guid> PendingAssignedUserIds,
    ProjectSectionAssignmentStatus AssignmentStatus,
    bool IsArchived,
    int DoneCount,
    int TotalCount,
    decimal ProgressPercentage);
