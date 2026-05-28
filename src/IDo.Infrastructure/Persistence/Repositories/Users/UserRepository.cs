using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<User>(dbContext, dateTimeProvider), IUserRepository;
