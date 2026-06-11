using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record HabitDetailsDto(
    HabitDto Habit,
    IReadOnlyCollection<HabitLogDto> Logs,
    HabitAnalyticsDto Analytics,
    IReadOnlyCollection<HabitDayAnalysisDto> RecentDays,
    IReadOnlyCollection<HabitWeekdayAnalysisDto> WeekdayStats);

public sealed record HabitAnalyticsDto(
    DateOnly From,
    DateOnly To,
    int ScheduledDays,
    int CompletedDays,
    int MissedDays,
    int OpenDays,
    int RestDays,
    int OutOfScheduleDays,
    decimal SuccessRate,
    decimal CompletionDensity,
    decimal AverageDonePerWeek,
    int CurrentStreak,
    int BestStreak,
    DateOnly? LastCompletedDate,
    int LongestGapDays);

public sealed record HabitDayAnalysisDto(
    DateOnly Date,
    DayOfWeek DayOfWeek,
    bool IsScheduled,
    HabitLogStatus? Status,
    DateTime? CompletedAtUtc);

public sealed record HabitWeekdayAnalysisDto(
    DayOfWeek DayOfWeek,
    int ScheduledDays,
    int CompletedDays,
    int MissedDays,
    decimal SuccessRate);
