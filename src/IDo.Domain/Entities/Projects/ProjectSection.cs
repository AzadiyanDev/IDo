using IDo.Domain.Common;
using IDo.Domain.Enums;

namespace IDo.Domain.Entities;

public sealed class ProjectSection : AuditableEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Order { get; set; }
    public SectionVisibility Visibility { get; set; } = SectionVisibility.Public;
    public Guid? AssignedUserId { get; set; }
    public User? AssignedUser { get; set; }
    public ICollection<IDoTask> Tasks { get; set; } = new List<IDoTask>();
}
