using IDo.Domain.Common;

namespace IDo.Domain.Entities;

public sealed class TaskComment : AuditableEntity
{
    public Guid TaskId { get; set; }
    public IDoTask Task { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Body { get; set; } = string.Empty;
}
