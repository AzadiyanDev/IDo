using IDo.Application.Abstractions.Notifications;

namespace IDo.Infrastructure.Notifications;

public sealed class NoOpNotificationPublisher : INotificationPublisher
{
    public Task PublishAsync(Guid userId, string title, string? body, CancellationToken cancellationToken = default) => Task.CompletedTask;
}
