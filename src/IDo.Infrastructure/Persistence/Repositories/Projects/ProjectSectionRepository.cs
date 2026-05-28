using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class ProjectSectionRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<ProjectSection>(dbContext, dateTimeProvider), IProjectSectionRepository;
