using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record UserSettingsDto(
    bool NotificationsEnabled,
    string Language,
    string Theme,
    DayOfWeek WeekStartDay,
    CalendarType CalendarType,
    TimeOnly? DefaultReminderTime);
