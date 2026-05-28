namespace IDo.Application.DTOs;

public sealed record WeeklyActivityDto(
    DateOnly WeekStartDate,
    IReadOnlyDictionary<DateOnly, int> CompletedCountByDate);
