using IDo.Domain.Common;
using IDo.Domain.Enums;

namespace IDo.Domain.Entities;

public sealed class TaskRequest : BaseEntity
{
    public CollaborationRequestType Type { get; set; } = CollaborationRequestType.TaskAssignment;
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }
    public Guid? SectionId { get; set; }
    public ProjectSection? Section { get; set; }
    public Guid? TaskId { get; set; }
    public IDoTask? Task { get; set; }
    public Guid SenderUserId { get; set; }
    public User SenderUser { get; set; } = null!;
    public Guid ReceiverUserId { get; set; }
    public User ReceiverUser { get; set; } = null!;
    public TaskRequestStatus Status { get; set; } = TaskRequestStatus.Pending;
    public string Title { get; set; } = string.Empty;
    public string? Message { get; set; }
    public DateTime? RespondedAtUtc { get; set; }
    public string? ResponseNote { get; set; }
}
