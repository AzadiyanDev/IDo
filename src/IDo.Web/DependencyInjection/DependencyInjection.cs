using System.Security.Claims;
using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Realtime;
using IDo.Infrastructure.Persistence;
using IDo.Web.Realtime;
using Microsoft.EntityFrameworkCore;

namespace IDo.Web.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddWeb(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ITaskRealtimeNotifier, SignalRTaskRealtimeNotifier>();
        return services;
    }
}

public sealed class CurrentUserService(IHttpContextAccessor accessor, IDoDbContext dbContext) : ICurrentUserService
{
    private Guid? cachedUserId;
    private bool hasResolvedUserId;

    public Guid? UserId
    {
        get
        {
            if (hasResolvedUserId) return cachedUserId;
            hasResolvedUserId = true;

            var user = accessor.HttpContext?.User;
            var candidateValues = new[]
            {
                user?.FindFirstValue("ido:user_profile_id"),
                user?.FindFirstValue(ClaimTypes.NameIdentifier),
                user?.FindFirstValue("sub"),
                accessor.HttpContext?.Request.Headers["X-User-Id"].FirstOrDefault()
            };

            foreach (var value in candidateValues)
            {
                if (!Guid.TryParse(value, out var candidate)) continue;
                cachedUserId = ResolveUserProfileId(candidate);
                if (cachedUserId.HasValue) return cachedUserId;
            }

            return null;
        }
    }

    public bool IsAuthenticated => UserId.HasValue;

    private Guid? ResolveUserProfileId(Guid candidate)
    {
        if (dbContext.UserProfiles.AsNoTracking().Any(x => x.Id == candidate)) return candidate;

        return dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == candidate)
            .Select(x => x.UserProfileId)
            .SingleOrDefault();
    }
}
