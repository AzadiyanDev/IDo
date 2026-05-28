using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record UpdateTaskRequest(
    string Title,
    string? Description,
    string? Color,
    string? Icon,
    DateOnly? DueDate,
    TimeOnly? DueTime,
    DateTime? ReminderAtUtc,
    Guid? AssigneeUserId,
    IDoTaskStatus? Status,
    bool IsCountableInProgress);
