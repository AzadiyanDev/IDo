using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class ProjectSectionRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<ProjectSection>(dbContext, dateTimeProvider), IProjectSectionRepository
{
    public Task<ProjectSection?> GetSectionWithTasksAsync(Guid sectionId, CancellationToken cancellationToken = default) =>
        DbContext.ProjectSections
            .Include(x => x.Tasks)
            .FirstOrDefaultAsync(x => x.Id == sectionId, cancellationToken);
}
