# IDo

IDo یک سیستم mobile-first برای مدیریت اجرای روزانه است؛ جایی که تسک‌های شخصی، عادت‌ها، پروژه‌های تیمی، درخواست‌های همکاری، گزارش‌های تحلیلی و تنظیمات کاربر در یک تجربه منسجم جمع می‌شوند. هدف پروژه فقط ساخت یک todo list نیست؛ IDo برای پیگیری اجرای واقعی، تشخیص ریسک‌های روز، و تبدیل داده‌های کاربر به گزارش قابل تصمیم‌گیری طراحی شده است.

## نمای کلی

- **Frontend:** Angular 21، TypeScript، Tailwind CSS و طراحی mobile-first
- **Backend:** ASP.NET Core .NET 10، REST API، Cookie Authentication و SignalR
- **Persistence:** EF Core، SQL Server / LocalDB، ASP.NET Core Identity
- **Architecture:** Domain-driven layers با جداسازی Domain، Application، Services، Infrastructure و Web
- **Testing:** Unit tests برای قوانین کسب‌وکار و Integration skeleton برای workflowهای API

## اسکرین‌شات‌ها

<p align="center">
  <img src="docs/screenshots/today-dashboard.png" width="260" alt="IDo Today dashboard" />
  <img src="docs/screenshots/progress-report.png" width="260" alt="IDo progress report" />
  <img src="docs/screenshots/projects-portfolio.png" width="260" alt="IDo projects portfolio" />
</p>

<p align="center">
  <img src="docs/screenshots/progress-insights.png" width="260" alt="IDo executive progress insights" />
  <img src="docs/screenshots/progress-action-plan.png" width="260" alt="IDo action plan analytics" />
  <img src="docs/screenshots/profile-settings.png" width="260" alt="IDo profile settings" />
</p>

<p align="center">
  <img src="docs/screenshots/habits-board.png" width="260" alt="IDo habits board" />
</p>

## قابلیت‌های اصلی

### Today dashboard

صفحه امروز، مرکز اجرای روزانه کاربر است. این صفحه تسک‌های امروز، عادت‌های فعال، پروژه‌های فعال، درخواست‌های در انتظار و درصد پیشرفت روز را در یک نمای فشرده نمایش می‌دهد.

- نمایش تسک‌های شخصی و پروژه‌ای برای روز انتخاب‌شده
- نمایش عادت‌های قابل انجام همان روز
- خلاصه تعداد کل، انجام‌شده، عقب‌افتاده و درخواست‌های معلق
- ناوبری تاریخ با پشتیبانی از تقویم میلادی و شمسی
- دسترسی سریع به جزئیات تسک و پروژه

### Tasks

تسک‌ها در IDo می‌توانند شخصی یا وابسته به پروژه باشند. هر تسک می‌تواند وضعیت، اولویت، موعد، یادآور، توضیح، آیکن، رنگ و قابلیت شمارش در پیشرفت داشته باشد.

- وضعیت‌های Todo، InProgress، Review، Done، Overdue و Archived
- تکمیل، آرشیو، حذف و تغییر وضعیت
- کامنت روی تسک‌ها
- تسک‌های قابل شمارش برای محاسبه پیشرفت
- پشتیبانی از assignment و درخواست واگذاری

### Habits

عادت‌ها برای ساخت روتین‌های تکرارشونده طراحی شده‌اند. منطق موفقیت عادت‌ها فقط روزهای فعال را حساب می‌کند و rest day را به‌عنوان شکست در نظر نمی‌گیرد.

- عادت با روزهای فعال مشخص یا تعداد دفعات در هفته
- ثبت completion برای تاریخ انتخاب‌شده
- current streak و best streak
- نرخ موفقیت ماهانه
- گزارش پایداری عادت‌ها در صفحه گزارش‌ها

### Projects

پروژه‌ها برای کارهای چندبخشی و همکاری ساخته شده‌اند. هر پروژه بخش، عضو، سطح دسترسی، تسک و گزارش پیشرفت مستقل دارد.

- ساخت پروژه با رنگ و آیکن اختصاصی
- بخش‌بندی پروژه
- عضوگیری و دعوت کاربران
- واگذاری بخش یا تسک از طریق inbox approval
- محاسبه پیشرفت پروژه بر اساس تسک‌های قابل شمارش غیرآرشیوی

### Inbox و همکاری

درخواست‌های همکاری در inbox مدیریت می‌شوند. عضویت در پروژه یا واگذاری تسک/بخش تا زمانی که گیرنده تایید نکند نهایی نمی‌شود.

