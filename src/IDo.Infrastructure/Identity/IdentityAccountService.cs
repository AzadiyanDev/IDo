using IDo.Application.Abstractions.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Identity;

public sealed class IdentityAccountService(UserManager<ApplicationUser> userManager) : IIdentityAccountService
{
    public async Task<IdentityAccountDto?> FindByUserNameOrEmailAsync(string identifier, CancellationToken cancellationToken = default)
    {
        var normalizedIdentifier = identifier.Trim();
        var user = await userManager.FindByNameAsync(normalizedIdentifier);
        user ??= await userManager.FindByEmailAsync(normalizedIdentifier);

        return user?.UserProfileId is { } profileId
            ? new IdentityAccountDto(user.Id, profileId, user.UserName ?? string.Empty, user.Email ?? string.Empty)
            : null;
    }

    public async Task<IdentityAccountDto?> FindByUserProfileIdAsync(Guid userProfileId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.Users.SingleOrDefaultAsync(x => x.UserProfileId == userProfileId, cancellationToken);
        return user is null
            ? null
            : new IdentityAccountDto(user.Id, userProfileId, user.UserName ?? string.Empty, user.Email ?? string.Empty);
    }

    public async Task<IReadOnlyCollection<IdentityAccountDto>> SearchByUserNameAsync(string query, int take, CancellationToken cancellationToken = default)
    {
        var normalizedQuery = query.Trim();
        if (normalizedQuery.Length < 2) return Array.Empty<IdentityAccountDto>();

        return await userManager.Users
            .AsNoTracking()
            .Where(x => x.UserName != null && x.UserName.Contains(normalizedQuery) && x.UserProfileId.HasValue)
            .OrderBy(x => x.UserName)
            .Take(Math.Clamp(take, 1, 25))
            .Select(x => new IdentityAccountDto(x.Id, x.UserProfileId!.Value, x.UserName ?? string.Empty, x.Email ?? string.Empty))
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IdentityOperationResult> CreateAccountAsync(Guid userProfileId, string userName, string email, string password, CancellationToken cancellationToken = default)
    {
        var user = new ApplicationUser
        {
            UserName = userName,
            Email = email,
            EmailConfirmed = true,
            UserProfileId = userProfileId
        };

        var result = await userManager.CreateAsync(user, password);
        return result.Succeeded
            ? IdentityOperationResult.Success()
            : IdentityOperationResult.Failed(result.Errors.Select(x => x.Description).ToArray());
    }

    public async Task<IdentityOperationResult> UpdateAccountAsync(Guid userProfileId, string userName, string email, CancellationToken cancellationToken = default)
    {
        var user = await userManager.Users.SingleOrDefaultAsync(x => x.UserProfileId == userProfileId, cancellationToken);
        if (user is null) return IdentityOperationResult.Failed(["Identity account not found."]);

        var errors = new List<string>();
        if (!string.Equals(user.UserName, userName, StringComparison.Ordinal))
        {
            var userNameResult = await userManager.SetUserNameAsync(user, userName);
            if (!userNameResult.Succeeded) errors.AddRange(userNameResult.Errors.Select(x => x.Description));
        }

        if (!string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase))
        {
            var emailResult = await userManager.SetEmailAsync(user, email);
            if (!emailResult.Succeeded) errors.AddRange(emailResult.Errors.Select(x => x.Description));
        }

        if (errors.Count > 0) return IdentityOperationResult.Failed(errors);

        user.EmailConfirmed = true;
        var updateResult = await userManager.UpdateAsync(user);
        return updateResult.Succeeded
            ? IdentityOperationResult.Success()
            : IdentityOperationResult.Failed(updateResult.Errors.Select(x => x.Description).ToArray());
    }

    public async Task<bool> CheckPasswordAsync(Guid accountId, string password, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(accountId.ToString());
        return user is not null && await userManager.CheckPasswordAsync(user, password);
    }
}
