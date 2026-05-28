using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
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

        Assert.Equal(3, HabitRules.CalculateStreak(habit, new DateOnly(2026, 5, 27)));
    }

    [Fact]
    public void Habit_success_rate_excludes_rest_and_out_of_schedule_days()
    {
        var habit = HabitWithActiveWeekdays();
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
    public async Task Task_request_accept_flow_assigns_receiver()
    {
        var (uow, _) = CreateUnitOfWork();
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var task = new IDoTask { CreatorUserId = senderId, AssigneeUserId = senderId, Title = "Transfer" };
        await uow.Tasks.AddAsync(task);
        await uow.SaveChangesAsync();
        var service = new TaskRequestService(uow, new FixedDateTimeProvider(), new NotificationService(uow, new NullPublisher()));

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
        var service = new TaskRequestService(uow, new FixedDateTimeProvider(), new NotificationService(uow, new NullPublisher()));

        var sent = await service.SendTaskRequestAsync(senderId, new(task.Id, receiverId, "please take this"));
        await service.RejectTaskRequestAsync(receiverId, sent.Id, "no");

        var updatedTask = await uow.Tasks.GetByIdAsync(task.Id);
        Assert.Equal(senderId, updatedTask!.AssigneeUserId);
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

    private sealed class FixedDateTimeProvider : IDateTimeProvider
    {
        public DateTime UtcNow => new(2026, 5, 28, 9, 0, 0, DateTimeKind.Utc);
        public DateOnly Today => DateOnly.FromDateTime(UtcNow);
    }

    private sealed class NullPublisher : IDo.Application.Abstractions.Notifications.INotificationPublisher
    {
        public Task PublishAsync(Guid userId, string title, string? body, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
