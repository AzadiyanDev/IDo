using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;
using IDo.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class TaskRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<IDoTask>(dbContext, dateTimeProvider), ITaskRepository
{
    private IQueryable<IDoTask> ActiveTasks => DbContext.Tasks.AsQueryable();

    public async Task<IReadOnlyList<IDoTask>> GetTodayTasksAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default) =>
        await ActiveTasks
            .Where(x => x.Status != IDoTaskStatus.Archived
                && (x.CreatorUserId == userId || x.AssigneeUserId == userId || x.SentRequests.Any(r => r.Type == CollaborationRequestType.TaskAssignment && r.Status == TaskRequestStatus.Accepted && r.ReceiverUserId == userId))
                && (x.DueDate == date || ((x.AssigneeUserId == userId || x.SentRequests.Any(r => r.Type == CollaborationRequestType.TaskAssignment && r.Status == TaskRequestStatus.Accepted && r.ReceiverUserId == userId)) && x.Type == IDoTaskType.Project)))
            .Include(x => x.SentRequests)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<IDoTask>> GetPersonalTasksByDateAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default) =>
        await ActiveTasks
            .Where(x => x.Type == IDoTaskType.Personal
                && x.CreatorUserId == userId
                && x.DueDate == date
                && x.Status != IDoTaskStatus.Archived)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<IDoTask>> GetProjectTasksByDateAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default) =>
        await ActiveTasks
            .Where(x => x.Type == IDoTaskType.Project
                && x.Status != IDoTaskStatus.Archived
                && x.DueDate == date
                && (x.AssigneeUserId == userId || x.SentRequests.Any(r => r.Type == CollaborationRequestType.TaskAssignment && r.Status == TaskRequestStatus.Accepted && r.ReceiverUserId == userId)))
            .Include(x => x.SentRequests)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<IDoTask>> GetAssignedTasksAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await ActiveTasks
            .Where(x => (x.AssigneeUserId == userId || x.SentRequests.Any(r => r.Type == CollaborationRequestType.TaskAssignment && r.Status == TaskRequestStatus.Accepted && r.ReceiverUserId == userId)) && x.Status != IDoTaskStatus.Archived)
            .Include(x => x.SentRequests)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<IDoTask>> GetOverdueTasksAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default) =>
        await ActiveTasks
            .Where(x => (x.CreatorUserId == userId || x.AssigneeUserId == userId || x.SentRequests.Any(r => r.Type == CollaborationRequestType.TaskAssignment && r.Status == TaskRequestStatus.Accepted && r.ReceiverUserId == userId))
                && x.DueDate < date
                && x.Status != IDoTaskStatus.Done
                && x.Status != IDoTaskStatus.Archived)
            .Include(x => x.SentRequests)
            .ToListAsync(cancellationToken);

    public Task<IDoTask?> GetTaskWithCommentsAsync(Guid taskId, CancellationToken cancellationToken = default) =>
        ActiveTasks
            .Include(x => x.Project)
            .Include(x => x.Section)
            .Include(x => x.CreatorUser)
            .Include(x => x.AssigneeUser)
            .Include(x => x.Comments)
            .ThenInclude(x => x.User)
            .Include(x => x.SentRequests.Where(r => r.Type == CollaborationRequestType.TaskAssignment && (r.Status == TaskRequestStatus.Pending || r.Status == TaskRequestStatus.Accepted)))
            .FirstOrDefaultAsync(x => x.Id == taskId, cancellationToken);
}
