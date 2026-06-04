using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;

namespace IDo.Application.Common.Mappings;

public static class DtoMapper
{
    public static UserProfileDto ToDto(this User user) => new(user.Id, user.FullName, user.AvatarUrl, user.Email, user.PhoneNumber, user.IsActive, new(user.Settings.NotificationsEnabled, user.Settings.Language, user.Settings.Theme, user.Settings.WeekStartDay, user.Settings.CalendarType, user.Settings.DefaultReminderTime));
    public static TaskDto ToDto(this IDoTask task)
    {
        var sentRequests = task.SentRequests ?? Enumerable.Empty<TaskRequest>();
        var assignedUserIds = sentRequests
            .Where(x => x.Type == CollaborationRequestType.TaskAssignment && x.Status == TaskRequestStatus.Accepted)
            .Select(x => x.ReceiverUserId)
            .AppendNullable(task.AssigneeUserId)
            .Distinct()
            .ToArray();
        var pendingAssigneeUserIds = sentRequests
            .Where(x => x.Type == CollaborationRequestType.TaskAssignment && x.Status == TaskRequestStatus.Pending)
            .Select(x => x.ReceiverUserId)
            .AppendNullable(task.PendingAssigneeUserId)
            .Distinct()
            .ToArray();
        return new(task.Id, task.Title, task.Description, task.Color, task.Icon, task.DueDate, task.DueTime, task.ReminderAtUtc, task.Status, task.Type, task.CreatorUserId, task.AssigneeUserId, task.PendingAssigneeUserId, assignedUserIds, pendingAssigneeUserIds, task.ProjectId, task.SectionId, task.HabitId, task.AssignmentStatus, task.Priority, task.IsCountableInProgress, task.CreatedAtUtc, task.UpdatedAtUtc, task.CompletedAtUtc);
    }
    public static TaskCommentDto ToDto(this TaskComment comment) => new(comment.Id, comment.TaskId, comment.UserId, comment.User?.FullName ?? "User", comment.User?.AvatarUrl, comment.Body, comment.CreatedAtUtc, comment.UpdatedAtUtc);
    public static HabitDto ToDto(this Habit habit) => new(habit.Id, habit.UserId, habit.Title, habit.Description, habit.Color, habit.Icon, habit.ScheduleType, habit.RequiredTimesPerWeek, habit.ReminderTime, habit.IsActive, habit.CurrentStreak, habit.BestStreak, habit.ScheduleDays.Where(x => x.DayType == HabitDayType.Active).Select(x => x.DayOfWeek).ToArray());
    public static HabitLogDto ToDto(this HabitLog log) => new(log.Id, log.HabitId, log.UserId, log.Date, log.Status, log.CompletedAtUtc, log.Note);
    public static ProjectDto ToDto(this Project project) => new(project.Id, project.OwnerUserId, project.Title, project.Description, project.Color, project.Icon, project.Status, project.ArchivedAtUtc);
    public static ProjectSectionDto ToDto(this ProjectSection section)
    {
        var tasks = section.Tasks ?? Enumerable.Empty<IDoTask>();
        var sentRequests = section.SentRequests ?? Enumerable.Empty<TaskRequest>();
        var countable = tasks.Where(x => x.IsCountableInProgress && x.Status != IDoTaskStatus.Archived && !x.IsDeleted).ToArray();
        var done = countable.Count(x => x.Status == IDoTaskStatus.Done);
        var progress = countable.Length == 0 ? 0 : decimal.Round(done * 100m / countable.Length, 2);
        var assignedUserIds = sentRequests
            .Where(x => x.Type == CollaborationRequestType.SectionAssignment && x.Status == TaskRequestStatus.Accepted)
            .Select(x => x.ReceiverUserId)
            .AppendNullable(section.AssignedUserId)
            .Distinct()
            .ToArray();
        var pendingAssignedUserIds = sentRequests
            .Where(x => x.Type == CollaborationRequestType.SectionAssignment && x.Status == TaskRequestStatus.Pending)
            .Select(x => x.ReceiverUserId)
            .AppendNullable(section.PendingAssignedUserId)
            .Distinct()
            .ToArray();
        return new(section.Id, section.ProjectId, section.Title, section.Description, section.Color, section.Icon, section.Order, section.Visibility, section.AssignedUserId, section.PendingAssignedUserId, assignedUserIds, pendingAssignedUserIds, section.AssignmentStatus, section.IsArchived, done, countable.Length, progress);
    }

    public static ProjectMemberDto ToDto(this ProjectMember member) => new(member.Id, member.ProjectId, member.UserId, member.User?.FullName, member.User?.AvatarUrl, member.Role, member.Status, member.InvitedByUserId, member.JoinedAtUtc, member.RemovedAtUtc);
    public static TaskRequestDto ToDto(this TaskRequest request) => new(request.Id, request.Type, request.ProjectId, request.SectionId, request.TaskId, request.SenderUserId, request.ReceiverUserId, request.Status, request.Title, request.Message, request.CreatedAtUtc, request.RespondedAtUtc, request.ResponseNote);
    public static NotificationDto ToDto(this Notification notification) => new(notification.Id, notification.UserId, notification.Type, notification.Title, notification.Body, notification.RelatedTaskId, notification.RelatedProjectId, notification.RelatedHabitId, notification.RelatedTaskRequestId, notification.IsRead, notification.CreatedAtUtc, notification.ReadAtUtc);

    private static IEnumerable<Guid> AppendNullable(this IEnumerable<Guid> values, Guid? value)
    {
        foreach (var item in values) yield return item;
        if (value.HasValue) yield return value.Value;
    }
}
