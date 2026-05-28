using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Notifications;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.Common.Validation;
using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;
using IDo.Services.Rules;

namespace IDo.Services.Services;

public sealed class TodayService(IUnitOfWork unitOfWork) : ITodayService
{
    public async Task<TodayDashboardDto> GetTodayAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var personalTasks = await unitOfWork.Tasks.GetPersonalTasksByDateAsync(userId, date, cancellationToken);
        var projectTasks = await unitOfWork.Tasks.GetProjectTasksByDateAsync(userId, date, cancellationToken);
        var habits = await unitOfWork.Habits.GetActiveHabitsForDateAsync(userId, date, cancellationToken);
        var requests = await unitOfWork.TaskRequests.GetPendingRequestsForUserAsync(userId, cancellationToken);
        var combinedTasks = personalTasks.Concat(projectTasks).ToArray();
        var summary = new TodaySummaryDto(personalTasks.Count, habits.Count, projectTasks.Count, requests.Count, combinedTasks.Count(x => x.Status == IDoTaskStatus.Done), combinedTasks.Count(x => x.DueDate < date && x.Status != IDoTaskStatus.Done));
        return new TodayDashboardDto(date, personalTasks.Select(x => x.ToDto()).ToArray(), habits.Select(x => x.ToDto()).ToArray(), projectTasks.Select(x => x.ToDto()).ToArray(), requests.Select(x => x.ToDto()).ToArray(), summary);
    }
}

