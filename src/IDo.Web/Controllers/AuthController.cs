using System.Security.Claims;
using IDo.Application.Abstractions.Identity;
using IDo.Application.Abstractions.Services;
using IDo.Application.Common.Validation;
using IDo.Application.DTOs;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IDo.Web.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IUserManagementService users, ICurrentUserService currentUser) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await users.RegisterAsync(request, cancellationToken);
            await SignInAsync(result);
            return Created("/api/auth/me", result);
        }
        catch (RequestValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginUserRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await users.LoginAsync(request, cancellationToken);
            await SignInAsync(result);
            return Ok(result);
        }
        catch (RequestValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        if (currentUser.UserId is not { } userId) return Unauthorized();
        return Ok(await users.GetCurrentUserAsync(userId, cancellationToken));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    private Task SignInAsync(AuthUserDto user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(ClaimTypes.Name, user.UserName),
            new(ClaimTypes.Email, user.Email)
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var properties = new AuthenticationProperties
        {
            IsPersistent = true,
            AllowRefresh = true
        };

        return HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, properties);
    }
}
