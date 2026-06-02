namespace IDo.Application.DTOs;

public sealed record InviteProjectMemberRequest(
    Guid? UserId,
    string? Username,
    string? Message);
