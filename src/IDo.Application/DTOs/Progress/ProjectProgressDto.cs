namespace IDo.Application.DTOs;

public sealed record ProjectProgressDto(
    Guid ProjectId,
    int DoneCount,
    int TotalCount,
    decimal Percentage);
