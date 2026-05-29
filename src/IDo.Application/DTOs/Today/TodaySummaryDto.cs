namespace IDo.Application.DTOs;

public sealed record TodaySummaryDto(
    int PersonalTaskCount,
    int PersonalTaskDoneCount,
    int HabitCount,
    int HabitDoneCount,
    int ProjectTaskCount,
    int ProjectTaskDoneCount,
    int PendingRequestCount,
    int DoneCount,
    int OverdueCount,
    decimal DonePercentage);
