namespace IDo.Application.Abstractions.Notifications;

public interface INotificationPublisher
{
    Task PublishAsync(Guid userId, string title, string? body, CancellationToken cancellationToken = default);
}
