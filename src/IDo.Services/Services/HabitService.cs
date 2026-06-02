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
