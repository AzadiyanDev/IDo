namespace IDo.Application.DTOs;

public sealed record RolloverTasksRequest(
    DateOnly SourceDate,
    DateOnly TargetDate);

public sealed record RolloverTasksResponse(
    DateOnly SourceDate,
    DateOnly TargetDate,
    int MovedCount,
    IReadOnlyCollection<TaskDto> MovedTasks);
