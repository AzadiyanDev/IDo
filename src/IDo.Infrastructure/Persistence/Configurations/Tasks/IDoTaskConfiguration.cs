using IDo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IDo.Infrastructure.Persistence.Configurations.Tasks;

public sealed class IDoTaskConfiguration : IEntityTypeConfiguration<IDoTask>
{
    public void Configure(EntityTypeBuilder<IDoTask> builder)
    {
        builder.ToTable("Tasks", IDoDatabaseSchema.Name);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(240).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(4000);
        builder.Property(x => x.Color).HasMaxLength(32);
        builder.Property(x => x.Icon).HasMaxLength(64);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.IsCountableInProgress).HasDefaultValue(true);
        builder.Property(x => x.IsDeleted).HasDefaultValue(false);
        builder.HasOne(x => x.CreatorUser).WithMany(x => x.Tasks).HasForeignKey(x => x.CreatorUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.AssigneeUser).WithMany().HasForeignKey(x => x.AssigneeUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Project).WithMany(x => x.Tasks).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Section).WithMany(x => x.Tasks).HasForeignKey(x => x.SectionId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Habit).WithMany(x => x.GeneratedTasks).HasForeignKey(x => x.HabitId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.CreatorUserId, x.DueDate });
        builder.HasIndex(x => new { x.AssigneeUserId, x.Status });
        builder.HasIndex(x => new { x.ProjectId, x.SectionId });
    }
}
