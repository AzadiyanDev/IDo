namespace IDo.Application.DTOs;

public sealed record TodayDashboardDto(
    DateOnly Date,
    IReadOnlyCollection<TaskDto> PersonalTasks,
    IReadOnlyCollection<TodayHabitDto> TodayHabits,
    IReadOnlyCollection<TaskDto> ProjectTasks,
    IReadOnlyCollection<TodayProjectDto> ActiveProjects,
    IReadOnlyCollection<TaskRequestDto> PendingTaskRequests,
    TodaySummaryDto Summary);

public sealed record TodayHabitDto(
    Guid Id,
    Guid UserId,
    string Title,
    string? Description,
    string? Color,
    string? Icon,
    int CurrentStreak,
    int BestStreak,
    bool IsCompletedToday);

public sealed record TodayProjectDto(
    ProjectDto Project,
    int TaskCount,
    int DoneCount);
