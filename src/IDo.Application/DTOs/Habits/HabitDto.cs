using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record HabitDto(
    Guid Id,
    Guid UserId,
    string Title,
    string? Description,
    string? Color,
    string? Icon,
    HabitScheduleType ScheduleType,
    int? RequiredTimesPerWeek,
    TimeOnly? ReminderTime,
    bool IsActive,
    int CurrentStreak,
    int BestStreak,
    IReadOnlyCollection<DayOfWeek> ActiveDays);
