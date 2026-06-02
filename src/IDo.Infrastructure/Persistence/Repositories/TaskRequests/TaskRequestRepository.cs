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
            .Include(x => x.Project)
            .Include(x => x.Section)
            .Include(x => x.Task)
            .Where(x => x.ReceiverUserId == userId && x.Status == TaskRequestStatus.Pending)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<TaskRequest>> GetSentRequestsAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await DbContext.TaskRequests
            .Include(x => x.Project)
            .Include(x => x.Section)
            .Include(x => x.Task)
            .Where(x => x.SenderUserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public Task<TaskRequest?> GetTaskPendingRequestAsync(Guid taskId, Guid? receiverUserId = null, CancellationToken cancellationToken = default) =>
        DbContext.TaskRequests.FirstOrDefaultAsync(
            x => x.Type == CollaborationRequestType.TaskAssignment
                && x.TaskId == taskId
                && x.Status == TaskRequestStatus.Pending
                && (!receiverUserId.HasValue || x.ReceiverUserId == receiverUserId.Value),
            cancellationToken);

    public Task<TaskRequest?> GetProjectInvitePendingRequestAsync(Guid projectId, Guid receiverUserId, CancellationToken cancellationToken = default) =>
        DbContext.TaskRequests.FirstOrDefaultAsync(
            x => x.Type == CollaborationRequestType.ProjectInvite
                && x.ProjectId == projectId
                && x.ReceiverUserId == receiverUserId
                && x.Status == TaskRequestStatus.Pending,
            cancellationToken);

    public Task<TaskRequest?> GetSectionPendingRequestAsync(Guid sectionId, Guid receiverUserId, CancellationToken cancellationToken = default) =>
        DbContext.TaskRequests.FirstOrDefaultAsync(
            x => x.Type == CollaborationRequestType.SectionAssignment
                && x.SectionId == sectionId
                && x.ReceiverUserId == receiverUserId
                && x.Status == TaskRequestStatus.Pending,
            cancellationToken);
}
