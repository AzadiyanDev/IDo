using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.Common.Validation;
using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;
using IDo.Services.Rules;

namespace IDo.Services.Services;

public sealed class ProjectService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider, IProjectPermissionService permissions) : IProjectService
{
    public async Task<ProjectDto> CreateProjectAsync(Guid ownerUserId, CreateProjectRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        var project = new Project { OwnerUserId = ownerUserId, Title = request.Title.Trim(), Description = request.Description, Color = request.Color, Icon = request.Icon, CreatedByUserId = ownerUserId };
        var owner = new ProjectMember { Project = project, UserId = ownerUserId, Role = ProjectMemberRole.Owner, Status = ProjectMemberStatus.Active, JoinedAtUtc = dateTimeProvider.UtcNow };
        project.Members.Add(owner);
        await unitOfWork.Projects.AddAsync(project, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return project.ToDto();
    }

    public async Task<ProjectDto> UpdateProjectAsync(Guid userId, Guid projectId, UpdateProjectRequest request, CancellationToken cancellationToken = default)
    {
        var project = await RequireProject(projectId, cancellationToken);
        if (!await permissions.CanManageProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot manage this project.");
        project.Title = request.Title.Trim();
        project.Description = request.Description;
        project.Color = request.Color;
        project.Icon = request.Icon;
        project.Status = request.Status;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return project.ToDto();
    }

    public async Task ArchiveProjectAsync(Guid userId, Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await RequireProject(projectId, cancellationToken);
        if (!await permissions.CanManageProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot archive this project.");
        project.Status = ProjectStatus.Archived;
        project.ArchivedAtUtc = dateTimeProvider.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProjectSectionDto> AddSectionAsync(Guid userId, Guid projectId, CreateProjectSectionRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        if (!await permissions.CanManageProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot add sections.");
        if (request.AssignedUserId.HasValue && !await unitOfWork.ProjectMembers.IsProjectMemberAsync(projectId, request.AssignedUserId.Value, cancellationToken)) throw new RequestValidationException(["Assigned user must be an active project member."]);
        var section = new ProjectSection { ProjectId = projectId, Title = request.Title.Trim(), Description = request.Description, Order = request.Order, Visibility = request.Visibility, AssignedUserId = request.AssignedUserId, CreatedByUserId = userId };
        await unitOfWork.ProjectSections.AddAsync(section, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return section.ToDto();
    }

    public async Task<ProjectSectionDto> UpdateSectionAsync(Guid userId, Guid projectId, Guid sectionId, CreateProjectSectionRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        var section = await unitOfWork.ProjectSections.GetByIdAsync(sectionId, cancellationToken) ?? throw new KeyNotFoundException("Section not found.");
        if (section.ProjectId != projectId) throw new KeyNotFoundException("Section not found.");
        if (!await permissions.CanManageProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot update sections.");
        section.Title = request.Title.Trim();
        section.Description = request.Description;
        section.Order = request.Order;
        section.Visibility = request.Visibility;
        section.AssignedUserId = request.AssignedUserId;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return section.ToDto();
    }

    public async Task<ProjectMemberDto> AddMemberAsync(Guid userId, Guid projectId, AddProjectMemberRequest request, CancellationToken cancellationToken = default)
    {
        if (!await permissions.CanManageMembersAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot manage members.");
        var member = new ProjectMember { ProjectId = projectId, UserId = request.UserId, Role = request.Role, Status = ProjectMemberStatus.Active, JoinedAtUtc = dateTimeProvider.UtcNow };
        await unitOfWork.ProjectMembers.AddAsync(member, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return member.ToDto();
    }

    public async Task RemoveMemberAsync(Guid userId, Guid projectId, Guid memberId, CancellationToken cancellationToken = default)
    {
        if (!await permissions.CanManageMembersAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot manage members.");
        var member = await unitOfWork.ProjectMembers.GetByIdAsync(memberId, cancellationToken) ?? throw new KeyNotFoundException("Member not found.");
        member.Status = ProjectMemberStatus.Removed;
        member.RemovedAtUtc = dateTimeProvider.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProjectDetailsDto> GetProjectDetailsAsync(Guid userId, Guid projectId, CancellationToken cancellationToken = default)
    {
        if (!await permissions.CanViewProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot view this project.");
        var project = await unitOfWork.Projects.GetProjectDetailsAsync(projectId, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
        var progress = await CalculateProjectProgressAsync(projectId, cancellationToken);
        return new ProjectDetailsDto(project.ToDto(), project.Sections.Select(x => x.ToDto()).ToArray(), project.Members.Select(x => x.ToDto()).ToArray(), project.Tasks.Select(x => x.ToDto()).ToArray(), progress);
    }

    public async Task<ProjectProgressDto> CalculateProjectProgressAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await unitOfWork.Projects.GetProjectWithSectionsAndTasksAsync(projectId, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
        var countable = project.Tasks.Where(x => x.IsCountableInProgress && x.Status != IDoTaskStatus.Archived && !x.IsDeleted).ToArray();
        return new ProjectProgressDto(projectId, countable.Count(x => x.Status == IDoTaskStatus.Done), countable.Length, ProjectRules.CalculateProgressPercentage(project.Tasks));
    }

    private async Task<Project> RequireProject(Guid projectId, CancellationToken cancellationToken) => await unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
}
