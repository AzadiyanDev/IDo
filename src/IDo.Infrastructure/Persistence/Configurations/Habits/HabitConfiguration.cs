using IDo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IDo.Infrastructure.Persistence.Configurations.Habits;

public sealed class HabitConfiguration : IEntityTypeConfiguration<Habit>
{
    public void Configure(EntityTypeBuilder<Habit> builder)
    {
        builder.ToTable("Habits", IDoDatabaseSchema.Name);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(240).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(4000);
        builder.Property(x => x.Color).HasMaxLength(32);
        builder.Property(x => x.Icon).HasMaxLength(64);
        builder.Property(x => x.ScheduleType).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.Property(x => x.IsDeleted).HasDefaultValue(false);
        builder.HasOne(x => x.User).WithMany(x => x.Habits).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.UserId, x.IsActive });
    }
}
