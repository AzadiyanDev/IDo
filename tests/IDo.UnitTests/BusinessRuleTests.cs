using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Realtime;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;
using IDo.Infrastructure.Persistence;
using IDo.Infrastructure.Persistence.Repositories;
using IDo.Services.Rules;
using IDo.Services.Services;
using Microsoft.EntityFrameworkCore;

namespace IDo.UnitTests;

public sealed class BusinessRuleTests
{
    [Fact]
    public void Habit_streak_calculation_counts_consecutive_completed_active_days()
    {
        var habit = HabitWithActiveWeekdays();
        habit.Logs.Add(new HabitLog { Date = new DateOnly(2026, 5, 25), Status = HabitLogStatus.Done });
        habit.Logs.Add(new HabitLog { Date = new DateOnly(2026, 5, 26), Status = HabitLogStatus.Done });
        habit.Logs.Add(new HabitLog { Date = new DateOnly(2026, 5, 27), Status = HabitLogStatus.Done });
        habit.Logs.Add(new HabitLog { Date = new DateOnly(2026, 5, 27), Status = HabitLogStatus.Done });

        Assert.Equal(3, HabitRules.CalculateStreak(habit, new DateOnly(2026, 5, 27)));
    }

    [Fact]
    public void Habit_success_rate_excludes_rest_and_out_of_schedule_days()
    {
        var habit = HabitWithActiveWeekdays();
        habit.Logs.Add(new HabitLog { Date = new DateOnly(2026, 5, 25), Status = HabitLogStatus.Done });
        habit.Logs.Add(new HabitLog { Date = new DateOnly(2026, 5, 25), Status = HabitLogStatus.Done });
        habit.Logs.Add(new HabitLog { Date = new DateOnly(2026, 5, 26), Status = HabitLogStatus.Missed });
        habit.Logs.Add(new HabitLog { Date = new DateOnly(2026, 5, 31), Status = HabitLogStatus.RestDay });

        var rate = HabitRules.CalculateSuccessRate(habit, new DateOnly(2026, 5, 25), new DateOnly(2026, 5, 31));

        Assert.Equal(20m, rate);
    }

    [Fact]
    public void Rest_day_does_not_break_streak()
    {
        var habit = HabitWithActiveWeekdays();
        habit.Logs.Add(new HabitLog { Date = new DateOnly(2026, 5, 28), Status = HabitLogStatus.Done });
        habit.Logs.Add(new HabitLog { Date = new DateOnly(2026, 5, 29), Status = HabitLogStatus.Done });

        Assert.Equal(2, HabitRules.CalculateStreak(habit, new DateOnly(2026, 5, 31)));
    }

    [Fact]
    public void Project_progress_uses_done_countable_tasks()
    {
        var tasks = new[]
        {
            new IDoTask { IsCountableInProgress = true, Status = IDoTaskStatus.Done },
            new IDoTask { IsCountableInProgress = true, Status = IDoTaskStatus.Todo },
            new IDoTask { IsCountableInProgress = false, Status = IDoTaskStatus.Done }
        };

        Assert.Equal(50m, ProjectRules.CalculateProgressPercentage(tasks));
    }

    [Fact]
    public void Archived_tasks_are_excluded_from_project_progress()
    {
        var tasks = new[]
        {
            new IDoTask { IsCountableInProgress = true, Status = IDoTaskStatus.Done },
            new IDoTask { IsCountableInProgress = true, Status = IDoTaskStatus.Archived }
        };

        Assert.Equal(100m, ProjectRules.CalculateProgressPercentage(tasks));
    }

    [Fact]
    public async Task Create_project_creates_active_owner_member()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var service = CreateProjectService(uow);

        var project = await service.CreateProjectAsync(ownerId, new("Launch", "Build launch plan", "#3EAEFF", "rocket_launch"));

