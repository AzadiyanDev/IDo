using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record TaskRequestDto(
    Guid Id,
    Guid TaskId,
    Guid SenderUserId,
    Guid ReceiverUserId,
    TaskRequestStatus Status,
    string? Message,
    DateTime CreatedAtUtc,
    DateTime? RespondedAtUtc,
    string? ResponseNote);
