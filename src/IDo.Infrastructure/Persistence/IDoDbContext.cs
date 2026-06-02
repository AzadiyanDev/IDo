using IDo.Application.Abstractions.DateTime;
using IDo.Domain.Common;
using IDo.Domain.Entities;
using IDo.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace IDo.Infrastructure.Persistence;

public sealed class IDoDbContext(DbContextOptions<IDoDbContext> options, IDateTimeProvider dateTimeProvider)
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>(options)
{
    public DbSet<User> UserProfiles => Set<User>();
    public DbSet<IDoTask> Tasks => Set<IDoTask>();
    public DbSet<TaskComment> TaskComments => Set<TaskComment>();
    public DbSet<Habit> Habits => Set<Habit>();
    public DbSet<HabitScheduleDay> HabitScheduleDays => Set<HabitScheduleDay>();
    public DbSet<HabitLog> HabitLogs => Set<HabitLog>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<ProjectSection> ProjectSections => Set<ProjectSection>();
    public DbSet<TaskRequest> TaskRequests => Set<TaskRequest>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema(IDoDatabaseSchema.Name);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(IDoDbContext).Assembly);
        modelBuilder.Entity<IDoTask>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<TaskComment>().HasQueryFilter(x => !x.Task.IsDeleted && !x.IsDeleted);
        modelBuilder.Entity<TaskRequest>().HasQueryFilter(x => x.Task == null || !x.Task.IsDeleted);
        modelBuilder.Entity<Habit>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<HabitLog>().HasQueryFilter(x => !x.Habit.IsDeleted);
        modelBuilder.Entity<HabitScheduleDay>().HasQueryFilter(x => !x.Habit.IsDeleted);
        modelBuilder.Entity<Project>().HasQueryFilter(x => !x.IsDeleted);
        modelBuilder.Entity<ProjectMember>().HasQueryFilter(x => !x.Project.IsDeleted);
        modelBuilder.Entity<ProjectSection>().HasQueryFilter(x => !x.Project.IsDeleted);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = dateTimeProvider.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CreatedAtUtc == default)
            {
                entry.Entity.CreatedAtUtc = now;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = now;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
