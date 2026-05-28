using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Persistence;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Mappings;
using IDo.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[Route("api/projects")]
public sealed class ProjectsController(ICurrentUserService currentUser, IProjectService projectService, IUnitOfWork unitOfWork) : ApiControllerBase(currentUser)
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok((await unitOfWork.Projects.GetUserProjectsAsync(userId.Value, cancellationToken)).Select(x => x.ToDto()));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await projectService.GetProjectDetailsAsync(userId.Value, id, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateProjectRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await projectService.CreateProjectAsync(userId.Value, request, cancellationToken));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateProjectRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await projectService.UpdateProjectAsync(userId.Value, id, request, cancellationToken));
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        await projectService.ArchiveProjectAsync(userId.Value, id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/sections")]
    public async Task<IActionResult> AddSection(Guid id, CreateProjectSectionRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await projectService.AddSectionAsync(userId.Value, id, request, cancellationToken));
    }

    [HttpPut("{projectId:guid}/sections/{sectionId:guid}")]
    public async Task<IActionResult> UpdateSection(Guid projectId, Guid sectionId, CreateProjectSectionRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await projectService.UpdateSectionAsync(userId.Value, projectId, sectionId, request, cancellationToken));
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, AddProjectMemberRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        return Ok(await projectService.AddMemberAsync(userId.Value, id, request, cancellationToken));
    }

    [HttpDelete("{projectId:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid projectId, Guid memberId, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId.Result is not null) return userId.Result;
        await projectService.RemoveMemberAsync(userId.Value, projectId, memberId, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/progress")]
    public Task<ProjectProgressDto> Progress(Guid id, CancellationToken cancellationToken) => projectService.CalculateProjectProgressAsync(id, cancellationToken);
}
