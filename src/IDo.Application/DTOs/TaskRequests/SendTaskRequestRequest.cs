namespace IDo.Application.DTOs;

public sealed record SendTaskRequestRequest(
    Guid TaskId,
    Guid ReceiverUserId,
    string? Message);
