namespace IDo.Application.DTOs;

public sealed record RegisterUserRequest(
    string UserName,
    string Email,
    string Password);

public sealed record LoginUserRequest(
    string Identifier,
    string Password);

public sealed record AuthUserDto(
    Guid UserId,
    string UserName,
    string Email,
    UserProfileDto Profile);
