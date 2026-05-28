using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;
using IDo.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class HabitRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<Habit>(dbContext, dateTimeProvider), IHabitRepository
{
    public async Task<IReadOnlyList<Habit>> GetUserHabitsAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await DbContext.Habits
            .Include(x => x.ScheduleDays)
            .Where(x => x.UserId == userId)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Habit>> GetActiveHabitsForDateAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default) =>
        await DbContext.Habits
            .Include(x => x.ScheduleDays)
            .Where(x => x.UserId == userId
                && x.IsActive
                && (x.ScheduleType == HabitScheduleType.TimesPerWeek
                    || x.ScheduleDays.Any(d => d.DayOfWeek == date.DayOfWeek && d.DayType == HabitDayType.Active)))
            .ToListAsync(cancellationToken);

    public Task<Habit?> GetHabitWithLogsAsync(Guid habitId, CancellationToken cancellationToken = default) =>
        DbContext.Habits
            .Include(x => x.ScheduleDays)
            .Include(x => x.Logs)
            .FirstOrDefaultAsync(x => x.Id == habitId, cancellationToken);
}
