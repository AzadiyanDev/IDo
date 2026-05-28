using IDo.Domain.Common;
using IDo.Domain.Enums;

namespace IDo.Domain.Entities;

public sealed class HabitScheduleDay : BaseEntity
{
    public Guid HabitId { get; set; }
    public Habit Habit { get; set; } = null!;
    public DayOfWeek DayOfWeek { get; set; }
    public HabitDayType DayType { get; set; }
}
