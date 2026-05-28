using IDo.Domain.Common;
using IDo.Domain.Enums;

namespace IDo.Domain.Entities;

public sealed class Habit : SoftDeletableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public HabitScheduleType ScheduleType { get; set; }
    public int? RequiredTimesPerWeek { get; set; }
    public TimeOnly? ReminderTime { get; set; }
    public bool IsActive { get; set; } = true;
    public int CurrentStreak { get; set; }
    public int BestStreak { get; set; }
    public ICollection<HabitScheduleDay> ScheduleDays { get; set; } = new List<HabitScheduleDay>();
    public ICollection<HabitLog> Logs { get; set; } = new List<HabitLog>();
    public ICollection<IDoTask> GeneratedTasks { get; set; } = new List<IDoTask>();
}
