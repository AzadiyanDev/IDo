namespace IDo.Application.DTOs;

public sealed record RequestAssignSectionRequest(
    Guid ReceiverUserId,
    string? Message);
