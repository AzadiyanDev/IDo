using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record HabitLogDto(
    Guid Id,
    Guid HabitId,
    Guid UserId,
    DateOnly Date,
    HabitLogStatus Status,
    DateTime? CompletedAtUtc,
    string? Note);
