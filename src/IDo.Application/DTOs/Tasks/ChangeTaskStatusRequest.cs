using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record ChangeTaskStatusRequest(IDoTaskStatus Status);
