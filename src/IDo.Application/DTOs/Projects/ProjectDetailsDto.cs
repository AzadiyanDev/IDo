namespace IDo.Application.DTOs;

public sealed record ProjectDetailsDto(
    ProjectDto Project,
    IReadOnlyCollection<ProjectSectionDto> Sections,
    IReadOnlyCollection<ProjectMemberDto> Members,
    IReadOnlyCollection<TaskDto> Tasks,
    ProjectProgressDto Progress);
