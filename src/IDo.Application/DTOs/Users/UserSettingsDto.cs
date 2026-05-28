namespace IDo.Application.DTOs;

public sealed record UserSettingsDto(
    bool NotificationsEnabled,
    string Language,
    string Theme,
    DayOfWeek WeekStartDay,
    TimeOnly? DefaultReminderTime);
