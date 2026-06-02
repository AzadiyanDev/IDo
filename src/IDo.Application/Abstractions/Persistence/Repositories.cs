using System.Linq.Expressions;
using IDo.Domain.Common;
using IDo.Domain.Entities;
using IDo.Domain.Enums;

namespace IDo.Application.Abstractions.Persistence;

public interface IReadRepository<TEntity> where TEntity : BaseEntity
{
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TEntity>> ListAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TEntity>> ListAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default);
    Task<int> CountAsync(Expression<Func<TEntity, bool>>? predicate = null, CancellationToken cancellationToken = default);
}

public interface IRepository<TEntity> : IReadRepository<TEntity> where TEntity : BaseEntity
{
    Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);
    void Update(TEntity entity);
    void Delete(TEntity entity);
    void SoftDelete(TEntity entity, Guid? deletedByUserId = null);
}

public interface IUserRepository : IRepository<User> { }

public interface ITaskRepository : IRepository<IDoTask>
{
    Task<IReadOnlyList<IDoTask>> GetTodayTasksAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<IDoTask>> GetPersonalTasksByDateAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<IDoTask>> GetProjectTasksByDateAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<IDoTask>> GetAssignedTasksAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<IDoTask>> GetOverdueTasksAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IDoTask?> GetTaskWithCommentsAsync(Guid taskId, CancellationToken cancellationToken = default);
}

public interface IHabitRepository : IRepository<Habit>
{
    Task<IReadOnlyList<Habit>> GetUserHabitsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Habit>> GetActiveHabitsForDateAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);
    Task<Habit?> GetHabitWithLogsAsync(Guid habitId, CancellationToken cancellationToken = default);
}

public interface IHabitLogRepository : IRepository<HabitLog>
{
    Task<HabitLog?> GetLogAsync(Guid habitId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<HabitLog>> GetLogsInRangeAsync(Guid habitId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
}

public interface IProjectRepository : IRepository<Project>
{
    Task<IReadOnlyList<Project>> GetUserProjectsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Project?> GetProjectDetailsAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<Project?> GetProjectWithSectionsAndTasksAsync(Guid projectId, CancellationToken cancellationToken = default);
}

public interface IProjectMemberRepository : IRepository<ProjectMember>
{
    Task<bool> IsProjectOwnerAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> IsProjectMemberAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<ProjectMember?> GetMembershipAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<ProjectMemberRole?> GetMemberRoleAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
}

public interface IProjectSectionRepository : IRepository<ProjectSection>
{
    Task<ProjectSection?> GetSectionWithTasksAsync(Guid sectionId, CancellationToken cancellationToken = default);
}

public interface ITaskRequestRepository : IRepository<TaskRequest>
{
    Task<IReadOnlyList<TaskRequest>> GetPendingRequestsForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TaskRequest>> GetSentRequestsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<TaskRequest?> GetTaskPendingRequestAsync(Guid taskId, Guid? receiverUserId = null, CancellationToken cancellationToken = default);
    Task<TaskRequest?> GetProjectInvitePendingRequestAsync(Guid projectId, Guid receiverUserId, CancellationToken cancellationToken = default);
    Task<TaskRequest?> GetSectionPendingRequestAsync(Guid sectionId, Guid receiverUserId, CancellationToken cancellationToken = default);
}

public interface INotificationRepository : IRepository<Notification>
{
    Task<IReadOnlyList<Notification>> GetUnreadAsync(Guid userId, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default);
}

public interface ITaskCommentRepository : IRepository<TaskComment> { }

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    ITaskRepository Tasks { get; }
    IHabitRepository Habits { get; }
    IHabitLogRepository HabitLogs { get; }
    IProjectRepository Projects { get; }
    IProjectMemberRepository ProjectMembers { get; }
    IProjectSectionRepository ProjectSections { get; }
    ITaskRequestRepository TaskRequests { get; }
    INotificationRepository Notifications { get; }
    ITaskCommentRepository TaskComments { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
