using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using IDo.Domain.Enums;
using IDo.Services.Rules;

namespace IDo.Services.Services;

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
            foreach (var log in logs.Where(log => habit.Logs.All(existing => existing.Id != log.Id))) habit.Logs.Add(log);
            var activeDates = Enumerable.Range(0, to.DayNumber - from.DayNumber + 1).Select(from.AddDays).Where(x => HabitRules.IsScheduledActiveDay(habit, x)).ToArray();
            var doneActiveDays = logs.Where(x => x.Status == HabitLogStatus.Done && activeDates.Contains(x.Date)).Select(x => x.Date).Distinct().Count();
            result.Add(new HabitProgressDto(habit.Id, doneActiveDays, activeDates.Length, HabitRules.CalculateStreak(habit, to), habit.BestStreak, HabitRules.CalculateSuccessRate(habit, from, to)));
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
        var weekStartUtc = weekStartDate.ToDateTime(TimeOnly.MinValue);
        var weekEndUtc = weekStartDate.AddDays(7).ToDateTime(TimeOnly.MinValue);
        var tasks = await unitOfWork.Tasks.ListAsync(
            x => x.IsCountableInProgress
                && x.Status != IDoTaskStatus.Archived
                && x.CompletedAtUtc.HasValue
                && x.CompletedAtUtc.Value >= weekStartUtc
                && x.CompletedAtUtc.Value < weekEndUtc
                && (x.CreatorUserId == userId || x.AssigneeUserId == userId),
            cancellationToken);
        var map = Enumerable.Range(0, 7).Select(weekStartDate.AddDays).ToDictionary(x => x, x => tasks.Count(t => t.CompletedAtUtc.HasValue && DateOnly.FromDateTime(t.CompletedAtUtc.Value) == x));
        return new WeeklyActivityDto(weekStartDate, map);
    }

    public async Task<IReadOnlyCollection<TaskDto>> GetOverdueTasksAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default) =>
        (await unitOfWork.Tasks.GetOverdueTasksAsync(userId, date, cancellationToken)).Select(x => x.ToDto()).ToArray();
}
