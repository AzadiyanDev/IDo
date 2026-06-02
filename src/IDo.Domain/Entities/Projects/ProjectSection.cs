using IDo.Domain.Common;
using IDo.Domain.Enums;

namespace IDo.Domain.Entities;

public sealed class ProjectSection : AuditableEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public int Order { get; set; }
    public SectionVisibility Visibility { get; set; } = SectionVisibility.Public;
    public Guid? AssignedUserId { get; set; }
    public User? AssignedUser { get; set; }
    public Guid? PendingAssignedUserId { get; set; }
    public User? PendingAssignedUser { get; set; }
    public ProjectSectionAssignmentStatus AssignmentStatus { get; set; } = ProjectSectionAssignmentStatus.None;
    public bool IsArchived { get; set; }
    public DateTime? ArchivedAtUtc { get; set; }
    public ICollection<IDoTask> Tasks { get; set; } = new List<IDoTask>();
    public ICollection<TaskRequest> SentRequests { get; set; } = new List<TaskRequest>();
}
