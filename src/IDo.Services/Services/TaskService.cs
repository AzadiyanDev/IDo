using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.Common.Validation;
using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;

namespace IDo.Services.Services;

public sealed class TaskService(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider, IProjectPermissionService permissions) : ITaskService
{
    public Task<TaskDto> CreatePersonalTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default) => CreateTaskAsync(userId, request with { ProjectId = null, SectionId = null }, IDoTaskType.Personal, cancellationToken);

    public Task<TaskDto> CreateProjectTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default) => CreateTaskAsync(userId, request, IDoTaskType.Project, cancellationToken);

    public async Task<TaskDto> UpdateTaskAsync(Guid userId, Guid taskId, UpdateTaskRequest request, CancellationToken cancellationToken = default)
    {
        RequestValidators.Validate(request);
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanEditTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot edit this task.");
        task.Title = request.Title.Trim();
        task.Description = request.Description;
        task.Color = request.Color;
        task.Icon = request.Icon;
        task.DueDate = request.DueDate;
        task.DueTime = request.DueTime;
        task.ReminderAtUtc = request.ReminderAtUtc;
        task.AssigneeUserId = request.AssigneeUserId;
        task.IsCountableInProgress = request.IsCountableInProgress;
        if (request.Status.HasValue) ApplyStatus(task, request.Status.Value);
        unitOfWork.Tasks.Update(task);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return task.ToDto();
    }

    public Task<TaskDto> CompleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default) => ChangeStatusAsync(userId, taskId, IDoTaskStatus.Done, cancellationToken);

    public async Task<TaskDto> ChangeStatusAsync(Guid userId, Guid taskId, IDoTaskStatus status, CancellationToken cancellationToken = default)
    {
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanCompleteTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot change this task.");
        ApplyStatus(task, status);
        unitOfWork.Tasks.Update(task);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return task.ToDto();
    }

    public async Task ArchiveTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanEditTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot archive this task.");
        ApplyStatus(task, IDoTaskStatus.Archived);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await RequireTask(taskId, cancellationToken);
        if (!await permissions.CanEditTaskAsync(taskId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot delete this task.");
        unitOfWork.Tasks.SoftDelete(task, userId);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<TaskCommentDto> AddCommentAsync(Guid userId, Guid taskId, CreateTaskCommentRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Body)) throw new RequestValidationException(["Comment body is required."]);
        _ = await RequireTask(taskId, cancellationToken);
        var comment = new TaskComment { TaskId = taskId, UserId = userId, Body = request.Body.Trim(), CreatedByUserId = userId };
        await unitOfWork.TaskComments.AddAsync(comment, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return comment.ToDto();
    }

    public async Task<TaskDetailsDto> GetTaskDetailsAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await unitOfWork.Tasks.GetTaskWithCommentsAsync(taskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");
        return new TaskDetailsDto(task.ToDto(), task.Comments.OrderBy(x => x.CreatedAtUtc).Select(x => x.ToDto()).ToArray(), task.SentRequests.Where(x => x.Status == TaskRequestStatus.Pending).Select(x => x.ToDto()).ToArray());
    }

    private async Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskRequest request, IDoTaskType type, CancellationToken cancellationToken)
    {
        RequestValidators.Validate(request);
        if (type == IDoTaskType.Project)
        {
            if (request.ProjectId is null) throw new RequestValidationException(["Project task requires ProjectId."]);
            if (!await permissions.CanCreateTaskInSectionAsync(request.ProjectId.Value, request.SectionId, userId, cancellationToken)) throw new UnauthorizedAccessException("User cannot create a task in this project section.");
            if (request.AssigneeUserId.HasValue && !await unitOfWork.ProjectMembers.IsProjectMemberAsync(request.ProjectId.Value, request.AssigneeUserId.Value, cancellationToken)) throw new RequestValidationException(["Project task assignee must be an active project member."]);
        }

        var task = new IDoTask
        {
            CreatorUserId = userId,
            AssigneeUserId = request.AssigneeUserId ?? userId,
            ProjectId = request.ProjectId,
            SectionId = request.SectionId,
            HabitId = request.HabitId,
            Title = request.Title.Trim(),
            Description = request.Description,
            Color = request.Color,
            Icon = request.Icon,
            DueDate = request.DueDate,
            DueTime = request.DueTime,
            ReminderAtUtc = request.ReminderAtUtc,
            Type = type,
            IsCountableInProgress = request.IsCountableInProgress,
            CreatedByUserId = userId
        };
        await unitOfWork.Tasks.AddAsync(task, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return task.ToDto();
    }

    private async Task<IDoTask> RequireTask(Guid taskId, CancellationToken cancellationToken) => await unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken) ?? throw new KeyNotFoundException("Task not found.");

    private void ApplyStatus(IDoTask task, IDoTaskStatus status)
    {
        task.Status = status;
        task.CompletedAtUtc = status == IDoTaskStatus.Done ? dateTimeProvider.UtcNow : null;
    }
}
