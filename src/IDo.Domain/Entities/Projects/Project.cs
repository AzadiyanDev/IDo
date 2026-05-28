using IDo.Domain.Common;
using IDo.Domain.Enums;

namespace IDo.Domain.Entities;

public sealed class Project : SoftDeletableEntity
{
    public Guid OwnerUserId { get; set; }
    public User OwnerUser { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public ICollection<ProjectSection> Sections { get; set; } = new List<ProjectSection>();
    public ICollection<IDoTask> Tasks { get; set; } = new List<IDoTask>();
    public DateTime? ArchivedAtUtc { get; set; }
}
