namespace IDo.Application.DTOs;

public sealed record HabitProgressDto(
    Guid HabitId,
    int CompletedActiveDays,
    int TotalActiveDays,
    int CurrentStreak,
    int BestStreak,
    decimal SuccessRate);
