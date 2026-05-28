namespace IDo.Application.DTOs;

public sealed record CreateTaskRequest(
    string Title,
    string? Description,
    string? Color,
    string? Icon,
    DateOnly? DueDate,
    TimeOnly? DueTime,
    DateTime? ReminderAtUtc,
    Guid? AssigneeUserId,
    Guid? ProjectId,
    Guid? SectionId,
    Guid? HabitId,
    bool IsCountableInProgress);
