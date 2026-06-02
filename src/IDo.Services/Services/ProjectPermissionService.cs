using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Domain.Enums;

namespace IDo.Services.Services;

public sealed class ProjectPermissionService(IUnitOfWork unitOfWork) : IProjectPermissionService
{
    public async Task<bool> CanViewProjectAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default) => await unitOfWork.ProjectMembers.IsProjectMemberAsync(projectId, userId, cancellationToken);
    public async Task<bool> CanManageProjectAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default) => await unitOfWork.ProjectMembers.IsProjectOwnerAsync(projectId, userId, cancellationToken);
    public Task<bool> CanManageMembersAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default) => CanManageProjectAsync(projectId, userId, cancellationToken);

    public async Task<bool> CanCreateTaskInSectionAsync(Guid projectId, Guid? sectionId, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await CanManageProjectAsync(projectId, userId, cancellationToken)) return true;
        if (!await unitOfWork.ProjectMembers.IsProjectMemberAsync(projectId, userId, cancellationToken)) return false;
        if (sectionId is null) return true;
        var section = await unitOfWork.ProjectSections.GetByIdAsync(sectionId.Value, cancellationToken);
        return section is not null
            && section.ProjectId == projectId
            && !section.IsArchived
            && (section.Visibility == SectionVisibility.Public || section.AssignedUserId == userId || await IsAcceptedSectionAssigneeAsync(section.Id, userId, cancellationToken));
    }

    public async Task<bool> CanEditSectionAsync(Guid projectId, Guid sectionId, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await CanManageProjectAsync(projectId, userId, cancellationToken)) return true;
        var section = await unitOfWork.ProjectSections.GetByIdAsync(sectionId, cancellationToken);
        return section is not null
            && section.ProjectId == projectId
            && !section.IsArchived
            && (section.AssignedUserId == userId || await IsAcceptedSectionAssigneeAsync(section.Id, userId, cancellationToken));
    }

    public async Task<bool> CanViewTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task is null) return false;
        if (task.ProjectId is null) return task.CreatorUserId == userId || task.AssigneeUserId == userId;
        if (!await unitOfWork.ProjectMembers.IsProjectMemberAsync(task.ProjectId.Value, userId, cancellationToken)) return false;
        if (await CanManageProjectAsync(task.ProjectId.Value, userId, cancellationToken)) return true;
        if (task.SectionId is null) return true;
        var section = await unitOfWork.ProjectSections.GetByIdAsync(task.SectionId.Value, cancellationToken);
        return section is not null && (section.Visibility == SectionVisibility.Public || section.AssignedUserId == userId || task.CreatorUserId == userId || task.AssigneeUserId == userId || await IsAcceptedTaskAssigneeAsync(task.Id, userId, cancellationToken) || await IsAcceptedSectionAssigneeAsync(section.Id, userId, cancellationToken));
    }

    public async Task<bool> CanEditTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task is null) return false;
        if (task.ProjectId is null) return task.CreatorUserId == userId || task.AssigneeUserId == userId;
        if (await CanManageProjectAsync(task.ProjectId.Value, userId, cancellationToken)) return true;
        if (!await unitOfWork.ProjectMembers.IsProjectMemberAsync(task.ProjectId.Value, userId, cancellationToken)) return false;
        if (task.CreatorUserId == userId || task.AssigneeUserId == userId || await IsAcceptedTaskAssigneeAsync(task.Id, userId, cancellationToken)) return true;
        if (task.SectionId.HasValue)
        {
            var section = await unitOfWork.ProjectSections.GetByIdAsync(task.SectionId.Value, cancellationToken);
            return section is not null && (section.AssignedUserId == userId || await IsAcceptedSectionAssigneeAsync(section.Id, userId, cancellationToken));
        }

        return false;
    }

    public async Task<bool> CanCompleteTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task is null) return false;
        if (task.ProjectId is null) return task.CreatorUserId == userId || task.AssigneeUserId == userId;
        return task.AssigneeUserId == userId || await IsAcceptedTaskAssigneeAsync(task.Id, userId, cancellationToken) || await CanManageProjectAsync(task.ProjectId.Value, userId, cancellationToken);
    }

    private Task<bool> IsAcceptedTaskAssigneeAsync(Guid taskId, Guid userId, CancellationToken cancellationToken) =>
        unitOfWork.TaskRequests.ExistsAsync(
            x => x.Type == CollaborationRequestType.TaskAssignment
                && x.TaskId == taskId
                && x.ReceiverUserId == userId
                && x.Status == TaskRequestStatus.Accepted,
            cancellationToken);

    private Task<bool> IsAcceptedSectionAssigneeAsync(Guid sectionId, Guid userId, CancellationToken cancellationToken) =>
        unitOfWork.TaskRequests.ExistsAsync(
            x => x.Type == CollaborationRequestType.SectionAssignment
                && x.SectionId == sectionId
                && x.ReceiverUserId == userId
                && x.Status == TaskRequestStatus.Accepted,
            cancellationToken);
}
