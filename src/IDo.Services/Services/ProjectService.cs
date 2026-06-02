using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.Common.Validation;
using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;
using IDo.Services.Rules;

namespace IDo.Services.Services;

public sealed class ProjectService(
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider,
    IProjectPermissionService permissions,
    IIdentityAccountService identityAccounts,
    INotificationService notifications) : IProjectService
{
    public async Task<ProjectDto> CreateProjectAsync(Guid ownerUserId, CreateProjectRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        var project = new Project
        {
            OwnerUserId = ownerUserId,
            Title = request.Title.Trim(),
            Description = request.Description,
            Color = request.Color,
            Icon = request.Icon,
            CreatedByUserId = ownerUserId
        };
        var owner = new ProjectMember
        {
            Project = project,
            ProjectId = project.Id,
            UserId = ownerUserId,
            Role = ProjectMemberRole.Owner,
            Status = ProjectMemberStatus.Active,
            JoinedAtUtc = dateTimeProvider.UtcNow
        };
        await unitOfWork.Projects.AddAsync(project, cancellationToken);
        await unitOfWork.ProjectMembers.AddAsync(owner, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return project.ToDto();
    }

    public async Task<IReadOnlyCollection<ProjectDto>> GetMyProjectsAsync(Guid userId, CancellationToken cancellationToken = default) =>
        (await unitOfWork.Projects.GetUserProjectsAsync(userId, cancellationToken)).Select(x => x.ToDto()).ToArray();

    public async Task<ProjectDto> UpdateProjectAsync(Guid userId, Guid projectId, UpdateProjectRequest request, CancellationToken cancellationToken = default)
    {
        var project = await RequireActiveProject(projectId, cancellationToken);
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

    public async Task<IReadOnlyCollection<UserSearchResultDto>> SearchUsersByUsernameAsync(Guid userId, Guid projectId, string query, int take = 10, CancellationToken cancellationToken = default)
    {
        if (!await permissions.CanManageMembersAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot search members for this project.");
        var accounts = await identityAccounts.SearchByUserNameAsync(query, Math.Clamp(take, 1, 25), cancellationToken);
        var results = new List<UserSearchResultDto>();
        foreach (var account in accounts.Where(x => x.UserProfileId != userId))
        {
            var profile = await unitOfWork.Users.GetByIdAsync(account.UserProfileId, cancellationToken);
            if (profile is null || !profile.IsActive) continue;
            var membership = await unitOfWork.ProjectMembers.GetMembershipAsync(projectId, profile.Id, cancellationToken);
            var pendingInvite = await unitOfWork.TaskRequests.GetProjectInvitePendingRequestAsync(projectId, profile.Id, cancellationToken);
            results.Add(new UserSearchResultDto(
                profile.Id,
                account.UserName,
                profile.FullName,
                profile.AvatarUrl,
                membership?.Status == ProjectMemberStatus.Active,
                pendingInvite is not null));
        }

        return results;
    }

    public async Task<TaskRequestDto> InviteUserToProjectAsync(Guid userId, Guid projectId, InviteProjectMemberRequest request, CancellationToken cancellationToken = default)
    {
        var project = await RequireActiveProject(projectId, cancellationToken);
        if (!await permissions.CanManageMembersAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("Only project owner can invite members.");
        var receiverUserId = await ResolveReceiverUserIdAsync(request.UserId, request.Username, cancellationToken);
        if (receiverUserId == userId) throw new RequestValidationException(["You cannot invite yourself."]);

        var existing = await unitOfWork.ProjectMembers.GetMembershipAsync(projectId, receiverUserId, cancellationToken);
        if (existing?.Status == ProjectMemberStatus.Active) throw new RequestValidationException(["User is already an active project member."]);
        if (await unitOfWork.TaskRequests.GetProjectInvitePendingRequestAsync(projectId, receiverUserId, cancellationToken) is not null) throw new RequestValidationException(["This user already has a pending project invitation."]);

        var collaborationRequest = new TaskRequest
        {
            Type = CollaborationRequestType.ProjectInvite,
            ProjectId = projectId,
            SenderUserId = userId,
            ReceiverUserId = receiverUserId,
            Title = $"Invitation to {project.Title}",
            Message = request.Message
        };
        await unitOfWork.TaskRequests.AddAsync(collaborationRequest, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await notifications.CreateProjectInviteNotificationAsync(receiverUserId, projectId, collaborationRequest.Title, request.Message, cancellationToken);
        return collaborationRequest.ToDto();
    }

    public async Task<ProjectSectionDto> AddSectionAsync(Guid userId, Guid projectId, CreateProjectSectionRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        await RequireActiveProject(projectId, cancellationToken);
        if (!await permissions.CanManageProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot add sections.");

        var section = new ProjectSection
        {
            ProjectId = projectId,
            Title = request.Title.Trim(),
            Description = request.Description,
            Color = request.Color,
            Icon = request.Icon,
            Order = request.Order,
            Visibility = request.Visibility,
            CreatedByUserId = userId
        };

        await unitOfWork.ProjectSections.AddAsync(section, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        if (request.AssignedUserId.HasValue)
        {
            await CreateSectionAssignmentRequestAsync(userId, projectId, section, request.AssignedUserId.Value, null, cancellationToken);
        }

        return section.ToDto();
    }

    public async Task<ProjectSectionDto> UpdateSectionAsync(Guid userId, Guid projectId, Guid sectionId, CreateProjectSectionRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        await RequireActiveProject(projectId, cancellationToken);
        var section = await unitOfWork.ProjectSections.GetSectionWithTasksAsync(sectionId, cancellationToken) ?? throw new KeyNotFoundException("Section not found.");
        if (section.ProjectId != projectId) throw new KeyNotFoundException("Section not found.");
        if (!await permissions.CanEditSectionAsync(projectId, sectionId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot update sections.");

        section.Title = request.Title.Trim();
        section.Description = request.Description;
        section.Color = request.Color;
        section.Icon = request.Icon;
        section.Order = request.Order;
        section.Visibility = request.Visibility;

        if (await permissions.CanManageProjectAsync(projectId, userId, cancellationToken))
        {
            if (request.AssignedUserId is null)
            {
                section.AssignedUserId = null;
                section.PendingAssignedUserId = null;
                section.AssignmentStatus = ProjectSectionAssignmentStatus.None;
            }
            else if (request.AssignedUserId != section.AssignedUserId)
            {
                await CreateSectionAssignmentRequestAsync(userId, projectId, section, request.AssignedUserId.Value, null, cancellationToken);
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return section.ToDto();
    }

    public async Task<TaskRequestDto> RequestAssignSectionAsync(Guid userId, Guid projectId, Guid sectionId, RequestAssignSectionRequest request, CancellationToken cancellationToken = default)
    {
        await RequireActiveProject(projectId, cancellationToken);
        if (!await permissions.CanManageProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("Only project owner can assign sections.");
        var section = await unitOfWork.ProjectSections.GetSectionWithTasksAsync(sectionId, cancellationToken) ?? throw new KeyNotFoundException("Section not found.");
        if (section.ProjectId != projectId) throw new KeyNotFoundException("Section not found.");
        return (await CreateSectionAssignmentRequestAsync(userId, projectId, section, request.ReceiverUserId, request.Message, cancellationToken)).ToDto();
    }

    public async Task<ProjectMemberDto> AddMemberAsync(Guid userId, Guid projectId, AddProjectMemberRequest request, CancellationToken cancellationToken = default)
    {
        if (!await permissions.CanManageMembersAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot manage members.");
        if (await unitOfWork.ProjectMembers.IsProjectMemberAsync(projectId, request.UserId, cancellationToken)) throw new RequestValidationException(["User is already an active project member."]);
        var member = new ProjectMember { ProjectId = projectId, UserId = request.UserId, Role = request.Role, Status = ProjectMemberStatus.Active, InvitedByUserId = userId, JoinedAtUtc = dateTimeProvider.UtcNow };
        await unitOfWork.ProjectMembers.AddAsync(member, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        member.User = await unitOfWork.Users.GetByIdAsync(request.UserId, cancellationToken) ?? member.User;
        return member.ToDto();
    }

    public async Task RemoveMemberAsync(Guid userId, Guid projectId, Guid memberId, CancellationToken cancellationToken = default)
    {
        if (!await permissions.CanManageMembersAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot manage members.");
        var member = await unitOfWork.ProjectMembers.GetByIdAsync(memberId, cancellationToken) ?? throw new KeyNotFoundException("Member not found.");
        if (member.ProjectId != projectId) throw new KeyNotFoundException("Member not found.");
        if (member.Role == ProjectMemberRole.Owner) throw new RequestValidationException(["Project owner cannot be removed."]);
        member.Status = ProjectMemberStatus.Removed;
        member.RemovedAtUtc = dateTimeProvider.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProjectDetailsDto> GetProjectDetailsAsync(Guid userId, Guid projectId, CancellationToken cancellationToken = default)
    {
        if (!await permissions.CanViewProjectAsync(projectId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot view this project.");
        var project = await unitOfWork.Projects.GetProjectDetailsAsync(projectId, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
        var progress = await CalculateProjectProgressAsync(projectId, cancellationToken);
        var role = await unitOfWork.ProjectMembers.GetMemberRoleAsync(projectId, userId, cancellationToken);
        var canManage = await permissions.CanManageProjectAsync(projectId, userId, cancellationToken);
        var permissionsDto = new ProjectPermissionsDto(canManage, canManage, canManage, true, canManage);
        return new ProjectDetailsDto(
            project.ToDto(),
            project.Sections.Where(x => !x.IsArchived).OrderBy(x => x.Order).Select(x => x.ToDto()).ToArray(),
            project.Members.Select(x => x.ToDto()).ToArray(),
            project.Tasks.Select(x => x.ToDto()).ToArray(),
            progress,
            role,
            permissionsDto);
    }

    public async Task<ProjectProgressDto> CalculateProjectProgressAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await unitOfWork.Projects.GetProjectWithSectionsAndTasksAsync(projectId, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");
        var countable = project.Tasks.Where(x => x.IsCountableInProgress && x.Status != IDoTaskStatus.Archived && !x.IsDeleted).ToArray();
        return new ProjectProgressDto(projectId, countable.Count(x => x.Status == IDoTaskStatus.Done), countable.Length, ProjectRules.CalculateProgressPercentage(project.Tasks));
    }

    private async Task<TaskRequest> CreateSectionAssignmentRequestAsync(Guid senderUserId, Guid projectId, ProjectSection section, Guid receiverUserId, string? message, CancellationToken cancellationToken)
    {
        if (receiverUserId == senderUserId && await permissions.CanManageProjectAsync(projectId, senderUserId, cancellationToken))
        {
            section.AssignedUserId = receiverUserId;
            section.PendingAssignedUserId = null;
            section.AssignmentStatus = ProjectSectionAssignmentStatus.Accepted;
            section.Visibility = SectionVisibility.AssignedToMember;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return new TaskRequest
            {
                Type = CollaborationRequestType.SectionAssignment,
                ProjectId = projectId,
                SectionId = section.Id,
                SenderUserId = senderUserId,
                ReceiverUserId = receiverUserId,
                Status = TaskRequestStatus.Accepted,
                Title = $"Section assigned: {section.Title}",
                Message = message,
                RespondedAtUtc = dateTimeProvider.UtcNow
            };
        }

        if (!await HasActiveMembershipOrPendingInviteAsync(projectId, receiverUserId, cancellationToken)) throw new RequestValidationException(["Section assignee must be an active project member or have a pending project invitation."]);
        if (await unitOfWork.TaskRequests.GetSectionPendingRequestAsync(section.Id, receiverUserId, cancellationToken) is not null) throw new RequestValidationException(["This section already has a pending assignment request for that member."]);
        section.PendingAssignedUserId = receiverUserId;
        section.AssignmentStatus = ProjectSectionAssignmentStatus.Pending;
        section.Visibility = SectionVisibility.AssignedToMember;
        var collaborationRequest = new TaskRequest
        {
            Type = CollaborationRequestType.SectionAssignment,
            ProjectId = projectId,
            SectionId = section.Id,
            SenderUserId = senderUserId,
            ReceiverUserId = receiverUserId,
            Title = $"Section assignment: {section.Title}",
            Message = message
        };
        await unitOfWork.TaskRequests.AddAsync(collaborationRequest, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await notifications.CreateNotificationAsync(receiverUserId, NotificationType.TaskRequest, collaborationRequest.Title, message, relatedProjectId: projectId, relatedTaskRequestId: collaborationRequest.Id, cancellationToken: cancellationToken);
        return collaborationRequest;
    }

    private async Task<bool> HasActiveMembershipOrPendingInviteAsync(Guid projectId, Guid receiverUserId, CancellationToken cancellationToken)
    {
        if (await unitOfWork.ProjectMembers.IsProjectMemberAsync(projectId, receiverUserId, cancellationToken)) return true;
        return await unitOfWork.TaskRequests.GetProjectInvitePendingRequestAsync(projectId, receiverUserId, cancellationToken) is not null;
    }

    private async Task<Guid> ResolveReceiverUserIdAsync(Guid? userId, string? username, CancellationToken cancellationToken)
    {
        if (userId.HasValue) return userId.Value;
        if (string.IsNullOrWhiteSpace(username)) throw new RequestValidationException(["Receiver username is required."]);
        var account = await identityAccounts.FindByUserNameOrEmailAsync(username.Trim(), cancellationToken)
            ?? throw new KeyNotFoundException("User not found.");
        return account.UserProfileId;
    }

    private async Task<Project> RequireProject(Guid projectId, CancellationToken cancellationToken) =>
        await unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken) ?? throw new KeyNotFoundException("Project not found.");

    private async Task<Project> RequireActiveProject(Guid projectId, CancellationToken cancellationToken)
    {
        var project = await RequireProject(projectId, cancellationToken);
        if (project.Status == ProjectStatus.Archived) throw new RequestValidationException(["Archived projects cannot be changed."]);
        return project;
    }
}
