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
                && (x.CreatorUserId == userId || x.AssigneeUserId == userId)
                && (x.DueDate == date || (x.AssigneeUserId == userId && x.Type == IDoTaskType.Project)))
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
                && (x.DueDate == date || x.AssigneeUserId == userId)
                && (x.CreatorUserId == userId
                    || x.AssigneeUserId == userId
                    || x.Project!.Members.Any(m => m.UserId == userId && m.Status == ProjectMemberStatus.Active)))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<IDoTask>> GetAssignedTasksAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await ActiveTasks
            .Where(x => x.AssigneeUserId == userId && x.Status != IDoTaskStatus.Archived)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<IDoTask>> GetOverdueTasksAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default) =>
        await ActiveTasks
            .Where(x => (x.CreatorUserId == userId || x.AssigneeUserId == userId)
                && x.DueDate < date
                && x.Status != IDoTaskStatus.Done
                && x.Status != IDoTaskStatus.Archived)
            .ToListAsync(cancellationToken);

    public Task<IDoTask?> GetTaskWithCommentsAsync(Guid taskId, CancellationToken cancellationToken = default) =>
        ActiveTasks
            .Include(x => x.Comments)
            .ThenInclude(x => x.User)
            .Include(x => x.SentRequests.Where(r => r.Status == TaskRequestStatus.Pending))
            .FirstOrDefaultAsync(x => x.Id == taskId, cancellationToken);
}
