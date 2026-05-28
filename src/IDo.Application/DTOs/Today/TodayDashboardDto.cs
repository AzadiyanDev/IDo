namespace IDo.Application.DTOs;

public sealed record TodayDashboardDto(
    DateOnly Date,
    IReadOnlyCollection<TaskDto> PersonalTasks,
    IReadOnlyCollection<HabitDto> TodayHabits,
    IReadOnlyCollection<TaskDto> ProjectTasks,
    IReadOnlyCollection<TaskRequestDto> PendingTaskRequests,
    TodaySummaryDto Summary);
