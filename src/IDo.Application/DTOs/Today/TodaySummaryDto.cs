namespace IDo.Application.DTOs;

public sealed record TodaySummaryDto(
    int PersonalTaskCount,
    int HabitCount,
    int ProjectTaskCount,
    int PendingRequestCount,
    int DoneCount,
    int OverdueCount);