- Project Invitation
- Section Assignment
- Task Assignment
- Accept / Reject با interaction محافظت‌شده
- اعلان و شمارنده درخواست‌های معلق

### گزارش‌ها و تحلیل

صفحه Progress به یک گزارش تحلیلی کامل تبدیل شده است؛ فقط درصد پیشرفت نشان نمی‌دهد، بلکه وضعیت اجرا را تحلیل می‌کند و اقدام بعدی پیشنهاد می‌دهد.

- امتیاز کلی گزارش با وزن‌دهی به اجرای روز، تسک‌ها، ثبات هفته، عادت‌ها و پروژه‌ها
- جریمه برای کارهای عقب‌افتاده و درخواست‌های معلق
- Executive report با grade و توضیح وضعیت
- Health matrix برای کیفیت اجرای روزانه، ریتم هفتگی، پایداری عادت و تحویل پروژه
- Forecast برای پیش‌بینی رسیدن روز به محدوده ۸۰٪
- Action plan با اولویت High / Medium / Low
- Work mix، weekly trend، process flow، habit reliability، project delivery و recovery queue

### Profile و Settings

پروفایل شامل اطلاعات کاربر، عکس پروفایل و تنظیمات اصلی است. تنظیمات اضافه حذف شده‌اند و صفحه فقط گزینه‌های کاربردی را نگه می‌دارد.

- ویرایش نام، username، ایمیل و تلفن
- آپلود avatar
- فعال/غیرفعال کردن اعلان‌ها
- تغییر زبان
- تغییر نوع تقویم بین Gregorian و Jalali

## معماری پروژه

```text
src/
  IDo.Domain/          Entities, enums, value objects, domain events
  IDo.Application/     DTOs, service contracts, repository interfaces, validation
  IDo.Services/        Business services and domain rule orchestration
  IDo.Infrastructure/  EF Core DbContext, Identity, repositories, migrations
  IDo.Web/             ASP.NET Core API, SignalR hub, Angular ClientApp
tests/
  IDo.UnitTests/
  IDo.IntegrationTests/
docs/
  screenshots/
```

### لایه Domain

لایه Domain مستقل است و وابستگی پروژه‌ای ندارد. موجودیت‌های اصلی شامل `User`، `IDoTask`، `Habit`، `HabitLog`، `Project`، `ProjectSection`، `ProjectMember`، `TaskRequest` و `Notification` هستند.

### لایه Application

این لایه قراردادها، DTOها، validation و mapping helperها را نگه می‌دارد. سرویس‌ها و Infrastructure از این قراردادها استفاده می‌کنند تا وابستگی مستقیم UI یا دیتابیس وارد Domain نشود.

### لایه Services

قوانین اجرایی پروژه اینجا پیاده‌سازی می‌شوند:

- ساخت و تکمیل تسک
- محاسبه dashboard امروز
- ساخت و تکمیل عادت
- محاسبه streak و success rate
- مدیریت پروژه، بخش، عضو و permission
- مدیریت task request
- تولید progress analytics

### لایه Infrastructure

این لایه مسئول دیتابیس و Identity است:

- `IDoDbContext`
- Entity configurations
- EF repositories
- Unit of Work
- ASP.NET Core Identity user/role
- Migrations

### لایه Web

این لایه API، auth، SignalR و Angular را میزبانی می‌کند:

- REST controllers
- Cookie authentication
- `/hubs/tasks` برای realtime task events
- static hosting خروجی Angular در `wwwroot/browser`

## قوانین کسب‌وکار مهم

- Today فقط آیتم‌های مرتبط با تاریخ انتخاب‌شده را نشان می‌دهد.
- Habit streak فقط روی روزهای فعال برنامه‌ریزی‌شده محاسبه می‌شود.
- Rest day و out-of-schedule day شکست محسوب نمی‌شوند.
- Project progress برابر است با:

```text
Done countable tasks / All non-archived countable tasks * 100
```

- مالک پروژه می‌تواند کل پروژه، اعضا، بخش‌ها و تسک‌ها را مدیریت کند.
- اعضا فقط در بخش‌های عمومی یا بخش‌های assign شده دسترسی عملیاتی دارند.
- واگذاری تسک یا بخش تا قبل از تایید گیرنده، assignment نهایی را تغییر نمی‌دهد.
- تسک‌های آرشیوشده از محاسبات پیشرفت حذف می‌شوند.

## راه‌اندازی

### پیش‌نیازها

- .NET SDK 10
- Node.js و npm
- SQL Server LocalDB یا SQL Server
- EF Core tools برای migrationها

### اجرای Backend

```powershell
dotnet restore
dotnet run --project src/IDo.Web/IDo.Web.csproj --launch-profile http
```

