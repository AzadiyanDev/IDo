using IDo.Application;
using IDo.Infrastructure.DependencyInjection;
using IDo.Services;
using IDo.Web.DependencyInjection;
using IDo.Web.Hubs;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.StaticFiles;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddApplication()
    .AddServices()
    .AddInfrastructure(builder.Configuration)
    .AddWeb();

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "IDo.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.LoginPath = "/login";
        options.LogoutPath = "/logout";
        options.Events.OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            }

            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };
    });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddAuthorization();
builder.Services.AddSignalR();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
var webRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var angularBrowserRoot = Path.Combine(webRoot, "browser");
var staticContentTypes = new FileExtensionContentTypeProvider();
staticContentTypes.Mappings[".webmanifest"] = "application/manifest+json";
if (Directory.Exists(angularBrowserRoot))
{
    var angularFiles = new PhysicalFileProvider(angularBrowserRoot);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = angularFiles });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = angularFiles, ContentTypeProvider = staticContentTypes });
}
else
{
    app.UseDefaultFiles();
}
app.UseStaticFiles(new StaticFileOptions { ContentTypeProvider = staticContentTypes });
app.UseAuthentication();
app.UseAuthorization();
app.MapHub<TaskHub>("/hubs/tasks");
app.MapControllers();
app.MapFallbackToFile(Directory.Exists(angularBrowserRoot) ? "browser/index.html" : "index.html");

app.Run();

public partial class Program;
