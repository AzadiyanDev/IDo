using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Notifications;
using IDo.Application.Abstractions.Persistence;
using IDo.Infrastructure.Identity;
using IDo.Infrastructure.Notifications;
using IDo.Infrastructure.Persistence;
using IDo.Infrastructure.Persistence.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace IDo.Infrastructure.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=(localdb)\\mssqllocaldb;Database=IDo;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

        services.AddDbContext<IDoDbContext>(options => options.UseSqlServer(
            connectionString,
            sqlOptions => sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", IDoDatabaseSchema.Name)));

        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<IDoDbContext>();

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IIdentityAccountService, IdentityAccountService>();
        services.AddScoped<ITaskRepository, TaskRepository>();
        services.AddScoped<IHabitRepository, HabitRepository>();
        services.AddScoped<IHabitLogRepository, HabitLogRepository>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<IProjectMemberRepository, ProjectMemberRepository>();
        services.AddScoped<IProjectSectionRepository, ProjectSectionRepository>();
        services.AddScoped<ITaskRequestRepository, TaskRequestRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<ITaskCommentRepository, TaskCommentRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddScoped<INotificationPublisher, NoOpNotificationPublisher>();
        return services;
    }
}

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
    public DateOnly Today => DateOnly.FromDateTime(UtcNow);
}
