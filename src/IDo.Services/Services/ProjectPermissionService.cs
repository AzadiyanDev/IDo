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
        return section is not null && section.ProjectId == projectId && (section.Visibility == SectionVisibility.Public || section.AssignedUserId == userId);
    }

    public async Task<bool> CanEditTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task is null) return false;
        if (task.ProjectId is null) return task.CreatorUserId == userId || task.AssigneeUserId == userId;
        if (await CanManageProjectAsync(task.ProjectId.Value, userId, cancellationToken)) return true;
        if (task.SectionId.HasValue) return await CanCreateTaskInSectionAsync(task.ProjectId.Value, task.SectionId, userId, cancellationToken);
        return task.CreatorUserId == userId || task.AssigneeUserId == userId;
    }

    public Task<bool> CanCompleteTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken = default) => CanEditTaskAsync(taskId, userId, cancellationToken);
}
