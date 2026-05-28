using IDo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IDo.Infrastructure.Persistence.Configurations.Notifications;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications", IDoDatabaseSchema.Name);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(48);
        builder.Property(x => x.Title).HasMaxLength(240).IsRequired();
        builder.Property(x => x.Body).HasMaxLength(1000);
        builder.HasOne(x => x.User).WithMany(x => x.Notifications).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAtUtc });
        builder.HasIndex(x => x.RelatedTaskId);
        builder.HasIndex(x => x.RelatedProjectId);
        builder.HasIndex(x => x.RelatedHabitId);
        builder.HasIndex(x => x.RelatedTaskRequestId);
    }
}
