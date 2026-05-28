using IDo.Domain.Enums;

namespace IDo.Application.DTOs;

public sealed record AddProjectMemberRequest(Guid UserId, ProjectMemberRole Role);
