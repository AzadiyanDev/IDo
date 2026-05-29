namespace IDo.Application.Abstractions.Identity;

public interface IIdentityAccountService
{
    Task<IdentityAccountDto?> FindByUserNameOrEmailAsync(string identifier, CancellationToken cancellationToken = default);
    Task<IdentityAccountDto?> FindByUserProfileIdAsync(Guid userProfileId, CancellationToken cancellationToken = default);
    Task<IdentityOperationResult> CreateAccountAsync(Guid userProfileId, string userName, string email, string password, CancellationToken cancellationToken = default);
    Task<bool> CheckPasswordAsync(Guid accountId, string password, CancellationToken cancellationToken = default);
}

public sealed record IdentityAccountDto(
    Guid AccountId,
    Guid UserProfileId,
    string UserName,
    string Email);

public sealed record IdentityOperationResult(
    bool Succeeded,
    IReadOnlyCollection<string> Errors)
{
    public static IdentityOperationResult Success() => new(true, Array.Empty<string>());
    public static IdentityOperationResult Failed(IReadOnlyCollection<string> errors) => new(false, errors);
}
