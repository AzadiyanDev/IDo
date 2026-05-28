using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IDo.Infrastructure.Persistence;

namespace IDo.Infrastructure.Identity.Configurations;

public sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("AspNetUsers", IDoDatabaseSchema.Name);
        builder.Property(x => x.UserName).HasMaxLength(256);
        builder.Property(x => x.NormalizedUserName).HasMaxLength(256);
        builder.Property(x => x.Email).HasMaxLength(320);
        builder.Property(x => x.NormalizedEmail).HasMaxLength(320);
        builder.HasIndex(x => x.NormalizedEmail);
        builder.HasOne(x => x.UserProfile)
            .WithOne()
            .HasForeignKey<ApplicationUser>(x => x.UserProfileId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
