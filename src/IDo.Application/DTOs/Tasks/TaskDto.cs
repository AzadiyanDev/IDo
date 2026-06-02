using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record TaskDto(
    Guid Id,
    string Title,
    string? Description,
    string? Color,
    string? Icon,
    DateOnly? DueDate,
    TimeOnly? DueTime,
    DateTime? ReminderAtUtc,
    IDoTaskStatus Status,
    IDoTaskType Type,
    Guid CreatorUserId,
    Guid? AssigneeUserId,
    Guid? PendingAssigneeUserId,
    IReadOnlyCollection<Guid> AssignedUserIds,
    IReadOnlyCollection<Guid> PendingAssigneeUserIds,
    Guid? ProjectId,
    Guid? SectionId,
    Guid? HabitId,
    ProjectTaskAssignmentStatus AssignmentStatus,
    int? Priority,
    bool IsCountableInProgress,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    DateTime? CompletedAtUtc);
