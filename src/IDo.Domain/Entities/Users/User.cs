using IDo.Domain.Common;
using IDo.Domain.ValueObjects;

namespace IDo.Domain.Entities;

public sealed class User : AuditableEntity
{
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public UserSettings Settings { get; set; } = new();
    public ICollection<IDoTask> Tasks { get; set; } = new List<IDoTask>();
    public ICollection<Habit> Habits { get; set; } = new List<Habit>();
    public ICollection<Project> OwnedProjects { get; set; } = new List<Project>();
    public ICollection<ProjectMember> ProjectMemberships { get; set; } = new List<ProjectMember>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
