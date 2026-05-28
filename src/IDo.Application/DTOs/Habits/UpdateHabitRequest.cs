using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record UpdateHabitRequest(
    string Title,
    string? Description,
    string? Color,
    string? Icon,
    HabitScheduleType ScheduleType,
    int? RequiredTimesPerWeek,
    TimeOnly? ReminderTime,
    bool IsActive,
    IReadOnlyCollection<DayOfWeek> ActiveDays,
    IReadOnlyCollection<DayOfWeek> RestDays);
