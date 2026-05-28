using IDo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IDo.Infrastructure.Persistence.Configurations.Habits;

public sealed class HabitScheduleDayConfiguration : IEntityTypeConfiguration<HabitScheduleDay>
{
    public void Configure(EntityTypeBuilder<HabitScheduleDay> builder)
    {
        builder.ToTable("HabitScheduleDays", IDoDatabaseSchema.Name);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DayOfWeek).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.DayType).HasConversion<string>().HasMaxLength(32);
        builder.HasOne(x => x.Habit).WithMany(x => x.ScheduleDays).HasForeignKey(x => x.HabitId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.HabitId, x.DayOfWeek }).IsUnique();
    }
}