API به صورت پیش‌فرض روی این آدرس بالا می‌آید:

```text
http://localhost:5115
```

### اجرای Frontend در حالت توسعه

```powershell
cd src/IDo.Web/ClientApp
npm install
npm start
```

Angular dev server به صورت پیش‌فرض روی این آدرس است:

```text
http://localhost:4200
```

### ساخت نسخه production فرانت

```powershell
cd src/IDo.Web/ClientApp
npm run build
```

خروجی build در مسیر زیر قرار می‌گیرد و توسط ASP.NET Core سرو می‌شود:

```text
src/IDo.Web/wwwroot/browser
```

## دیتابیس و Migration

Connection string در `src/IDo.Web/appsettings.Development.json` تعریف می‌شود. مقدار local فعلی:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\AZADIYAN;Database=JahanAra;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  }
}
```

ساخت migration:

```powershell
dotnet ef migrations add MigrationName --project src/IDo.Infrastructure --startup-project src/IDo.Web --output-dir Persistence/Migrations
```

اعمال migration:

```powershell
dotnet ef database update --project src/IDo.Infrastructure --startup-project src/IDo.Web
```

## تست و اعتبارسنجی

اجرای تست‌های .NET:

```powershell
dotnet test
```

اجرای build فرانت:

```powershell
cd src/IDo.Web/ClientApp
npm run build
```

اجرای lint فرانت:

```powershell
cd src/IDo.Web/ClientApp
npm run lint
```

## APIهای اصلی

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Today

- `GET /api/today?date=YYYY-MM-DD`

### Tasks

- `GET /api/tasks/{id}`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `POST /api/tasks/{id}/complete`
- `POST /api/tasks/{id}/status`
- `POST /api/tasks/{id}/archive`
- `DELETE /api/tasks/{id}`
- `GET /api/tasks/overdue`
- `GET /api/tasks/assigned`
- `POST /api/tasks/{id}/comments`
- `GET /api/tasks/{id}/comments`
- `POST /api/tasks/{id}/assign`

### Habits

- `GET /api/habits`
- `GET /api/habits/today`
- `POST /api/habits`
- `PUT /api/habits/{id}`
- `DELETE /api/habits/{id}`
- `POST /api/habits/{id}/complete`
- `GET /api/habits/{id}/progress`

### Projects

- `GET /api/projects`
- `GET /api/projects/{id}`
- `POST /api/projects`
- `PUT /api/projects/{id}`
- `POST /api/projects/{id}/archive`
- `POST /api/projects/{id}/sections`
- `PUT /api/projects/{projectId}/sections/{sectionId}`
- `POST /api/projects/{projectId}/sections/{sectionId}/assign`
- `GET /api/projects/{id}/users`
- `POST /api/projects/{id}/invite`
- `POST /api/projects/{id}/members`
- `DELETE /api/projects/{projectId}/members/{memberId}`
- `GET /api/projects/{id}/progress`

### Progress

- `GET /api/progress/today`
- `GET /api/progress/weekly`
- `GET /api/progress/habits`
- `GET /api/progress/projects`

## نکات UI و تجربه کاربری

- طراحی برای موبایل و استفاده روزانه بهینه شده است.
- رنگ‌ها و آیکن‌ها برای تشخیص سریع نوع آیتم استفاده می‌شوند.
- navigation پایین صفحه برای دسترسی سریع به Today، Habits، Projects و Progress است.
- صفحه‌های detail مثل project، task، inbox و profile بدون bottom nav نمایش داده می‌شوند تا تمرکز کاربر حفظ شود.
- تقویم از Gregorian و Jalali پشتیبانی می‌کند.
- فونت Peyda برای زبان فارسی و Inter برای انگلیسی استفاده می‌شود.

## وضعیت فعلی توسعه

- احراز هویت cookie-based فعال است.
- ثبت‌نام، ورود، خروج و پروفایل کار می‌کنند.
- مدیریت تسک، عادت، پروژه و درخواست‌های همکاری پیاده‌سازی شده است.
- صفحه گزارش‌ها تحلیل کامل‌تری از وضعیت اجرا ارائه می‌دهد.
- README همراه با اسکرین‌شات‌های واقعی پروژه آماده GitHub است.

## مسیرهای پیشنهادی آینده

- اضافه کردن تست‌های integration واقعی برای workflow کامل auth و task
- افزودن export گزارش‌ها
- اضافه کردن notification publisher واقعی
- تکمیل realtime UX با SignalR برای تغییرات تسک و درخواست‌ها
- اضافه کردن dashboard دسکتاپ در کنار تجربه mobile-first
