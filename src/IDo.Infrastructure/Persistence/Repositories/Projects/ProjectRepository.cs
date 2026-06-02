using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;
using IDo.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class ProjectRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<Project>(dbContext, dateTimeProvider), IProjectRepository
{
    public async Task<IReadOnlyList<Project>> GetUserProjectsAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await DbContext.Projects
            .Include(x => x.Members)
            .Where(x => x.OwnerUserId == userId || x.Members.Any(m => m.UserId == userId && m.Status == ProjectMemberStatus.Active))
            .ToListAsync(cancellationToken);

    public Task<Project?> GetProjectDetailsAsync(Guid projectId, CancellationToken cancellationToken = default) =>
        DbContext.Projects
            .Include(x => x.Sections.OrderBy(s => s.Order))
            .ThenInclude(x => x.Tasks)
            .ThenInclude(x => x.SentRequests)
            .Include(x => x.Sections.OrderBy(s => s.Order))
            .ThenInclude(x => x.SentRequests)
            .Include(x => x.Members)
            .ThenInclude(x => x.User)
            .Include(x => x.Tasks)
            .ThenInclude(x => x.SentRequests)
            .FirstOrDefaultAsync(x => x.Id == projectId, cancellationToken);

    public Task<Project?> GetProjectWithSectionsAndTasksAsync(Guid projectId, CancellationToken cancellationToken = default) =>
        DbContext.Projects
            .Include(x => x.Sections)
            .Include(x => x.Tasks)
            .FirstOrDefaultAsync(x => x.Id == projectId, cancellationToken);
}
