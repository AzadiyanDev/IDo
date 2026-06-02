namespace IDo.Application.DTOs;

public sealed record RequestAssignTaskRequest(
    Guid ReceiverUserId,
    string? Message);
