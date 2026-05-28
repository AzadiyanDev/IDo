# IDo

IDo is a mobile-first execution system for daily tasks, habits, projects, collaboration, task requests, progress, profile, settings, and notifications.

## Solution structure

- `src/IDo.Domain`: entities, enums, value objects, domain events, and domain exceptions. It has no project dependencies.
- `src/IDo.Application`: DTOs, use case contracts, repository interfaces, Unit of Work contract, validation, and mapping helpers. It depends only on Domain.
- `src/IDo.Services`: business service implementations and rule calculations for Today, habits, projects, task requests, permissions, progress, and notifications.
- `src/IDo.Infrastructure`: EF Core `IDoDbContext`, ASP.NET Core Identity persistence, per-entity configurations, per-entity repositories, Unit of Work implementation, SQL Server registration, and external integration placeholders.
- `src/IDo.Web`: ASP.NET Core .NET 10 API controllers, web DI, current user adapter, static hosting, and Angular `ClientApp`.
- `tests/IDo.UnitTests`: focused business rule and service-flow tests.
- `tests/IDo.IntegrationTests`: endpoint workflow skeletons.

## Run backend

```powershell
dotnet restore
dotnet run --project src/IDo.Web/IDo.Web.csproj
```

The API uses `ConnectionStrings:DefaultConnection` from `src/IDo.Web/appsettings.json`. The current local default is `(localdb)\AZADIYAN` with database `JahanAra`. ASP.NET Core Identity is registered in Infrastructure with `ApplicationUser`, `ApplicationRole`, `UserManager`, and `RoleManager`. Until real authentication endpoints are added, send `X-User-Id: {guid}` to API endpoints.

## Run Angular frontend

```powershell
cd src/IDo.Web/ClientApp
npm install
npm start
```

The Angular build outputs to `src/IDo.Web/wwwroot`:

```powershell
npm run build
```

## Add migration

```powershell
dotnet ef migrations add InitialCreate --project src/IDo.Infrastructure --startup-project src/IDo.Web --output-dir Persistence/Migrations
dotnet ef database update --project src/IDo.Infrastructure --startup-project src/IDo.Web
```

## Core business rules

- Today returns personal tasks due on the selected date, project tasks due or assigned, active habits for the selected date, pending task requests, and summary counts.
- Habit streaks increase only on completed active scheduled days. Rest days and out-of-schedule days are excluded from failures and success-rate denominators.
- Project progress is `Done countable tasks / all countable non-archived tasks * 100`.
- Project owners can manage all project areas. Members can act only within public sections or sections assigned to them.
- Task transfer does not change assignee until the receiver accepts the pending task request.
- Notifications are created through `INotificationService`.

## Important entities

`User`, `IDoTask`, `TaskComment`, `Habit`, `HabitScheduleDay`, `HabitLog`, `Project`, `ProjectMember`, `ProjectSection`, `TaskRequest`, and `Notification` are implemented with Guid primary keys and UTC timestamps. IDo database objects are created in the `IDo` schema to avoid collisions with existing `dbo` tables. Domain `User` records are persisted as `IDo.UserProfiles`; ASP.NET Core Identity users and roles are persisted through the standard Identity tables in the `IDo` schema. `IDoTask`, `Habit`, and `Project` use soft-delete query filters.
