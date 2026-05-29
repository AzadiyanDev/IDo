using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using IDo.Domain.Enums;

namespace IDo.Services.Services;

public sealed class TodayService(IUnitOfWork unitOfWork) : ITodayService
{
    public async Task<TodayDashboardDto> GetTodayAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var personalTasks = await unitOfWork.Tasks.GetPersonalTasksByDateAsync(userId, date, cancellationToken);
        var projectTasks = await unitOfWork.Tasks.GetProjectTasksByDateAsync(userId, date, cancellationToken);
        var habits = await unitOfWork.Habits.GetActiveHabitsForDateAsync(userId, date, cancellationToken);
        var requests = await unitOfWork.TaskRequests.GetPendingRequestsForUserAsync(userId, cancellationToken);
        var combinedTasks = personalTasks.Concat(projectTasks).ToArray();
        var summary = new TodaySummaryDto(personalTasks.Count, habits.Count, projectTasks.Count, requests.Count, combinedTasks.Count(x => x.Status == IDoTaskStatus.Done), combinedTasks.Count(x => x.DueDate < date && x.Status != IDoTaskStatus.Done));
        return new TodayDashboardDto(date, personalTasks.Select(x => x.ToDto()).ToArray(), habits.Select(x => x.ToDto()).ToArray(), projectTasks.Select(x => x.ToDto()).ToArray(), requests.Select(x => x.ToDto()).ToArray(), summary);
    }
}
