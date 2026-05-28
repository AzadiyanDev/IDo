using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class HabitLogRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<HabitLog>(dbContext, dateTimeProvider), IHabitLogRepository
{
    public Task<HabitLog?> GetLogAsync(Guid habitId, DateOnly date, CancellationToken cancellationToken = default) =>
        DbContext.HabitLogs.FirstOrDefaultAsync(x => x.HabitId == habitId && x.Date == date, cancellationToken);

    public async Task<IReadOnlyList<HabitLog>> GetLogsInRangeAsync(Guid habitId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default) =>
        await DbContext.HabitLogs
            .Where(x => x.HabitId == habitId && x.Date >= from && x.Date <= to)
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);
}
