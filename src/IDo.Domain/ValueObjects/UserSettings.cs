using IDo.Domain.Enums;

namespace IDo.Domain.ValueObjects;

public sealed class UserSettings
{
    public bool NotificationsEnabled { get; set; } = true;
    public string Language { get; set; } = "en";
    public string Theme { get; set; } = "system";
    public DayOfWeek WeekStartDay { get; set; } = DayOfWeek.Monday;
    public CalendarType CalendarType { get; set; } = CalendarType.Gregorian;
    public TimeOnly? DefaultReminderTime { get; set; }
}
