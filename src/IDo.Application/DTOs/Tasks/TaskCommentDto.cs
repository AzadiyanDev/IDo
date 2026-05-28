namespace IDo.Application.DTOs;

public sealed record TaskCommentDto(
    Guid Id,
    Guid TaskId,
    Guid UserId,
    string Body,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc);
