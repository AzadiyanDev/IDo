using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record ProjectDetailsDto(
    ProjectDto Project,
    IReadOnlyCollection<ProjectSectionDto> Sections,
    IReadOnlyCollection<ProjectMemberDto> Members,
    IReadOnlyCollection<TaskDto> Tasks,
    ProjectProgressDto Progress,
    ProjectMemberRole? CurrentUserRole,
    ProjectPermissionsDto Permissions);

public sealed record ProjectPermissionsDto(
    bool CanManageProject,
    bool CanManageMembers,
    bool CanCreateSection,
    bool CanCreateTask,
    bool CanAssignMembers);
