using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;
using IDo.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class ProjectMemberRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<ProjectMember>(dbContext, dateTimeProvider), IProjectMemberRepository
{
    public Task<bool> IsProjectOwnerAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default) =>
        DbContext.ProjectMembers.AnyAsync(x => x.ProjectId == projectId
            && x.UserId == userId
            && x.Role == ProjectMemberRole.Owner
            && x.Status == ProjectMemberStatus.Active, cancellationToken);

    public Task<bool> IsProjectMemberAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default) =>
        DbContext.ProjectMembers.AnyAsync(x => x.ProjectId == projectId
            && x.UserId == userId
            && x.Status == ProjectMemberStatus.Active, cancellationToken);

    public Task<ProjectMember?> GetMembershipAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default) =>
        DbContext.ProjectMembers
            .FirstOrDefaultAsync(x => x.ProjectId == projectId && x.UserId == userId, cancellationToken);

    public async Task<ProjectMemberRole?> GetMemberRoleAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default) =>
        await DbContext.ProjectMembers
            .Where(x => x.ProjectId == projectId && x.UserId == userId && x.Status == ProjectMemberStatus.Active)
            .Select(x => (ProjectMemberRole?)x.Role)
            .FirstOrDefaultAsync(cancellationToken);
}
