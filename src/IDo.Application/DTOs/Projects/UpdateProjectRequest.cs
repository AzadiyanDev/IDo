using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record UpdateProjectRequest(
    string Title,
    string? Description,
    string? Color,
    string? Icon,
    ProjectStatus Status);
