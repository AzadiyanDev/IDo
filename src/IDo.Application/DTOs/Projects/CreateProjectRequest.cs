namespace IDo.Application.DTOs;

public sealed record CreateProjectRequest(
    string Title,
    string? Description,
    string? Color,
    string? Icon);
