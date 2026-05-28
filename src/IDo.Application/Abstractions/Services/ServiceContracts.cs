using IDo.Application.DTOs;
using IDo.Domain.Enums;

namespace IDo.Application.Abstractions.Services;

public interface ITodayService
{
    Task<TodayDashboardDto> GetTodayAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);
}

public interface ITaskService
{
    Task<TaskDto> CreatePersonalTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default);
    Task<TaskDto> CreateProjectTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default);
    Task<TaskDto> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken = default);
    Task<TaskDto> CompleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default);
    Task<TaskDto> ChangeStatusAsync(Guid userId, Guid taskId, IDoTaskStatus status, CancellationToken cancellationToken = default);
    Task ArchiveTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default);
    Task DeleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default);
    Task<TaskCommentDto> AddCommentAsync(Guid userId, Guid taskId, CreateTaskCommentRequest request, CancellationToken cancellationToken = default);
    Task<TaskDetailsDto> GetTaskDetailsAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default);
}

public interface IHabitService
{
    Task<HabitDto> CreateHabitAsync(Guid userId, CreateHabitRequest request, CancellationToken cancellationToken = default);
    Task<HabitDto> UpdateHabitAsync(Guid userId, Guid habitId, UpdateHabitRequest request, CancellationToken cancellationToken = default);
    Task DeleteHabitAsync(Guid userId, Guid habitId, CancellationToken cancellationToken = default);
    Task<HabitLogDto> CompleteHabitForDateAsync(Guid userId, Guid habitId, DateOnly date, CancellationToken cancellationToken = default);
    Task<int> CalculateStreakAsync(Guid habitId, DateOnly throughDate, CancellationToken cancellationToken = default);
    Task<decimal> CalculateSuccessRateAsync(Guid habitId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<HabitDto>> GetHabitsForTodayAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);
}

public interface IProjectService
{
    Task<ProjectDto> CreateProjectAsync(Guid ownerUserId, CreateProjectRequest request, CancellationToken cancellationToken = default);
    Task<ProjectDto> UpdateProjectAsync(Guid userId, Guid projectId, UpdateProjectRequest request, CancellationToken cancellationToken = default);
    Task ArchiveProjectAsync(Guid userId, Guid projectId, CancellationToken cancellationToken = default);
    Task<ProjectSectionDto> AddSectionAsync(Guid userId, Guid projectId, CreateProjectSectionRequest request, CancellationToken cancellationToken = default);
    Task<ProjectSectionDto> UpdateSectionAsync(Guid userId, Guid projectId, Guid sectionId, CreateProjectSectionRequest request, CancellationToken cancellationToken = default);
    Task<ProjectMemberDto> AddMemberAsync(Guid userId, Guid projectId, AddProjectMemberRequest request, CancellationToken cancellationToken = default);
    Task RemoveMemberAsync(Guid userId, Guid projectId, Guid memberId, CancellationToken cancellationToken = default);
    Task<ProjectDetailsDto> GetProjectDetailsAsync(Guid userId, Guid projectId, CancellationToken cancellationToken = default);
    Task<ProjectProgressDto> CalculateProjectProgressAsync(Guid projectId, CancellationToken cancellationToken = default);
}

public interface ITaskRequestService
{
    Task<TaskRequestDto> SendTaskRequestAsync(Guid senderUserId, SendTaskRequestRequest request, CancellationToken cancellationToken = default);
    Task<TaskRequestDto> AcceptTaskRequestAsync(Guid receiverUserId, Guid requestId, string? responseNote, CancellationToken cancellationToken = default);
    Task<TaskRequestDto> RejectTaskRequestAsync(Guid receiverUserId, Guid requestId, string? responseNote, CancellationToken cancellationToken = default);
    Task<TaskRequestDto> CancelTaskRequestAsync(Guid senderUserId, Guid requestId, CancellationToken cancellationToken = default);
}

public interface IProgressService
{
    Task<ProgressDto> GetTodayProgressAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<HabitProgressDto>> GetHabitProgressAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ProjectProgressDto>> GetProjectProgressAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<WeeklyActivityDto> GetWeeklyActivityAsync(Guid userId, DateOnly weekStartDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<TaskDto>> GetOverdueTasksAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);
}

public interface INotificationService
{
    Task<NotificationDto> CreateNotificationAsync(Guid userId, NotificationType type, string title, string? body, Guid? relatedTaskId = null, Guid? relatedProjectId = null, Guid? relatedHabitId = null, Guid? relatedTaskRequestId = null, CancellationToken cancellationToken = default);
    Task<NotificationDto> CreateTaskReminderAsync(Guid userId, Guid taskId, string title, string? body, CancellationToken cancellationToken = default);
    Task<NotificationDto> CreateHabitReminderAsync(Guid userId, Guid habitId, string title, string? body, CancellationToken cancellationToken = default);
    Task<NotificationDto> CreateTaskRequestNotificationAsync(Guid userId, Guid taskRequestId, string title, string? body, CancellationToken cancellationToken = default);
    Task<NotificationDto> CreateProjectInviteNotificationAsync(Guid userId, Guid projectId, string title, string? body, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default);
}

public interface IProjectPermissionService
{
    Task<bool> CanViewProjectAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CanManageProjectAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CanCreateTaskInSectionAsync(Guid projectId, Guid? sectionId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CanEditTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CanCompleteTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CanManageMembersAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
}
