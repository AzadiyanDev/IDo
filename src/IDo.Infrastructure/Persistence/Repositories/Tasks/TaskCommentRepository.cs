using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class TaskCommentRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<TaskComment>(dbContext, dateTimeProvider), ITaskCommentRepository;