        var member = await uow.ProjectMembers.GetMembershipAsync(project.Id, ownerId);
        Assert.NotNull(member);
        Assert.Equal(ProjectMemberRole.Owner, member!.Role);
        Assert.Equal(ProjectMemberStatus.Active, member.Status);
    }

    [Fact]
    public async Task Invite_user_creates_pending_project_request_without_active_member()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var service = CreateProjectService(uow);
        var project = await service.CreateProjectAsync(ownerId, new("Project", null, null, null));

        var request = await service.InviteUserToProjectAsync(ownerId, project.Id, new(receiverId, null, "join"));

        Assert.Equal(CollaborationRequestType.ProjectInvite, request.Type);
        Assert.Equal(TaskRequestStatus.Pending, request.Status);
        Assert.False(await uow.ProjectMembers.IsProjectMemberAsync(project.Id, receiverId));
    }

    [Fact]
    public async Task Accept_project_invite_activates_member()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var projectService = CreateProjectService(uow);
        var requestService = CreateTaskRequestService(uow);
        var project = await projectService.CreateProjectAsync(ownerId, new("Project", null, null, null));
        var request = await projectService.InviteUserToProjectAsync(ownerId, project.Id, new(receiverId, null, "join"));

        await requestService.AcceptTaskRequestAsync(receiverId, request.Id, null);

        Assert.True(await uow.ProjectMembers.IsProjectMemberAsync(project.Id, receiverId));
    }

    [Fact]
    public async Task Reject_project_invite_does_not_activate_member()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var projectService = CreateProjectService(uow);
        var requestService = CreateTaskRequestService(uow);
        var project = await projectService.CreateProjectAsync(ownerId, new("Project", null, null, null));
        var request = await projectService.InviteUserToProjectAsync(ownerId, project.Id, new(receiverId, null, "join"));

        await requestService.RejectTaskRequestAsync(receiverId, request.Id, "no");

        Assert.False(await uow.ProjectMembers.IsProjectMemberAsync(project.Id, receiverId));
    }

    [Fact]
    public async Task Task_request_accept_flow_assigns_receiver()
    {
        var (uow, _) = CreateUnitOfWork();
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var task = new IDoTask { CreatorUserId = senderId, AssigneeUserId = senderId, Title = "Transfer" };
        await uow.Tasks.AddAsync(task);
        await uow.SaveChangesAsync();
        var service = new TaskRequestService(uow, new FixedDateTimeProvider(), new NotificationService(uow, new NullPublisher()), new ProjectPermissionService(uow));

        var sent = await service.SendTaskRequestAsync(senderId, new(task.Id, receiverId, "please take this"));
        await service.AcceptTaskRequestAsync(receiverId, sent.Id, "accepted");

        var updatedTask = await uow.Tasks.GetByIdAsync(task.Id);
        Assert.Equal(receiverId, updatedTask!.AssigneeUserId);
    }

    [Fact]
    public async Task Task_request_reject_flow_keeps_previous_assignee()
    {
        var (uow, _) = CreateUnitOfWork();
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var task = new IDoTask { CreatorUserId = senderId, AssigneeUserId = senderId, Title = "Transfer" };
        await uow.Tasks.AddAsync(task);
        await uow.SaveChangesAsync();
        var service = new TaskRequestService(uow, new FixedDateTimeProvider(), new NotificationService(uow, new NullPublisher()), new ProjectPermissionService(uow));

        var sent = await service.SendTaskRequestAsync(senderId, new(task.Id, receiverId, "please take this"));
        await service.RejectTaskRequestAsync(receiverId, sent.Id, "no");

        var updatedTask = await uow.Tasks.GetByIdAsync(task.Id);
        Assert.Equal(senderId, updatedTask!.AssigneeUserId);
    }

    [Fact]
    public async Task Assign_section_creates_pending_request()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var project = new Project { OwnerUserId = ownerId, Title = "Project" };
        var section = new ProjectSection { ProjectId = project.Id, Title = "Section" };
        await uow.Projects.AddAsync(project);
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = ownerId, Role = ProjectMemberRole.Owner, Status = ProjectMemberStatus.Active });
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = memberId, Role = ProjectMemberRole.Member, Status = ProjectMemberStatus.Active });
        await uow.ProjectSections.AddAsync(section);
        await uow.SaveChangesAsync();
        var service = CreateProjectService(uow);

        var request = await service.RequestAssignSectionAsync(ownerId, project.Id, section.Id, new(memberId, "please take this"));
        var updatedSection = await uow.ProjectSections.GetByIdAsync(section.Id);

        Assert.Equal(CollaborationRequestType.SectionAssignment, request.Type);
        Assert.Equal(TaskRequestStatus.Pending, request.Status);
        Assert.Equal(memberId, updatedSection!.PendingAssignedUserId);
        Assert.Equal(ProjectSectionAssignmentStatus.Pending, updatedSection.AssignmentStatus);
        Assert.Null(updatedSection.AssignedUserId);
    }

    [Fact]
    public async Task Assign_section_to_invited_user_creates_second_pending_request()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var invitedUserId = Guid.NewGuid();
        var projectService = CreateProjectService(uow);
        var requestService = CreateTaskRequestService(uow);
        var project = await projectService.CreateProjectAsync(ownerId, new("Project", null, null, null));
        var section = await projectService.AddSectionAsync(ownerId, project.Id, new("Section", null, null, null, 1, SectionVisibility.Public, null));

        var invite = await projectService.InviteUserToProjectAsync(ownerId, project.Id, new(invitedUserId, null, "join"));
        var assignment = await projectService.RequestAssignSectionAsync(ownerId, project.Id, section.Id, new(invitedUserId, "please take this"));
        var updatedSection = await uow.ProjectSections.GetByIdAsync(section.Id);

        Assert.Equal(CollaborationRequestType.ProjectInvite, invite.Type);
        Assert.Equal(CollaborationRequestType.SectionAssignment, assignment.Type);
        Assert.Equal(TaskRequestStatus.Pending, assignment.Status);
        Assert.False(await uow.ProjectMembers.IsProjectMemberAsync(project.Id, invitedUserId));
        Assert.Equal(invitedUserId, updatedSection!.PendingAssignedUserId);

        await requestService.AcceptTaskRequestAsync(invitedUserId, assignment.Id, null);
        var acceptedInvite = await uow.TaskRequests.GetByIdAsync(invite.Id);
        updatedSection = await uow.ProjectSections.GetByIdAsync(section.Id);
        var details = await projectService.GetProjectDetailsAsync(ownerId, project.Id);
        var sectionDetails = details.Sections.Single(item => item.Id == section.Id);

        Assert.True(await uow.ProjectMembers.IsProjectMemberAsync(project.Id, invitedUserId));
        Assert.Equal(TaskRequestStatus.Accepted, acceptedInvite!.Status);
        Assert.Equal(invitedUserId, updatedSection!.AssignedUserId);
        Assert.Contains(invitedUserId, sectionDetails.AssignedUserIds);
    }

    [Fact]
    public async Task Accept_section_assignment_sets_assigned_user()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var project = new Project { OwnerUserId = ownerId, Title = "Project" };
        var section = new ProjectSection { ProjectId = project.Id, Title = "Section" };
        await uow.Projects.AddAsync(project);
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = ownerId, Role = ProjectMemberRole.Owner, Status = ProjectMemberStatus.Active });
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = memberId, Role = ProjectMemberRole.Member, Status = ProjectMemberStatus.Active });
        await uow.ProjectSections.AddAsync(section);
        await uow.SaveChangesAsync();
        var projectService = CreateProjectService(uow);
        var requestService = CreateTaskRequestService(uow);
        var request = await projectService.RequestAssignSectionAsync(ownerId, project.Id, section.Id, new(memberId, null));

        await requestService.AcceptTaskRequestAsync(memberId, request.Id, null);
        var updatedSection = await uow.ProjectSections.GetByIdAsync(section.Id);

        Assert.Equal(memberId, updatedSection!.AssignedUserId);
        Assert.Null(updatedSection.PendingAssignedUserId);
        Assert.Equal(ProjectSectionAssignmentStatus.Accepted, updatedSection.AssignmentStatus);
    }

    [Fact]
    public async Task Assign_task_creates_pending_request_and_accept_assigns_receiver()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var project = new Project { OwnerUserId = ownerId, Title = "Project" };
        var task = new IDoTask { CreatorUserId = ownerId, AssigneeUserId = ownerId, ProjectId = project.Id, Title = "Build", Type = IDoTaskType.Project };
        await uow.Projects.AddAsync(project);
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = ownerId, Role = ProjectMemberRole.Owner, Status = ProjectMemberStatus.Active });
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = memberId, Role = ProjectMemberRole.Member, Status = ProjectMemberStatus.Active });
        await uow.Tasks.AddAsync(task);
        await uow.SaveChangesAsync();
        var service = CreateTaskRequestService(uow);
        var projectService = CreateProjectService(uow);

        var request = await service.SendTaskAssignmentRequestAsync(ownerId, task.Id, new(memberId, "take it"));
        await service.AcceptTaskRequestAsync(memberId, request.Id, null);
        var updatedTask = await uow.Tasks.GetByIdAsync(task.Id);
        var acceptedRequest = await uow.TaskRequests.GetByIdAsync(request.Id);

        Assert.Equal(CollaborationRequestType.TaskAssignment, request.Type);
        Assert.Equal(ownerId, updatedTask!.AssigneeUserId);
        Assert.Null(updatedTask.PendingAssigneeUserId);
        Assert.Equal(ProjectTaskAssignmentStatus.Accepted, updatedTask.AssignmentStatus);
        Assert.Equal(TaskRequestStatus.Accepted, acceptedRequest!.Status);
        var taskDetails = (await projectService.GetProjectDetailsAsync(ownerId, project.Id)).Tasks.Single(item => item.Id == task.Id);
        Assert.Contains(ownerId, taskDetails.AssignedUserIds);
        Assert.Contains(memberId, taskDetails.AssignedUserIds);
    }

    [Fact]
    public async Task Assign_task_to_invited_user_creates_second_pending_request()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var invitedUserId = Guid.NewGuid();
        var project = new Project { OwnerUserId = ownerId, Title = "Project" };
        var task = new IDoTask { CreatorUserId = ownerId, AssigneeUserId = ownerId, ProjectId = project.Id, Title = "Build", Type = IDoTaskType.Project };
        await uow.Projects.AddAsync(project);
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = ownerId, Role = ProjectMemberRole.Owner, Status = ProjectMemberStatus.Active });
        await uow.Tasks.AddAsync(task);
        await uow.SaveChangesAsync();
        var projectService = CreateProjectService(uow);
        var requestService = CreateTaskRequestService(uow);

        var invite = await projectService.InviteUserToProjectAsync(ownerId, project.Id, new(invitedUserId, null, "join"));
        var assignment = await requestService.SendTaskAssignmentRequestAsync(ownerId, task.Id, new(invitedUserId, "take it"));
        var updatedTask = await uow.Tasks.GetByIdAsync(task.Id);

        Assert.Equal(CollaborationRequestType.ProjectInvite, invite.Type);
        Assert.Equal(CollaborationRequestType.TaskAssignment, assignment.Type);
        Assert.Equal(TaskRequestStatus.Pending, assignment.Status);
        Assert.False(await uow.ProjectMembers.IsProjectMemberAsync(project.Id, invitedUserId));
        Assert.Equal(invitedUserId, updatedTask!.PendingAssigneeUserId);

        await requestService.AcceptTaskRequestAsync(invitedUserId, assignment.Id, null);
        var acceptedInvite = await uow.TaskRequests.GetByIdAsync(invite.Id);
        updatedTask = await uow.Tasks.GetByIdAsync(task.Id);

        Assert.True(await uow.ProjectMembers.IsProjectMemberAsync(project.Id, invitedUserId));
        Assert.Equal(TaskRequestStatus.Accepted, acceptedInvite!.Status);
        Assert.Equal(ownerId, updatedTask!.AssigneeUserId);
        Assert.Null(updatedTask.PendingAssigneeUserId);
    }

    [Fact]
    public async Task Reject_task_assignment_keeps_previous_assigned_user()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var project = new Project { OwnerUserId = ownerId, Title = "Project" };
        var task = new IDoTask { CreatorUserId = ownerId, AssigneeUserId = ownerId, ProjectId = project.Id, Title = "Build", Type = IDoTaskType.Project };
        await uow.Projects.AddAsync(project);
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = ownerId, Role = ProjectMemberRole.Owner, Status = ProjectMemberStatus.Active });
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = memberId, Role = ProjectMemberRole.Member, Status = ProjectMemberStatus.Active });
        await uow.Tasks.AddAsync(task);
        await uow.SaveChangesAsync();
        var service = CreateTaskRequestService(uow);

        var request = await service.SendTaskAssignmentRequestAsync(ownerId, task.Id, new(memberId, "take it"));
        await service.RejectTaskRequestAsync(memberId, request.Id, null);
        var updatedTask = await uow.Tasks.GetByIdAsync(task.Id);

        Assert.Equal(ownerId, updatedTask!.AssigneeUserId);
        Assert.Null(updatedTask.PendingAssigneeUserId);
        Assert.Equal(ProjectTaskAssignmentStatus.Rejected, updatedTask.AssignmentStatus);
    }

    [Fact]
    public async Task Today_dashboard_counts_category_completion()
    {
        var (uow, _) = CreateUnitOfWork();
        var userId = Guid.NewGuid();
        var today = new DateOnly(2026, 5, 29);
        var project = new Project { OwnerUserId = userId, Title = "Project" };
        var habit = new Habit { UserId = userId, Title = "Read", ScheduleType = HabitScheduleType.SpecificDays, IsActive = true };
        habit.ScheduleDays.Add(new HabitScheduleDay { Habit = habit, DayOfWeek = today.DayOfWeek, DayType = HabitDayType.Active });

        await uow.Projects.AddAsync(project);
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = userId, Role = ProjectMemberRole.Owner, Status = ProjectMemberStatus.Active });
        await uow.Tasks.AddAsync(new IDoTask { CreatorUserId = userId, AssigneeUserId = userId, Title = "Todo done", DueDate = today, Status = IDoTaskStatus.Done, Type = IDoTaskType.Personal });
        await uow.Tasks.AddAsync(new IDoTask { CreatorUserId = userId, AssigneeUserId = userId, Title = "Todo open", DueDate = today, Status = IDoTaskStatus.Todo, Type = IDoTaskType.Personal });
        await uow.Tasks.AddAsync(new IDoTask { CreatorUserId = userId, AssigneeUserId = userId, ProjectId = project.Id, Title = "Project done", DueDate = today, Status = IDoTaskStatus.Done, Type = IDoTaskType.Project });
        await uow.Habits.AddAsync(habit);
        await uow.HabitLogs.AddAsync(new HabitLog { HabitId = habit.Id, UserId = userId, Date = today, Status = HabitLogStatus.Done });
        await uow.SaveChangesAsync();
        var service = new TodayService(uow);

        var dashboard = await service.GetTodayAsync(userId, today);

        Assert.Equal(2, dashboard.Summary.PersonalTaskCount);
        Assert.Equal(1, dashboard.Summary.PersonalTaskDoneCount);
        Assert.Equal(1, dashboard.Summary.HabitCount);
        Assert.Equal(1, dashboard.Summary.HabitDoneCount);
        Assert.Equal(1, dashboard.Summary.ProjectTaskCount);
        Assert.Equal(1, dashboard.Summary.ProjectTaskDoneCount);
        Assert.Equal(75m, dashboard.Summary.DonePercentage);
        Assert.Single(dashboard.ActiveProjects);
    }

    [Fact]
    public async Task Rollover_unfinished_tasks_moves_yesterdays_open_tasks_to_target_date()
    {
        var (uow, _) = CreateUnitOfWork();
        var userId = Guid.NewGuid();
        var yesterday = new DateOnly(2026, 5, 28);
        var today = new DateOnly(2026, 5, 29);
        var openTask = new IDoTask { CreatorUserId = userId, AssigneeUserId = userId, Title = "Open", DueDate = yesterday, Status = IDoTaskStatus.Todo, Type = IDoTaskType.Personal };
        var doneTask = new IDoTask { CreatorUserId = userId, AssigneeUserId = userId, Title = "Done", DueDate = yesterday, Status = IDoTaskStatus.Done, Type = IDoTaskType.Personal };

        await uow.Tasks.AddAsync(openTask);
        await uow.Tasks.AddAsync(doneTask);
        await uow.SaveChangesAsync();
        var service = CreateTaskService(uow);

        var result = await service.RolloverUnfinishedTasksAsync(userId, new(yesterday, today));

        Assert.Equal(1, result.MovedCount);
        Assert.Equal(today, openTask.DueDate);
        Assert.Equal(yesterday, doneTask.DueDate);
        Assert.Contains(result.MovedTasks, task => task.Id == openTask.Id && task.DueDate == today);
    }

    [Fact]
    public async Task Weekly_activity_counts_completed_tasks_across_the_requested_week()
    {
        var (uow, _) = CreateUnitOfWork();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var weekStart = new DateOnly(2026, 5, 25);

        await uow.Tasks.AddAsync(new IDoTask { CreatorUserId = userId, AssigneeUserId = userId, Title = "Monday done", Status = IDoTaskStatus.Done, CompletedAtUtc = new DateTime(2026, 5, 25, 10, 0, 0) });
        await uow.Tasks.AddAsync(new IDoTask { CreatorUserId = userId, AssigneeUserId = userId, Title = "Wednesday done", Status = IDoTaskStatus.Done, CompletedAtUtc = new DateTime(2026, 5, 27, 18, 30, 0) });
        await uow.Tasks.AddAsync(new IDoTask { CreatorUserId = userId, AssigneeUserId = userId, Title = "Previous week", Status = IDoTaskStatus.Done, CompletedAtUtc = new DateTime(2026, 5, 24, 18, 30, 0) });
        await uow.Tasks.AddAsync(new IDoTask { CreatorUserId = otherUserId, AssigneeUserId = otherUserId, Title = "Other user", Status = IDoTaskStatus.Done, CompletedAtUtc = new DateTime(2026, 5, 27, 18, 30, 0) });
        await uow.SaveChangesAsync();
        var projectService = new ProjectService(uow, new FixedDateTimeProvider(), new ProjectPermissionService(uow), new NullIdentityAccountService(), new NotificationService(uow, new NullPublisher()));
        var service = new ProgressService(uow, projectService);

        var activity = await service.GetWeeklyActivityAsync(userId, weekStart);

        Assert.Equal(weekStart, activity.WeekStartDate);
        Assert.Equal(1, activity.CompletedCountByDate[weekStart]);
        Assert.Equal(1, activity.CompletedCountByDate[weekStart.AddDays(2)]);
        Assert.Equal(0, activity.CompletedCountByDate[weekStart.AddDays(6)]);
        Assert.Equal(2, activity.CompletedCountByDate.Values.Sum());
    }

    [Fact]
    public async Task Completing_habit_creates_one_log_and_updates_streak()
    {
        var (uow, _) = CreateUnitOfWork();
        var userId = Guid.NewGuid();
        var date = new DateOnly(2026, 5, 29);
        var habit = new Habit { UserId = userId, Title = "Read", ScheduleType = HabitScheduleType.SpecificDays, IsActive = true };
        habit.ScheduleDays.Add(new HabitScheduleDay { Habit = habit, DayOfWeek = date.DayOfWeek, DayType = HabitDayType.Active });
        await uow.Habits.AddAsync(habit);
        await uow.SaveChangesAsync();
        var service = new HabitService(uow, new FixedDateTimeProvider());

        var log = await service.CompleteHabitForDateAsync(userId, habit.Id, date);
        var updatedHabit = await uow.Habits.GetHabitWithLogsAsync(habit.Id);

        Assert.Equal(HabitLogStatus.Done, log.Status);
        Assert.Equal(1, updatedHabit!.CurrentStreak);
        Assert.Single(updatedHabit.Logs, item => item.Date == date);
    }

    [Fact]
    public async Task Project_owner_has_manage_permission()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var project = new Project { OwnerUserId = ownerId, Title = "Project" };
        await uow.Projects.AddAsync(project);
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = ownerId, Role = ProjectMemberRole.Owner, Status = ProjectMemberStatus.Active });
        await uow.SaveChangesAsync();
        var permissions = new ProjectPermissionService(uow);

        Assert.True(await permissions.CanManageProjectAsync(project.Id, ownerId));
    }

    [Fact]
    public async Task Assigned_section_member_can_create_task_in_assigned_section()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var project = new Project { OwnerUserId = ownerId, Title = "Project" };
        var section = new ProjectSection { ProjectId = project.Id, Title = "Assigned", Visibility = SectionVisibility.AssignedToMember, AssignedUserId = memberId };
        await uow.Projects.AddAsync(project);
        await uow.ProjectMembers.AddAsync(new ProjectMember { ProjectId = project.Id, UserId = memberId, Role = ProjectMemberRole.Member, Status = ProjectMemberStatus.Active });
        await uow.ProjectSections.AddAsync(section);
        await uow.SaveChangesAsync();
        var permissions = new ProjectPermissionService(uow);

        Assert.True(await permissions.CanCreateTaskInSectionAsync(project.Id, section.Id, memberId));
    }

    [Fact]
    public async Task Project_owner_can_create_section_then_task_inside_it()
    {
        var (uow, _) = CreateUnitOfWork();
        var ownerId = Guid.NewGuid();
        var projectService = CreateProjectService(uow);
        var taskService = CreateTaskService(uow);
        var project = await projectService.CreateProjectAsync(ownerId, new("Project", null, null, null));

        var section = await projectService.AddSectionAsync(ownerId, project.Id, new("Backlog", null, "#B072FF", "view_column", 1, SectionVisibility.Public, null));
        var task = await taskService.CreateProjectTaskAsync(ownerId, new("First task", null, null, null, null, null, null, null, project.Id, section.Id, null, null, true));
        var details = await projectService.GetProjectDetailsAsync(ownerId, project.Id);

        Assert.Equal(project.Id, section.ProjectId);
        Assert.Equal(project.Id, task.ProjectId);
        Assert.Equal(section.Id, task.SectionId);
        Assert.Contains(details.Sections, item => item.Id == section.Id);
        Assert.Contains(details.Tasks, item => item.Id == task.Id && item.SectionId == section.Id);
    }

    private static Habit HabitWithActiveWeekdays()
    {
        var habit = new Habit { ScheduleType = HabitScheduleType.SpecificDays, IsActive = true };
        foreach (var day in new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday })
        {
            habit.ScheduleDays.Add(new HabitScheduleDay { Habit = habit, DayOfWeek = day, DayType = HabitDayType.Active });
        }
        habit.ScheduleDays.Add(new HabitScheduleDay { Habit = habit, DayOfWeek = DayOfWeek.Saturday, DayType = HabitDayType.Rest });
        habit.ScheduleDays.Add(new HabitScheduleDay { Habit = habit, DayOfWeek = DayOfWeek.Sunday, DayType = HabitDayType.Rest });
        return habit;
    }

    private static (IUnitOfWork UnitOfWork, IDoDbContext DbContext) CreateUnitOfWork()
    {
        var clock = new FixedDateTimeProvider();
        var options = new DbContextOptionsBuilder<IDoDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var db = new IDoDbContext(options, clock);
        var users = new UserRepository(db, clock);
        var tasks = new TaskRepository(db, clock);
        var habits = new HabitRepository(db, clock);
        var habitLogs = new HabitLogRepository(db, clock);
        var projects = new ProjectRepository(db, clock);
        var projectMembers = new ProjectMemberRepository(db, clock);
        var projectSections = new ProjectSectionRepository(db, clock);
        var taskRequests = new TaskRequestRepository(db, clock);
        var notifications = new NotificationRepository(db, clock);
        var comments = new TaskCommentRepository(db, clock);
        return (new UnitOfWork(db, users, tasks, habits, habitLogs, projects, projectMembers, projectSections, taskRequests, notifications, comments), db);
    }

    private static ProjectService CreateProjectService(IUnitOfWork unitOfWork) =>
        new(unitOfWork, new FixedDateTimeProvider(), new ProjectPermissionService(unitOfWork), new NullIdentityAccountService(), new NotificationService(unitOfWork, new NullPublisher()));

    private static TaskRequestService CreateTaskRequestService(IUnitOfWork unitOfWork) =>
        new(unitOfWork, new FixedDateTimeProvider(), new NotificationService(unitOfWork, new NullPublisher()), new ProjectPermissionService(unitOfWork));

    private static TaskService CreateTaskService(IUnitOfWork unitOfWork) =>
        new(unitOfWork, new FixedDateTimeProvider(), new ProjectPermissionService(unitOfWork), new NullRealtimeNotifier(), CreateTaskRequestService(unitOfWork));

    private sealed class FixedDateTimeProvider : IDateTimeProvider
    {
        public DateTime UtcNow => new(2026, 5, 28, 9, 0, 0, DateTimeKind.Utc);
        public DateOnly Today => DateOnly.FromDateTime(UtcNow);
    }

    private sealed class NullPublisher : IDo.Application.Abstractions.Notifications.INotificationPublisher
    {
        public Task PublishAsync(Guid userId, string title, string? body, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class NullIdentityAccountService : IDo.Application.Abstractions.Identity.IIdentityAccountService
    {
        public Task<IDo.Application.Abstractions.Identity.IdentityAccountDto?> FindByUserNameOrEmailAsync(string identifier, CancellationToken cancellationToken = default) => Task.FromResult<IDo.Application.Abstractions.Identity.IdentityAccountDto?>(null);
        public Task<IDo.Application.Abstractions.Identity.IdentityAccountDto?> FindByUserProfileIdAsync(Guid userProfileId, CancellationToken cancellationToken = default) => Task.FromResult<IDo.Application.Abstractions.Identity.IdentityAccountDto?>(null);
        public Task<IReadOnlyCollection<IDo.Application.Abstractions.Identity.IdentityAccountDto>> SearchByUserNameAsync(string query, int take, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyCollection<IDo.Application.Abstractions.Identity.IdentityAccountDto>>(Array.Empty<IDo.Application.Abstractions.Identity.IdentityAccountDto>());
        public Task<IDo.Application.Abstractions.Identity.IdentityOperationResult> CreateAccountAsync(Guid userProfileId, string userName, string email, string password, CancellationToken cancellationToken = default) => Task.FromResult(IDo.Application.Abstractions.Identity.IdentityOperationResult.Success());
        public Task<IDo.Application.Abstractions.Identity.IdentityOperationResult> UpdateAccountAsync(Guid userProfileId, string userName, string email, CancellationToken cancellationToken = default) => Task.FromResult(IDo.Application.Abstractions.Identity.IdentityOperationResult.Success());
        public Task<bool> CheckPasswordAsync(Guid accountId, string password, CancellationToken cancellationToken = default) => Task.FromResult(false);
    }

    private sealed class NullRealtimeNotifier : ITaskRealtimeNotifier
    {
        public Task TaskStatusChangedAsync(Guid taskId, TaskDto task, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task TaskCommentAddedAsync(Guid taskId, TaskCommentDto comment, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
