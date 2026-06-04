using IDo.Domain.Entities;
using IDo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IDo.Infrastructure.Persistence.Configurations.Users;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("UserProfiles", IDoDatabaseSchema.Name);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FullName).HasMaxLength(160).IsRequired();
        builder.Property(x => x.AvatarUrl).HasMaxLength(1000);
        builder.Property(x => x.Email).HasMaxLength(320);
        builder.Property(x => x.PhoneNumber).HasMaxLength(32);
        builder.Property(x => x.PasswordHash).HasMaxLength(512);
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.OwnsOne(x => x.Settings, settings =>
        {
            settings.Property(x => x.NotificationsEnabled).HasDefaultValue(true);
            settings.Property(x => x.Language).HasMaxLength(12).IsRequired();
            settings.Property(x => x.Theme).HasMaxLength(32).IsRequired();
            settings.Property(x => x.WeekStartDay).HasConversion<string>().HasMaxLength(16);
            settings.Property(x => x.CalendarType).HasConversion<string>().HasMaxLength(16).HasDefaultValue(CalendarType.Gregorian);
        });
        builder.HasIndex(x => x.Email);
        builder.HasIndex(x => x.PhoneNumber);
    }
}
