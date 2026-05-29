using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using IDo.Domain.Enums;

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
        var habitLogs = new List<HabitLogDto>();
        foreach (var habit in habits)
        {
            var log = await unitOfWork.HabitLogs.GetLogAsync(habit.Id, date, cancellationToken);
            if (log is not null) habitLogs.Add(log.ToDto());
        }

        var todayHabits = habits.Select(habit =>
        {
            var isCompleted = habitLogs.Any(log => log.HabitId == habit.Id && log.Status == HabitLogStatus.Done);
            return new TodayHabitDto(habit.Id, habit.UserId, habit.Title, habit.Description, habit.Color, habit.Icon, habit.CurrentStreak, habit.BestStreak, isCompleted);
        }).ToArray();

        var userProjects = await unitOfWork.Projects.GetUserProjectsAsync(userId, cancellationToken);
        var activeProjects = projectTasks
            .Where(task => task.ProjectId.HasValue)
            .GroupBy(task => task.ProjectId!.Value)
            .Select(group => new TodayProjectDto(
                userProjects.First(project => project.Id == group.Key).ToDto(),
                group.Count(),
                group.Count(task => task.Status == IDoTaskStatus.Done)))
            .Take(2)
            .ToArray();

        var personalDone = personalTasks.Count(x => x.Status == IDoTaskStatus.Done);
        var habitDone = todayHabits.Count(x => x.IsCompletedToday);
        var projectDone = projectTasks.Count(x => x.Status == IDoTaskStatus.Done);
        var total = personalTasks.Count + todayHabits.Length + projectTasks.Count;
        var done = personalDone + habitDone + projectDone;
        var summary = new TodaySummaryDto(
            personalTasks.Count,
            personalDone,
            todayHabits.Length,
            habitDone,
            projectTasks.Count,
            projectDone,
            requests.Count,
            done,
            combinedTasks.Count(x => x.DueDate < date && x.Status != IDoTaskStatus.Done),
            total == 0 ? 0 : decimal.Round(done * 100m / total, 2));

        return new TodayDashboardDto(date, personalTasks.Select(x => x.ToDto()).ToArray(), todayHabits, projectTasks.Select(x => x.ToDto()).ToArray(), activeProjects, requests.Select(x => x.ToDto()).ToArray(), summary);
    }
}
