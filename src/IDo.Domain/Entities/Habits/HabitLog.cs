using IDo.Domain.Common;
using IDo.Domain.Enums;

namespace IDo.Domain.Entities;

public sealed class HabitLog : BaseEntity
{
    public Guid HabitId { get; set; }
    public Habit Habit { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateOnly Date { get; set; }
    public HabitLogStatus Status { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? Note { get; set; }
}
