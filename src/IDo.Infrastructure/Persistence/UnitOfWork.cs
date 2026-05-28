using IDo.Application.Abstractions.Persistence;
using Microsoft.EntityFrameworkCore.Storage;

namespace IDo.Infrastructure.Persistence;

public sealed class UnitOfWork(
    IDoDbContext dbContext,
    IUserRepository users,
    ITaskRepository tasks,
    IHabitRepository habits,
    IHabitLogRepository habitLogs,
    IProjectRepository projects,
    IProjectMemberRepository projectMembers,
    IProjectSectionRepository projectSections,
    ITaskRequestRepository taskRequests,
    INotificationRepository notifications,
    ITaskCommentRepository taskComments) : IUnitOfWork
{
    private IDbContextTransaction? _transaction;

    public IUserRepository Users { get; } = users;
    public ITaskRepository Tasks { get; } = tasks;
    public IHabitRepository Habits { get; } = habits;
    public IHabitLogRepository HabitLogs { get; } = habitLogs;
    public IProjectRepository Projects { get; } = projects;
    public IProjectMemberRepository ProjectMembers { get; } = projectMembers;
    public IProjectSectionRepository ProjectSections { get; } = projectSections;
    public ITaskRequestRepository TaskRequests { get; } = taskRequests;
    public INotificationRepository Notifications { get; } = notifications;
    public ITaskCommentRepository TaskComments { get; } = taskComments;

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => dbContext.SaveChangesAsync(cancellationToken);
    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default) => _transaction ??= await dbContext.Database.BeginTransactionAsync(cancellationToken);
    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null) return;
        await _transaction.CommitAsync(cancellationToken);
        await _transaction.DisposeAsync();
        _transaction = null;
    }
    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null) return;
        await _transaction.RollbackAsync(cancellationToken);
        await _transaction.DisposeAsync();
        _transaction = null;
    }
}
