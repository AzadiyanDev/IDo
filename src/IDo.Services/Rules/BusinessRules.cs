using IDo.Domain.Entities;
using IDo.Domain.Enums;

namespace IDo.Services.Rules;

public static class HabitRules
{
    public static bool IsActiveOn(Habit habit, DateOnly date)
    {
        if (!habit.IsActive) return false;
        if (habit.ScheduleType == HabitScheduleType.TimesPerWeek) return habit.RequiredTimesPerWeek is > 0;
        return habit.ScheduleDays.Any(x => x.DayOfWeek == date.DayOfWeek && x.DayType == HabitDayType.Active);
    }

    public static int CalculateStreak(Habit habit, DateOnly throughDate)
    {
        var logsByDate = habit.Logs.ToDictionary(x => x.Date, x => x);
        var streak = 0;
        for (var date = throughDate; date >= throughDate.AddDays(-365); date = date.AddDays(-1))
        {
            if (!IsScheduledActiveDay(habit, date)) continue;
            if (!logsByDate.TryGetValue(date, out var log)) break;
            if (log.Status == HabitLogStatus.Done)
            {
                streak++;
                continue;
            }
            if (log.Status is HabitLogStatus.RestDay or HabitLogStatus.OutOfSchedule or HabitLogStatus.Skipped) continue;
            if (log.Status == HabitLogStatus.Missed) break;
        }
        return streak;
    }

    public static decimal CalculateSuccessRate(Habit habit, DateOnly from, DateOnly to)
    {
        var activeDates = EachDate(from, to).Where(date => IsScheduledActiveDay(habit, date)).ToArray();
        if (activeDates.Length == 0) return 0;
        var done = habit.Logs.Count(x => activeDates.Contains(x.Date) && x.Status == HabitLogStatus.Done);
        return decimal.Round(done * 100m / activeDates.Length, 2);
    }

    public static bool IsScheduledActiveDay(Habit habit, DateOnly date)
    {
        if (habit.ScheduleType == HabitScheduleType.TimesPerWeek) return habit.RequiredTimesPerWeek is > 0;
        return habit.ScheduleDays.Any(x => x.DayOfWeek == date.DayOfWeek && x.DayType == HabitDayType.Active);
    }

    private static IEnumerable<DateOnly> EachDate(DateOnly from, DateOnly to)
    {
        for (var date = from; date <= to; date = date.AddDays(1)) yield return date;
    }
}

public static class ProjectRules
{
    public static decimal CalculateProgressPercentage(IEnumerable<IDoTask> tasks)
    {
        var countable = tasks.Where(x => x.IsCountableInProgress && x.Status != IDoTaskStatus.Archived && !x.IsDeleted).ToArray();
        if (countable.Length == 0) return 0;
        return decimal.Round(countable.Count(x => x.Status == IDoTaskStatus.Done) * 100m / countable.Length, 2);
    }
}
