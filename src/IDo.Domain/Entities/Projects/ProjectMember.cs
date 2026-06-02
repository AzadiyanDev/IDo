using IDo.Domain.Common;
using IDo.Domain.Enums;

namespace IDo.Domain.Entities;

public sealed class ProjectMember : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public ProjectMemberRole Role { get; set; } = ProjectMemberRole.Member;
    public ProjectMemberStatus Status { get; set; } = ProjectMemberStatus.Active;
    public Guid? InvitedByUserId { get; set; }
    public User? InvitedByUser { get; set; }
    public DateTime JoinedAtUtc { get; set; }
    public DateTime? RemovedAtUtc { get; set; }
}
