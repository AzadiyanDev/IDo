using IDo.Application.Abstractions.Services;
using IDo.Services.Services;
using Microsoft.Extensions.DependencyInjection;

namespace IDo.Services;

public static class DependencyInjection
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddScoped<ITodayService, TodayService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IHabitService, HabitService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<ITaskRequestService, TaskRequestService>();
        services.AddScoped<IProgressService, ProgressService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IProjectPermissionService, ProjectPermissionService>();
        return services;
    }
}
