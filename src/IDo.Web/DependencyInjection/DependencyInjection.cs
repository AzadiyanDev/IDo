using System.Security.Claims;
using IDo.Application.Abstractions.Identity;

namespace IDo.Web.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddWeb(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        return services;
    }
}

public sealed class CurrentUserService(IHttpContextAccessor accessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var user = accessor.HttpContext?.User;
            var claimValue = user?.FindFirstValue(ClaimTypes.NameIdentifier) ?? user?.FindFirstValue("sub");
            if (Guid.TryParse(claimValue, out var claimUserId)) return claimUserId;
            if (Guid.TryParse(accessor.HttpContext?.Request.Headers["X-User-Id"].FirstOrDefault(), out var headerUserId)) return headerUserId;
            return null;
        }
    }

    public bool IsAuthenticated => UserId.HasValue;
}
