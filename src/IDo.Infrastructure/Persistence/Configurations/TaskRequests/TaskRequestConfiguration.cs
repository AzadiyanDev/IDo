using IDo.Domain.Entities;
using IDo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IDo.Infrastructure.Persistence.Configurations.TaskRequests;

public sealed class TaskRequestConfiguration : IEntityTypeConfiguration<TaskRequest>
{
    public void Configure(EntityTypeBuilder<TaskRequest> builder)
    {
        builder.ToTable("TaskRequests", IDoDatabaseSchema.Name);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Title).HasMaxLength(240).IsRequired();
        builder.Property(x => x.Message).HasMaxLength(1000);
        builder.Property(x => x.ResponseNote).HasMaxLength(1000);
        builder.HasOne(x => x.Project).WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Section).WithMany(x => x.SentRequests).HasForeignKey(x => x.SectionId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Task).WithMany(x => x.SentRequests).HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.SenderUser).WithMany().HasForeignKey(x => x.SenderUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ReceiverUser).WithMany().HasForeignKey(x => x.ReceiverUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.ReceiverUserId, x.Status });
        builder.HasIndex(x => new { x.SenderUserId, x.CreatedAtUtc });
        builder.HasIndex(x => new { x.ProjectId, x.Type, x.Status });
        builder.HasIndex(x => new { x.SectionId, x.ReceiverUserId, x.Type, x.Status });
        builder.HasIndex(x => new { x.TaskId, x.Status });
    }
}
