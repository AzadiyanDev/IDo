using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record TaskDetailsDto(
    TaskDto Task,
    string? ProjectTitle,
    string? SectionTitle,
    string? AssigneeDisplayName,
    string? CreatorDisplayName,
    ProjectTaskAssignmentStatus AssignmentStatus,
    IReadOnlyCollection<TaskCommentDto> Comments,
    IReadOnlyCollection<TaskRequestDto> PendingRequests);
