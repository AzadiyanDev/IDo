using IDo.Domain.Common;
using IDo.Domain.Enums;

namespace IDo.Domain.Entities;

public sealed class IDoTask : SoftDeletableEntity
{
    public Guid CreatorUserId { get; set; }
    public User CreatorUser { get; set; } = null!;
    public Guid? AssigneeUserId { get; set; }
    public User? AssigneeUser { get; set; }
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }
    public Guid? SectionId { get; set; }
    public ProjectSection? Section { get; set; }
    public Guid? HabitId { get; set; }
    public Habit? Habit { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public DateOnly? DueDate { get; set; }
    public TimeOnly? DueTime { get; set; }
    public DateTime? ReminderAtUtc { get; set; }
    public IDoTaskStatus Status { get; set; } = IDoTaskStatus.Todo;
    public IDoTaskType Type { get; set; } = IDoTaskType.Personal;
    public bool IsCountableInProgress { get; set; } = true;
    public DateTime? CompletedAtUtc { get; set; }
    public ICollection<TaskRequest> SentRequests { get; set; } = new List<TaskRequest>();
    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
}
