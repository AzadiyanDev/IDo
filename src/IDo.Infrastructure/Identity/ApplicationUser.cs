using IDo.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace IDo.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public Guid? UserProfileId { get; set; }
    public User? UserProfile { get; set; }
}
