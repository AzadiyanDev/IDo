using IDo.Domain.Entities;
using IDo.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IDo.Infrastructure.Persistence.Configurations.Projects;

public sealed class ProjectSectionConfiguration : IEntityTypeConfiguration<ProjectSection>
{
    public void Configure(EntityTypeBuilder<ProjectSection> builder)
    {
        builder.ToTable("ProjectSections", IDoDatabaseSchema.Name);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(240).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2000);
        builder.Property(x => x.Color).HasMaxLength(32);
        builder.Property(x => x.Icon).HasMaxLength(64);
        builder.Property(x => x.Visibility).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.AssignmentStatus).HasConversion<string>().HasMaxLength(32).HasDefaultValue(ProjectSectionAssignmentStatus.None);
        builder.HasOne(x => x.Project).WithMany(x => x.Sections).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.AssignedUser).WithMany().HasForeignKey(x => x.AssignedUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.PendingAssignedUser).WithMany().HasForeignKey(x => x.PendingAssignedUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.ProjectId, x.Order });
        builder.HasIndex(x => new { x.ProjectId, x.AssignedUserId });
        builder.HasIndex(x => new { x.ProjectId, x.PendingAssignedUserId });
    }
}
