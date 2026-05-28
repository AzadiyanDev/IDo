using IDo.Domain.Common;
using IDo.Domain.Enums;

namespace IDo.Domain.Entities;

public sealed class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public Guid? RelatedTaskId { get; set; }
    public Guid? RelatedProjectId { get; set; }
    public Guid? RelatedHabitId { get; set; }
    public Guid? RelatedTaskRequestId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAtUtc { get; set; }
}
