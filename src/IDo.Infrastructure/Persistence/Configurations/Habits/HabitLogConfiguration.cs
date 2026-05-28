using IDo.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IDo.Infrastructure.Persistence.Configurations.Habits;

public sealed class HabitLogConfiguration : IEntityTypeConfiguration<HabitLog>
{
    public void Configure(EntityTypeBuilder<HabitLog> builder)
    {
        builder.ToTable("HabitLogs", IDoDatabaseSchema.Name);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Note).HasMaxLength(1000);
        builder.HasOne(x => x.Habit).WithMany(x => x.Logs).HasForeignKey(x => x.HabitId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.HabitId, x.Date }).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.Date });
    }
}
