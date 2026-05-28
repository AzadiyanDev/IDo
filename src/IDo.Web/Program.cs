using IDo.Application;
using IDo.Infrastructure.DependencyInjection;
using IDo.Services;
using IDo.Web.DependencyInjection;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddApplication()
    .AddServices()
    .AddInfrastructure(builder.Configuration)
    .AddWeb();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
var webRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var angularBrowserRoot = Path.Combine(webRoot, "browser");
if (Directory.Exists(angularBrowserRoot))
{
    var angularFiles = new PhysicalFileProvider(angularBrowserRoot);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = angularFiles });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = angularFiles });
}
else
{
    app.UseDefaultFiles();
}
app.UseStaticFiles();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile(Directory.Exists(angularBrowserRoot) ? "browser/index.html" : "index.html");

app.Run();

public partial class Program;
