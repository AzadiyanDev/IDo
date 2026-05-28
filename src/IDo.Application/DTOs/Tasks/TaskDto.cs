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
    Guid? ProjectId,
    Guid? SectionId,
    Guid? HabitId,
    bool IsCountableInProgress,
    DateTime? CompletedAtUtc);
