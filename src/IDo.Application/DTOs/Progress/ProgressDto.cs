namespace IDo.Application.DTOs;

public sealed record ProgressDto(
    int DoneCount,
    int TotalCount,
    decimal Percentage);
