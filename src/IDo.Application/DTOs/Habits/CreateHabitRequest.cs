using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record CreateHabitRequest(
    string Title,
    string? Description,
    string? Color,
    string? Icon,
    HabitScheduleType ScheduleType,
    int? RequiredTimesPerWeek,
    TimeOnly? ReminderTime,
    IReadOnlyCollection<DayOfWeek> ActiveDays,
    IReadOnlyCollection<DayOfWeek> RestDays);
