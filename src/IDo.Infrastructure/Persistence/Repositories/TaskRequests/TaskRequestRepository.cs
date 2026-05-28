using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;
using IDo.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class TaskRequestRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<TaskRequest>(dbContext, dateTimeProvider), ITaskRequestRepository
{
    public async Task<IReadOnlyList<TaskRequest>> GetPendingRequestsForUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await DbContext.TaskRequests
            .Where(x => x.ReceiverUserId == userId && x.Status == TaskRequestStatus.Pending)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<TaskRequest>> GetSentRequestsAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await DbContext.TaskRequests
            .Where(x => x.SenderUserId == userId)
            .ToListAsync(cancellationToken);

    public Task<TaskRequest?> GetTaskPendingRequestAsync(Guid taskId, CancellationToken cancellationToken = default) =>
        DbContext.TaskRequests.FirstOrDefaultAsync(x => x.TaskId == taskId && x.Status == TaskRequestStatus.Pending, cancellationToken);
}
