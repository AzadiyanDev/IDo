using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record ProjectSectionDto(
    Guid Id,
    Guid ProjectId,
    string Title,
    string? Description,
    int Order,
    SectionVisibility Visibility,
    Guid? AssignedUserId);
