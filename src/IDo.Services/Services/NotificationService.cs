using IDo.Application.Abstractions.Notifications;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using IDo.Domain.Entities;
using IDo.Domain.Enums;

namespace IDo.Services.Services;

public sealed class NotificationService(IUnitOfWork unitOfWork, INotificationPublisher publisher) : INotificationService
{
    public async Task<NotificationDto> CreateNotificationAsync(Guid userId, NotificationType type, string title, string? body, Guid? relatedTaskId = null, Guid? relatedProjectId = null, Guid? relatedHabitId = null, Guid? relatedTaskRequestId = null, CancellationToken cancellationToken = default)
    {
        var notification = new Notification { UserId = userId, Type = type, Title = title, Body = body, RelatedTaskId = relatedTaskId, RelatedProjectId = relatedProjectId, RelatedHabitId = relatedHabitId, RelatedTaskRequestId = relatedTaskRequestId };
        await unitOfWork.Notifications.AddAsync(notification, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(userId, title, body, cancellationToken);
        return notification.ToDto();
    }

    public Task<NotificationDto> CreateTaskReminderAsync(Guid userId, Guid taskId, string title, string? body, CancellationToken cancellationToken = default) => CreateNotificationAsync(userId, NotificationType.TaskReminder, title, body, relatedTaskId: taskId, cancellationToken: cancellationToken);
    public Task<NotificationDto> CreateHabitReminderAsync(Guid userId, Guid habitId, string title, string? body, CancellationToken cancellationToken = default) => CreateNotificationAsync(userId, NotificationType.HabitReminder, title, body, relatedHabitId: habitId, cancellationToken: cancellationToken);
    public Task<NotificationDto> CreateTaskRequestNotificationAsync(Guid userId, Guid taskRequestId, string title, string? body, CancellationToken cancellationToken = default) => CreateNotificationAsync(userId, NotificationType.TaskRequest, title, body, relatedTaskRequestId: taskRequestId, cancellationToken: cancellationToken);
    public Task<NotificationDto> CreateProjectInviteNotificationAsync(Guid userId, Guid projectId, string title, string? body, CancellationToken cancellationToken = default) => CreateNotificationAsync(userId, NotificationType.ProjectInvite, title, body, relatedProjectId: projectId, cancellationToken: cancellationToken);

    public async Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        await unitOfWork.Notifications.MarkAsReadAsync(notificationId, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
