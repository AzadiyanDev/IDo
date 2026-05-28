using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record NotificationDto(
    Guid Id,
    Guid UserId,
    NotificationType Type,
    string Title,
    string? Body,
    Guid? RelatedTaskId,
    Guid? RelatedProjectId,
    Guid? RelatedHabitId,
    Guid? RelatedTaskRequestId,
    bool IsRead,
    DateTime CreatedAtUtc,
    DateTime? ReadAtUtc);
