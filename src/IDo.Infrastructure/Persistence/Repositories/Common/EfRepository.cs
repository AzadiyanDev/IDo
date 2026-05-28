using System.Linq.Expressions;
using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Persistence.Repositories;

public class EfRepository<TEntity>(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider) : IRepository<TEntity>
    where TEntity : BaseEntity
{
    protected readonly IDoDbContext DbContext = dbContext;
    protected readonly DbSet<TEntity> DbSet = dbContext.Set<TEntity>();
    protected readonly IDateTimeProvider DateTimeProvider = dateTimeProvider;

    public virtual Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        DbSet.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public virtual async Task<IReadOnlyList<TEntity>> ListAsync(CancellationToken cancellationToken = default) =>
        await DbSet.AsNoTracking().ToListAsync(cancellationToken);

    public virtual async Task<IReadOnlyList<TEntity>> ListAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default) =>
        await DbSet.AsNoTracking().Where(predicate).ToListAsync(cancellationToken);

    public virtual Task<bool> ExistsAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default) =>
        DbSet.AnyAsync(predicate, cancellationToken);

    public virtual Task<int> CountAsync(Expression<Func<TEntity, bool>>? predicate = null, CancellationToken cancellationToken = default) =>
        predicate is null ? DbSet.CountAsync(cancellationToken) : DbSet.CountAsync(predicate, cancellationToken);

    public virtual Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) =>
        DbSet.AddAsync(entity, cancellationToken).AsTask();

    public virtual void Update(TEntity entity) => DbSet.Update(entity);

    public virtual void Delete(TEntity entity) => DbSet.Remove(entity);

    public virtual void SoftDelete(TEntity entity, Guid? deletedByUserId = null)
    {
        if (entity is SoftDeletableEntity softDeletable)
        {
            softDeletable.IsDeleted = true;
            softDeletable.DeletedAtUtc = DateTimeProvider.UtcNow;
            softDeletable.DeletedByUserId = deletedByUserId;
            Update(entity);
            return;
        }

        Delete(entity);
    }
}
