using IDo.Application.Abstractions.DateTime;
using IDo.Application.Abstractions.Persistence;
using IDo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Persistence.Repositories;

public sealed class NotificationRepository(IDoDbContext dbContext, IDateTimeProvider dateTimeProvider)
    : EfRepository<Notification>(dbContext, dateTimeProvider), INotificationRepository
{
    public async Task<IReadOnlyList<Notification>> GetUnreadAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await DbContext.Notifications
            .Where(x => x.UserId == userId && !x.IsRead)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public async Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        var notification = await DbContext.Notifications.FirstOrDefaultAsync(x => x.Id == notificationId, cancellationToken);
        if (notification is null) return;

        notification.IsRead = true;
        notification.ReadAtUtc = DateTimeProvider.UtcNow;
    }
}
