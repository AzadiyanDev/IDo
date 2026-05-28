namespace IDo.Application.DTOs;

public sealed record TaskDetailsDto(
    TaskDto Task,
    IReadOnlyCollection<TaskCommentDto> Comments,
    IReadOnlyCollection<TaskRequestDto> PendingRequests);
