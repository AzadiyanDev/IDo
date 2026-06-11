using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.Common.Validation;
using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;
using IDo.Services.Rules;

namespace IDo.Services.Services;

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

    public async Task<HabitDetailsDto> GetHabitDetailsAsync(Guid userId, Guid habitId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        if (from > to) (from, to) = (to, from);

        var habit = await unitOfWork.Habits.GetHabitWithLogsAsync(habitId, cancellationToken) ?? throw new KeyNotFoundException("Habit not found.");
        if (habit.UserId != userId) throw new UnauthorizedAccessException("User cannot view this habit.");

        var today = dateTimeProvider.Today;
        var logs = habit.Logs
            .Where(x => x.Date >= from && x.Date <= to)
            .OrderByDescending(x => x.Date)
            .ThenByDescending(x => x.UpdatedAtUtc ?? x.CompletedAtUtc ?? x.CreatedAtUtc)
            .ToArray();
        var latestLogByDate = logs
            .GroupBy(x => x.Date)
            .ToDictionary(
                x => x.Key,
                x => x.OrderByDescending(log => log.UpdatedAtUtc ?? log.CompletedAtUtc ?? log.CreatedAtUtc).First());

        var recentDays = EachDate(from, to)
            .Select(date =>
            {
                latestLogByDate.TryGetValue(date, out var log);
                return new HabitDayAnalysisDto(
                    date,
                    date.DayOfWeek,
                    HabitRules.IsScheduledActiveDay(habit, date),
                    log?.Status,
                    log?.CompletedAtUtc);
            })
            .OrderByDescending(x => x.Date)
            .ToArray();

        var completedDays = recentDays.Count(IsDone);
        var missedDays = recentDays.Count(day => IsMissed(day, today));
        var scheduledDays = recentDays.Count(x => x.IsScheduled);
        var successBase = completedDays + missedDays;
        var rangeDays = Math.Max(1, from.DayNumber <= to.DayNumber ? to.DayNumber - from.DayNumber + 1 : 1);
        var analytics = new HabitAnalyticsDto(
            from,
            to,
            scheduledDays,
            completedDays,
            missedDays,
            recentDays.Count(day => day.IsScheduled && day.Date >= today && !IsDone(day)),
            recentDays.Count(day => !day.IsScheduled),
            logs.Count(x => x.Status == HabitLogStatus.OutOfSchedule),
            successBase == 0 ? 0 : decimal.Round(completedDays * 100m / successBase, 2),
            scheduledDays == 0 ? 0 : decimal.Round(completedDays * 100m / scheduledDays, 2),
            decimal.Round(completedDays / Math.Max(rangeDays / 7m, 1m), 2),
            habit.CurrentStreak,
            habit.BestStreak,
            logs.Where(x => x.Status == HabitLogStatus.Done).Select(x => (DateOnly?)x.Date).FirstOrDefault(),
            CalculateLongestGap(recentDays, today));

        var weekdayStats = recentDays
            .Where(x => x.IsScheduled)
            .GroupBy(x => x.DayOfWeek)
            .Select(group =>
            {
                var scheduled = group.Count();
                var done = group.Count(IsDone);
                var missed = group.Count(day => IsMissed(day, today));
                var rateBase = done + missed;
                return new HabitWeekdayAnalysisDto(
                    group.Key,
                    scheduled,
                    done,
                    missed,
                    rateBase == 0 ? 0 : decimal.Round(done * 100m / rateBase, 2));
            })
            .OrderBy(x => x.DayOfWeek)
            .ToArray();

        return new HabitDetailsDto(
            habit.ToDto(),
            logs.Select(x => x.ToDto()).ToArray(),
            analytics,
            recentDays,
            weekdayStats);
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
            if (!habit.Logs.Contains(log)) habit.Logs.Add(log);
        }
        log.Status = status;
        log.CompletedAtUtc = status == HabitLogStatus.Done ? dateTimeProvider.UtcNow : null;
        habit.CurrentStreak = HabitRules.CalculateStreak(habit, date);
        habit.BestStreak = Math.Max(habit.BestStreak, habit.CurrentStreak);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return log.ToDto();
    }

    public async Task<HabitDto> UndoHabitForDateAsync(Guid userId, Guid habitId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var habit = await unitOfWork.Habits.GetHabitWithLogsAsync(habitId, cancellationToken) ?? throw new KeyNotFoundException("Habit not found.");
        if (habit.UserId != userId) throw new UnauthorizedAccessException("User cannot update this habit.");
        var log = habit.Logs.FirstOrDefault(x => x.Date == date) ?? await unitOfWork.HabitLogs.GetLogAsync(habitId, date, cancellationToken);
        if (log is not null)
        {
            if (log.UserId != userId) throw new UnauthorizedAccessException("User cannot update this habit log.");
            unitOfWork.HabitLogs.Delete(log);
            habit.Logs.Remove(log);
        }

        habit.CurrentStreak = HabitRules.CalculateStreak(habit, date);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return habit.ToDto();
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

    private static IEnumerable<DateOnly> EachDate(DateOnly from, DateOnly to)
    {
        for (var date = from; date <= to; date = date.AddDays(1)) yield return date;
    }

    private static bool IsDone(HabitDayAnalysisDto day) => day.Status == HabitLogStatus.Done;

    private static bool IsMissed(HabitDayAnalysisDto day, DateOnly today) =>
        day.IsScheduled
        && day.Date < today
        && day.Status is not HabitLogStatus.Done and not HabitLogStatus.RestDay and not HabitLogStatus.Skipped;

    private static int CalculateLongestGap(IEnumerable<HabitDayAnalysisDto> days, DateOnly today)
    {
        var longest = 0;
        var current = 0;
        foreach (var day in days.Where(x => x.IsScheduled && x.Date < today).OrderBy(x => x.Date))
        {
            if (IsDone(day))
            {
                current = 0;
                continue;
            }

            current++;
            longest = Math.Max(longest, current);
        }

        return longest;
    }
}
