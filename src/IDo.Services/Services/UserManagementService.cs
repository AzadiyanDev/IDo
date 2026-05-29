using System.Net.Mail;
using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.Common.Validation;
using IDo.Application.DTOs;
using IDo.Domain.Entities;

namespace IDo.Services.Services;

public sealed class UserManagementService(IUnitOfWork unitOfWork, IIdentityAccountService identityAccounts) : IUserManagementService
{
    public async Task<AuthUserDto> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default)
    {
        var (userName, email, password) = NormalizeAndValidateRegisterRequest(request);

        await unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var profile = new User
            {
                FullName = userName,
                Email = email,
                PasswordHash = string.Empty
            };

            await unitOfWork.Users.AddAsync(profile, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            var identityResult = await identityAccounts.CreateAccountAsync(profile.Id, userName, email, password, cancellationToken);
            if (!identityResult.Succeeded)
            {
                throw new RequestValidationException(identityResult.Errors);
            }

            await unitOfWork.CommitTransactionAsync(cancellationToken);
            return new AuthUserDto(profile.Id, userName, email, profile.ToDto());
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task<AuthUserDto> LoginAsync(LoginUserRequest request, CancellationToken cancellationToken = default)
    {
        var identifier = request.Identifier?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(identifier) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new RequestValidationException(["Username/email and password are required."]);
        }

        var account = await identityAccounts.FindByUserNameOrEmailAsync(identifier, cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid username/email or password.");

        var isPasswordValid = await identityAccounts.CheckPasswordAsync(account.AccountId, request.Password, cancellationToken);
        if (!isPasswordValid) throw new UnauthorizedAccessException("Invalid username/email or password.");

        var profile = await unitOfWork.Users.GetByIdAsync(account.UserProfileId, cancellationToken)
            ?? throw new UnauthorizedAccessException("User profile is not available.");
        if (!profile.IsActive) throw new UnauthorizedAccessException("User account is inactive.");

        return new AuthUserDto(profile.Id, account.UserName, account.Email, profile.ToDto());
    }

    public async Task<AuthUserDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var profile = await unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("User profile not found.");
        var account = await identityAccounts.FindByUserProfileIdAsync(profile.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Identity account not found.");
        return new AuthUserDto(profile.Id, account.UserName, account.Email, profile.ToDto());
    }

    private static (string UserName, string Email, string Password) NormalizeAndValidateRegisterRequest(RegisterUserRequest request)
    {
        var userName = request.UserName?.Trim() ?? string.Empty;
        var email = request.Email?.Trim() ?? string.Empty;
        var errors = new List<string>();

        if (userName.Length is < 3 or > 64) errors.Add("Username must be between 3 and 64 characters.");
        if (userName.Any(char.IsWhiteSpace)) errors.Add("Username cannot contain whitespace.");
        if (string.IsNullOrWhiteSpace(email) || !IsValidEmail(email)) errors.Add("A valid email is required.");
        if (string.IsNullOrWhiteSpace(request.Password)) errors.Add("Password is required.");

        if (errors.Count > 0) throw new RequestValidationException(errors);
        return (userName, email, request.Password);
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            return new MailAddress(email).Address.Equals(email, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }
}
