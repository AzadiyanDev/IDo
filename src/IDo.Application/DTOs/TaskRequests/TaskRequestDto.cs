using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record TaskRequestDto(
    Guid Id,
    CollaborationRequestType Type,
    Guid? ProjectId,
    Guid? SectionId,
    Guid? TaskId,
    Guid SenderUserId,
    Guid ReceiverUserId,
    TaskRequestStatus Status,
    string Title,
    string? Message,
    DateTime CreatedAtUtc,
    DateTime? RespondedAtUtc,
    string? ResponseNote);