public sealed class TaskService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider, IProjectPermissionService permissions) : ITaskService
{
    public Task<TaskDto> CreatePersonalTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default) => CreateTaskAsync(userId, request with { ProjectId = null, SectionId = null }, IDoTaskType.Personal, cancellationToken);

    public Task<TaskDto> CreateProjectTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default) => CreateTaskAsync(userId, request, IDoTaskType.Project, cancellationToken);

    public async Task<TaskDto> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanEditTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot edit this task.");
        task.Title = request.Title.Trim();
        task.Description = request.Description;
        task.Color = request.Color;
        task.Icon = request.Icon;
        task.DueDate = request.DueDate;
        task.DueTime = request.DueTime;
        task.ReminderAtUtc = request.ReminderAtUtc;
        task.AssigneeUserId = request.AssigneeUserId;
        task.IsCountableInProgress = request.IsCountableInProgress;
        if (request.Status.HasValue) ApplyStatus(task, request.Status.Value);
        unitOfWork.Tasks.Update(task);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return task.ToDto();
    }

    public Task<TaskDto> CompleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default) => ChangeStatusAsync(userId, taskId, IDoTaskStatus.Done, cancellationToken);

    public async Task<TaskDto> ChangeStatusAsync(Guid userId, Guid taskId, IDoTaskStatus status, CancellationToken cancellationToken = default)
    {
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanCompleteTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot change this task.");
        ApplyStatus(task, status);
        unitOfWork.Tasks.Update(task);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return task.ToDto();
    }

    public async Task ArchiveTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanEditTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot archive this task.");
        ApplyStatus(task, IDoTaskStatus.Archived);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanEditTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot delete this task.");
        unitOfWork.Tasks.SoftDelete(task, userId);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<TaskCommentDto> AddCommentAsync(Guid userId, Guid taskId, CreateTaskCommentRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Body)) throw new RequestValidationException(["Comment body is required."]);
        _ = await RequireTask(taskId, cancellationToken);
        var comment = new TaskComment { TaskId = taskId, UserId = userId, Body = request.Body.Trim(), CreatedByUserId = userId };
        await unitOfWork.TaskComments.AddAsync(comment, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return comment.ToDto();
    }

    public async Task<TaskDetailsDto> GetTaskDetailsAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetTaskWithCommentsAsync(taskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");
        return new TaskDetailsDto(task.ToDto(), task.Comments.OrderBy(x => x.CreatedAtUtc).Select(x => x.ToDto()).ToArray(), task.SentRequests.Where(x => x.Status == TaskRequestStatus.Pending).Select(x => x.ToDto()).ToArray());
    }

    private async Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskRequest request, IDoTaskType type, CancellationToken cancellationToken)
    {
        RequestValidators.Validate(request);
        if (type == IDoTaskType.Project)
        {
            if (request.ProjectId is null) throw new RequestValidationException(["Project task requires ProjectId."]);
            if (!await permissions.CanCreateTaskInSectionAsync(request.ProjectId.Value, request.SectionId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot create a task in this project section.");
            if (request.AssigneeUserId.HasValue && !await unitOfWork.ProjectMembers.IsProjectMemberAsync(request.ProjectId.Value, request.AssigneeUserId.Value, cancellationToken)) throw new RequestValidationException(["Project task assignee must be an active project member."]);
        }

        var task = new IDoTask
        {
            CreatorUserId = userId,
            AssigneeUserId = request.AssigneeUserId ?? userId,
            ProjectId = request.ProjectId,
            SectionId = request.SectionId,
            HabitId = request.HabitId,
            Title = request.Title.Trim(),
            Description = request.Description,
            Color = request.Color,
            Icon = request.Icon,
            DueDate = request.DueDate,
            DueTime = request.DueTime,
            ReminderAtUtc = request.ReminderAtUtc,
            Type = type,
            IsCountableInProgress = request.IsCountableInProgress,
            CreatedByUserId = userId
        };
        await unitOfWork.Tasks.AddAsync(task, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return task.ToDto();
    }

    private async Task<IDoTask> RequireTask(Guid taskId, CancellationToken cancellationToken) => await unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");
    private void ApplyStatus(IDoTask task, IDoTaskStatus status)
    {
        task.Status = status;
        task.CompletedAtUtc = status == IDoTaskStatus.Done ? dateTimeProvider.UtcNow : null;
    }
}

public sealed class HabitService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider) : IHabitService
{
    public async Task<HabitDto> CreateHabitAsync(Guid userId, CreateHabitRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        var habit = new Habit { UserId = userId, Title = request.Title.Trim(), Description = request.Description, Color = request.Color, Icon = request.Icon, ScheduleType = request.ScheduleType, RequiredTimesPerWeek = request.RequiredTimesPerWeek, ReminderTime = request.ReminderTime, CreatedByUserId = userId };
        ApplySchedule(habit, request.ActiveDays, request.RestDays);
        await unitOfWork.Habits.AddAsync(habit, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return habit.ToDto();
    }

    public async Task<HabitDto> UpdateHabitAsync(Guid userId, Guid habitId, UpdateHabitRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        var habit = await unitOfWork.Habits.GetHabitWithLogsAsync(habitId, cancellationToken) ?? throw new KeyNotFoundException("Habit not found.");
        if (habit.UserId != userId) throw new UnauthorizedAccessException("User cannot update this habit.");
        habit.Title = request.Title.Trim();
        habit.Description = request.Description;
        habit.Color = request.Color;
        habit.Icon = request.Icon;
        habit.ScheduleType = request.ScheduleType;
        habit.RequiredTimesPerWeek = request.RequiredTimesPerWeek;
        habit.ReminderTime = request.ReminderTime;
        habit.IsActive = request.IsActive;
        habit.ScheduleDays.Clear();
        ApplySchedule(habit, request.ActiveDays, request.RestDays);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return habit.ToDto();
    }

    public async Task DeleteHabitAsync(Guid userId, Guid habitId, CancellationToken cancellationToken = default)
    {
        var habit = await unitOfWork.Habits.GetByIdAsync(habitId, cancellationToken) ?? throw new KeyNotFoundException("Habit not found.");
        if (habit.UserId != userId) throw new UnauthorizedAccessException("User cannot delete this habit.");
        unitOfWork.Habits.SoftDelete(habit, userId);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<HabitLogDto> CompleteHabitForDateAsync(Guid userId, Guid habitId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var habit = await unitOfWork.Habits.GetHabitWithLogsAsync(habitId, cancellationToken) ?? throw new KeyNotFoundException("Habit not found.");
        if (habit.UserId != userId) throw new UnauthorizedAccessException("User cannot complete this habit.");
        var status = HabitRules.IsScheduledActiveDay(habit, date) ? HabitLogStatus.Done : HabitLogStatus.OutOfSchedule;
        var log = await unitOfWork.HabitLogs.GetLogAsync(habitId, date, cancellationToken);
        if (log is null)
        {
            log = new HabitLog { HabitId = habitId, UserId = userId, Date = date };
            await unitOfWork.HabitLogs.AddAsync(log, cancellationToken);
            habit.Logs.Add(log);
        }
        log.Status = status;
        log.CompletedAtUtc = status == HabitLogStatus.Done ? dateTimeProvider.UtcNow : null;
        habit.CurrentStreak = HabitRules.CalculateStreak(habit, date);
        habit.BestStreak = Math.Max(habit.BestStreak, habit.CurrentStreak);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return log.ToDto();
    }

    public async Task<int> CalculateStreakAsync(Guid habitId, DateOnly throughDate, CancellationToken cancellationToken = default)
    {
        var habit = await unitOfWork.Habits.GetHabitWithLogsAsync(habitId, cancellationToken) ?? throw new KeyNotFoundException("Habit not found.");
        return HabitRules.CalculateStreak(habit, throughDate);
    }

    public async Task<decimal> CalculateSuccessRateAsync(Guid habitId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        var habit = await unitOfWork.Habits.GetHabitWithLogsAsync(habitId, cancellationToken) ?? throw new KeyNotFoundException("Habit not found.");
        return HabitRules.CalculateSuccessRate(habit, from, to);
    }

    public async Task<IReadOnlyCollection<HabitDto>> GetHabitsForTodayAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default) =>
        (await unitOfWork.Habits.GetActiveHabitsForDateAsync(userId, date, cancellationToken)).Select(x => x.ToDto()).ToArray();

    private static void ApplySchedule(Habit habit, IReadOnlyCollection<DayOfWeek> activeDays, IReadOnlyCollection<DayOfWeek> restDays)
    {
        foreach (var day in activeDays.Distinct()) habit.ScheduleDays.Add(new HabitScheduleDay { Habit = habit, DayOfWeek = day, DayType = HabitDayType.Active });
        foreach (var day in restDays.Distinct().Except(activeDays)) habit.ScheduleDays.Add(new HabitScheduleDay { Habit = habit, DayOfWeek = day, DayType = HabitDayType.Rest });
    }
}

public sealed class ProjectService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider, IProjectPermissionService permissions) : IProjectService
{
    public async Task<ProjectDto> CreateProjectAsync(Guid ownerUserId, CreateProjectRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        var project = new Project { OwnerUserId = ownerUserId, Title = request.Title.Trim(), Description = request.Description, Color = request.Color, Icon = request.Icon, CreatedByUserId = ownerUserId };
        var owner = new ProjectMember { Project = project, UserId = ownerUserId, Role = ProjectMemberRole.Owner, Status = ProjectMemberStatus.Active, JoinedAtUtc = dateTimeProvider.UtcNow };
        project.Members.Add(owner);
        await unitOfWork.Projects.AddAsync(project, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return project.ToDto();
    }

    public async Task<ProjectDto> UpdateProjectAsync(Guid userId, Guid projectId, UpdateProjectRequest request, CancellationToken cancellationToken = default)
    {
        var project = await RequireProject(projectId, cancellationToken);
        if (!await permissions.CanManageProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot manage this project.");
        project.Title = request.Title.Trim();
        project.Description = request.Description;
        project.Color = request.Color;
        project.Icon = request.Icon;
        project.Status = request.Status;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return project.ToDto();
    }

    public async Task ArchiveProjectAsync(Guid userId, Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await RequireProject(projectId, cancellationToken);
        if (!await permissions.CanManageProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot archive this project.");
        project.Status = ProjectStatus.Archived;
        project.ArchivedAtUtc = dateTimeProvider.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProjectSectionDto> AddSectionAsync(Guid userId, Guid projectId, CreateProjectSectionRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        if (!await permissions.CanManageProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot add sections.");
        if (request.AssignedUserId.HasValue && !await unitOfWork.ProjectMembers.IsProjectMemberAsync(projectId, request.AssignedUserId.Value, cancellationToken)) throw new RequestValidationException(["Assigned user must be an active project member."]);
        var section = new ProjectSection { ProjectId = projectId, Title = request.Title.Trim(), Description = request.Description, Order = request.Order, Visibility = request.Visibility, AssignedUserId = request.AssignedUserId, CreatedByUserId = userId };
        await unitOfWork.ProjectSections.AddAsync(section, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return section.ToDto();
    }

    public async Task<ProjectSectionDto> UpdateSectionAsync(Guid userId, Guid projectId, Guid sectionId, CreateProjectSectionRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        var section = await unitOfWork.ProjectSections.GetByIdAsync(sectionId, cancellationToken) ?? throw new KeyNotFoundException("Section not found.");
        if (section.ProjectId != projectId) throw new KeyNotFoundException("Section not found.");
        if (!await permissions.CanManageProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot update sections.");
        section.Title = request.Title.Trim();
        section.Description = request.Description;
        section.Order = request.Order;
        section.Visibility = request.Visibility;
        section.AssignedUserId = request.AssignedUserId;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return section.ToDto();
    }

    public async Task<ProjectMemberDto> AddMemberAsync(Guid userId, Guid projectId, AddProjectMemberRequest request, CancellationToken cancellationToken = default)
    {
        if (!await permissions.CanManageMembersAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot manage members.");
        var member = new ProjectMember { ProjectId = projectId, UserId = request.UserId, Role = request.Role, Status = ProjectMemberStatus.Active, JoinedAtUtc = dateTimeProvider.UtcNow };
        await unitOfWork.ProjectMembers.AddAsync(member, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return member.ToDto();
    }

    public async Task RemoveMemberAsync(Guid userId, Guid projectId, Guid memberId, CancellationToken cancellationToken = default)
    {
        if (!await permissions.CanManageMembersAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot manage members.");
        var member = await unitOfWork.ProjectMembers.GetByIdAsync(memberId, cancellationToken) ?? throw new KeyNotFoundException("Member not found.");
        member.Status = ProjectMemberStatus.Removed;
        member.RemovedAtUtc = dateTimeProvider.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProjectDetailsDto> GetProjectDetailsAsync(Guid userId, Guid projectId, CancellationToken cancellationToken = default)
    {
        if (!await permissions.CanViewProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot view this project.");
        var project = await unitOfWork.Projects.GetProjectDetailsAsync(projectId, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
        var progress = await CalculateProjectProgressAsync(projectId, cancellationToken);
        return new ProjectDetailsDto(project.ToDto(), project.Sections.Select(x => x.ToDto()).ToArray(), project.Members.Select(x => x.ToDto()).ToArray(), project.Tasks.Select(x => x.ToDto()).ToArray(), progress);
    }

    public async Task<ProjectProgressDto> CalculateProjectProgressAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await unitOfWork.Projects.GetProjectWithSectionsAndTasksAsync(projectId, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
        var countable = project.Tasks.Where(x => x.IsCountableInProgress && x.Status != IDoTaskStatus.Archived && !x.IsDeleted).ToArray();
        return new ProjectProgressDto(projectId, countable.Count(x => x.Status == IDoTaskStatus.Done), countable.Length, ProjectRules.CalculateProgressPercentage(project.Tasks));
    }

    private async Task<Project> RequireProject(Guid projectId, CancellationToken cancellationToken) => await unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
}

public sealed class TaskRequestService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider, INotificationService notifications) : ITaskRequestService
{
    public async Task<TaskRequestDto> SendTaskRequestAsync(Guid senderUserId, SendTaskRequestRequest request, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetByIdAsync(request.TaskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");
        if (task.ProjectId.HasValue && !await unitOfWork.ProjectMembers.IsProjectMemberAsync(task.ProjectId.Value, request.ReceiverUserId, cancellationToken)) throw new RequestValidationException(["Task request receiver must be an active project member."]);
        if (await unitOfWork.TaskRequests.GetTaskPendingRequestAsync(task.Id, cancellationToken) is not null) throw new RequestValidationException(["Task already has a pending request."]);
        var taskRequest = new TaskRequest { TaskId = task.Id, SenderUserId = senderUserId, ReceiverUserId = request.ReceiverUserId, Message = request.Message };
        await unitOfWork.TaskRequests.AddAsync(taskRequest, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await notifications.CreateTaskRequestNotificationAsync(request.ReceiverUserId, taskRequest.Id, "Task request", task.Title, cancellationToken);
        return taskRequest.ToDto();
    }

    public Task<TaskRequestDto> AcceptTaskRequestAsync(Guid receiverUserId, Guid requestId, string? responseNote, CancellationToken cancellationToken = default) => RespondAsync(receiverUserId, requestId, TaskRequestStatus.Accepted, responseNote, cancellationToken);
    public Task<TaskRequestDto> RejectTaskRequestAsync(Guid receiverUserId, Guid requestId, string? responseNote, CancellationToken cancellationToken = default) => RespondAsync(receiverUserId, requestId, TaskRequestStatus.Rejected, responseNote, cancellationToken);

    public async Task<TaskRequestDto> CancelTaskRequestAsync(Guid senderUserId, Guid requestId, CancellationToken cancellationToken = default)
    {
        var request = await unitOfWork.TaskRequests.GetByIdAsync(requestId, cancellationToken) ?? throw new KeyNotFoundException("Task request not found.");
        if (request.SenderUserId != senderUserId) throw new UnauthorizedAccessException("Only sender can cancel this request.");
        if (request.Status != TaskRequestStatus.Pending) throw new RequestValidationException(["Only pending requests can be cancelled."]);
        request.Status = TaskRequestStatus.Cancelled;
        request.RespondedAtUtc = dateTimeProvider.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return request.ToDto();
    }

    private async Task<TaskRequestDto> RespondAsync(Guid receiverUserId, Guid requestId, TaskRequestStatus status, string? responseNote, CancellationToken cancellationToken)
    {
        var request = await unitOfWork.TaskRequests.GetByIdAsync(requestId, cancellationToken) ?? throw new KeyNotFoundException("Task request not found.");
        if (request.ReceiverUserId != receiverUserId) throw new UnauthorizedAccessException("Only receiver can respond to this request.");
        if (request.Status != TaskRequestStatus.Pending) throw new RequestValidationException(["Only pending requests can be answered."]);
        request.Status = status;
        request.ResponseNote = responseNote;
        request.RespondedAtUtc = dateTimeProvider.UtcNow;
        var task = await unitOfWork.Tasks.GetByIdAsync(request.TaskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");
        if (status == TaskRequestStatus.Accepted) task.AssigneeUserId = receiverUserId;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await notifications.CreateTaskRequestNotificationAsync(request.SenderUserId, request.Id, status == TaskRequestStatus.Accepted ? "Task request accepted" : "Task request rejected", task.Title, cancellationToken);
        return request.ToDto();
    }
}

public sealed class ProgressService(IUnitOfWork unitOfWork, IProjectService projects) : IProgressService
{
    public async Task<ProgressDto> GetTodayProgressAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var tasks = await unitOfWork.Tasks.GetTodayTasksAsync(userId, date, cancellationToken);
        var total = tasks.Count(x => x.IsCountableInProgress && x.Status != IDoTaskStatus.Archived);
        var done = tasks.Count(x => x.IsCountableInProgress && x.Status == IDoTaskStatus.Done);
        return new ProgressDto(done, total, total == 0 ? 0 : decimal.Round(done * 100m / total, 2));
    }

    public async Task<IReadOnlyCollection<HabitProgressDto>> GetHabitProgressAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        var userHabits = await unitOfWork.Habits.GetUserHabitsAsync(userId, cancellationToken);
        var result = new List<HabitProgressDto>();
        foreach (var habit in userHabits)
        {
            var logs = await unitOfWork.HabitLogs.GetLogsInRangeAsync(habit.Id, from, to, cancellationToken);
            foreach (var log in logs) habit.Logs.Add(log);
            var activeDates = Enumerable.Range(0, to.DayNumber - from.DayNumber + 1).Select(from.AddDays).Where(x => HabitRules.IsScheduledActiveDay(habit, x)).ToArray();
            result.Add(new HabitProgressDto(habit.Id, logs.Count(x => x.Status == HabitLogStatus.Done && activeDates.Contains(x.Date)), activeDates.Length, HabitRules.CalculateStreak(habit, to), habit.BestStreak, HabitRules.CalculateSuccessRate(habit, from, to)));
        }
        return result;
    }

    public async Task<IReadOnlyCollection<ProjectProgressDto>> GetProjectProgressAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var userProjects = await unitOfWork.Projects.GetUserProjectsAsync(userId, cancellationToken);
        var result = new List<ProjectProgressDto>();
        foreach (var project in userProjects) result.Add(await projects.CalculateProjectProgressAsync(project.Id, cancellationToken));
        return result;
    }

    public async Task<WeeklyActivityDto> GetWeeklyActivityAsync(Guid userId, DateOnly weekStartDate, CancellationToken cancellationToken = default)
    {
        var tasks = await unitOfWork.Tasks.GetTodayTasksAsync(userId, weekStartDate, cancellationToken);
        var map = Enumerable.Range(0, 7).Select(weekStartDate.AddDays).ToDictionary(x => x, x => tasks.Count(t => t.CompletedAtUtc.HasValue && DateOnly.FromDateTime(t.CompletedAtUtc.Value) == x));
        return new WeeklyActivityDto(weekStartDate, map);
    }

    public async Task<IReadOnlyCollection<TaskDto>> GetOverdueTasksAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default) =>
        (await unitOfWork.Tasks.GetOverdueTasksAsync(userId, date, cancellationToken)).Select(x => x.ToDto()).ToArray();
}

public sealed class NotificationService(IUnitOfWork unitOfWork, INotificationPublisher publisher) : INotificationService
{
    public async Task<NotificationDto> CreateNotificationAsync(Guid userId, NotificationType type, string title, string? body, Guid? relatedTaskId = null, Guid? relatedProjectId = null, Guid? relatedHabitId = null, Guid? relatedTaskRequestId = null, CancellationToken cancellationToken = default)
    {
        var notification = new Notification { UserId = userId, Type = type, Title = title, Body = body, RelatedTaskId = relatedTaskId, RelatedProjectId = relatedProjectId, RelatedHabitId = relatedHabitId, RelatedTaskRequestId = relatedTaskRequestId };
        await unitOfWork.Notifications.AddAsync(notification, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(userId, title, body, cancellationToken);
        return notification.ToDto();
    }

    public Task<NotificationDto> CreateTaskReminderAsync(Guid userId, Guid taskId, string title, string? body, CancellationToken cancellationToken = default) => CreateNotificationAsync(userId, NotificationType.TaskReminder, title, body, relatedTaskId: taskId, cancellationToken: cancellationToken);
    public Task<NotificationDto> CreateHabitReminderAsync(Guid userId, Guid habitId, string title, string? body, CancellationToken cancellationToken = default) => CreateNotificationAsync(userId, NotificationType.HabitReminder, title, body, relatedHabitId: habitId, cancellationToken: cancellationToken);
    public Task<NotificationDto> CreateTaskRequestNotificationAsync(Guid userId, Guid taskRequestId, string title, string? body, CancellationToken cancellationToken = default) => CreateNotificationAsync(userId, NotificationType.TaskRequest, title, body, relatedTaskRequestId: taskRequestId, cancellationToken: cancellationToken);
    public Task<NotificationDto> CreateProjectInviteNotificationAsync(Guid userId, Guid projectId, string title, string? body, CancellationToken cancellationToken = default) => CreateNotificationAsync(userId, NotificationType.ProjectInvite, title, body, relatedProjectId: projectId, cancellationToken: cancellationToken);
    public async Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        await unitOfWork.Notifications.MarkAsReadAsync(notificationId, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

public sealed class ProjectPermissionService(IUnitOfWork unitOfWork) : IProjectPermissionService
{
    public async Task<bool> CanViewProjectAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default) => await unitOfWork.ProjectMembers.IsProjectMemberAsync(projectId, userId, cancellationToken);
    public async Task<bool> CanManageProjectAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default) => await unitOfWork.ProjectMembers.IsProjectOwnerAsync(projectId, userId, cancellationToken);
    public Task<bool> CanManageMembersAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default) => CanManageProjectAsync(projectId, userId, cancellationToken);

    public async Task<bool> CanCreateTaskInSectionAsync(Guid projectId, Guid? sectionId, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await CanManageProjectAsync(projectId, userId, cancellationToken)) return true;
        if (!await unitOfWork.ProjectMembers.IsProjectMemberAsync(projectId, userId, cancellationToken)) return false;
        if (sectionId is null) return true;
        var section = await unitOfWork.ProjectSections.GetByIdAsync(sectionId.Value, cancellationToken);
        return section is not null && section.ProjectId == projectId && (section.Visibility == SectionVisibility.Public || section.AssignedUserId == userId);
    }

    public async Task<bool> CanEditTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task is null) return false;
        if (task.ProjectId is null) return task.CreatorUserId == userId || task.AssigneeUserId == userId;
        if (await CanManageProjectAsync(task.ProjectId.Value, userId, cancellationToken)) return true;
        if (task.SectionId.HasValue) return await CanCreateTaskInSectionAsync(task.ProjectId.Value, task.SectionId, userId, cancellationToken);
        return task.CreatorUserId == userId || task.AssigneeUserId == userId;
    }

    public Task<bool> CanCompleteTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken = default) => CanEditTaskAsync(taskId, userId, cancellationToken);
}
