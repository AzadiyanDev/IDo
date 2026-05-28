using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;

namespace IDo.Application.Common.Mappings;

public static class DtoMapper
{
    public static UserProfileDto ToDto(this User user) => new(user.Id, user.FullName, user.AvatarUrl, user.Email, user.PhoneNumber, user.IsActive, new(user.Settings.NotificationsEnabled, user.Settings.Language, user.Settings.Theme, user.Settings.WeekStartDay, user.Settings.DefaultReminderTime));
    public static TaskDto ToDto(this IDoTask task) => new(task.Id, task.Title, task.Description, task.Color, task.Icon, task.DueDate, task.DueTime, task.ReminderAtUtc, task.Status, task.Type, task.CreatorUserId, task.AssigneeUserId, task.ProjectId, task.SectionId, task.HabitId, task.IsCountableInProgress, task.CompletedAtUtc);
    public static TaskCommentDto ToDto(this TaskComment comment) => new(comment.Id, comment.TaskId, comment.UserId, comment.Body, comment.CreatedAtUtc, comment.UpdatedAtUtc);
    public static HabitDto ToDto(this Habit habit) => new(habit.Id, habit.UserId, habit.Title, habit.Description, habit.Color, habit.Icon, habit.ScheduleType, habit.RequiredTimesPerWeek, habit.ReminderTime, habit.IsActive, habit.CurrentStreak, habit.BestStreak, habit.ScheduleDays.Where(x => x.DayType == HabitDayType.Active).Select(x => x.DayOfWeek).ToArray());
    public static HabitLogDto ToDto(this HabitLog log) => new(log.Id, log.HabitId, log.UserId, log.Date, log.Status, log.CompletedAtUtc, log.Note);
    public static ProjectDto ToDto(this Project project) => new(project.Id, project.OwnerUserId, project.Title, project.Description, project.Color, project.Icon, project.Status, project.ArchivedAtUtc);
    public static ProjectSectionDto ToDto(this ProjectSection section) => new(section.Id, section.ProjectId, section.Title, section.Description, section.Order, section.Visibility, section.AssignedUserId);
    public static ProjectMemberDto ToDto(this ProjectMember member) => new(member.Id, member.ProjectId, member.UserId, member.Role, member.Status, member.JoinedAtUtc, member.RemovedAtUtc);
    public static TaskRequestDto ToDto(this TaskRequest request) => new(request.Id, request.TaskId, request.SenderUserId, request.ReceiverUserId, request.Status, request.Message, request.CreatedAtUtc, request.RespondedAtUtc, request.ResponseNote);
    public static NotificationDto ToDto(this Notification notification) => new(notification.Id, notification.UserId, notification.Type, notification.Title, notification.Body, notification.RelatedTaskId, notification.RelatedProjectId, notification.RelatedHabitId, notification.RelatedTaskRequestId, notification.IsRead, notification.CreatedAtUtc, notification.ReadAtUtc);
}
