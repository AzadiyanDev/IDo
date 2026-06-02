using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record CreateProjectSectionRequest(
    string Title,
    string? Description,
    string? Color,
    string? Icon,
    int Order,
    SectionVisibility Visibility,
    Guid? AssignedUserId);
