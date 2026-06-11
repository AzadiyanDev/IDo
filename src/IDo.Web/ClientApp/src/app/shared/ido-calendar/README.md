# IDo Calendar

`IDo Calendar` is the reusable calendar layer extracted from the IDo task modal. It has a framework-neutral JavaScript core, a standalone stylesheet, and Angular wrappers in `../calendar`.

## Files

- `ido-calendar.js`: calendar engine, date conversion helpers, month grid builder, timeline builder, formatting, holidays, and navigation helpers.
- `ido-calendar.d.ts`: TypeScript declarations for app and library consumers.
- `ido-calendar.css`: themeable calendar UI styles.
- `../calendar/calendar-date-picker.ts`: Angular date picker wrapper used by the task and project modals.
- `../calendar/horizontal-date-strip.ts`: Angular horizontal date strip wrapper used by Today and Tasks.

## Features

- Gregorian and Jalali calendar modes.
- Persian and English labels.
- Gregorian ISO date keys: `YYYY-MM-DD` for API compatibility.
- Month grid generation with leading/trailing days.
- Direct month and year navigation through an in-calendar picker panel.
- Previous/next month and year helpers.
- Configurable week start.
- Optional holiday display with built-in Iranian fixed holidays and known year-specific holidays.
- Custom holiday injection through a list or provider callback.
- Optional Persian digits.
- Themeable CSS variables for accent, surface, border, text, error, radius, and density.

## Basic JavaScript Usage

```js
import { IDoCalendar } from './ido-calendar.js';
import './ido-calendar.css';

const calendar = new IDoCalendar({
  calendarType: 'Jalali',
  locale: 'fa',
  showHolidays: true,
  weekStartDay: 'Saturday'
});

const selectedDate = '2026-06-08';
const monthView = calendar.buildMonthView(selectedDate, selectedDate);

console.log(monthView.title);
console.log(monthView.weekdays);
console.log(monthView.days);
```

## Angular Usage

```html
<app-calendar-date-picker
  [selectedDate]="dueDate()"
  [accent]="selectedSectionColor()"
  [options]="{
    showMonthSelector: true,
    showYearSelector: true,
    showTodayButton: true,
    showHolidays: true,
    yearRange: 121,
    yearPageSize: 12,
    density: 'comfortable'
  }"
  (selectedDateChange)="setDueDate($event)" />
```

The current app uses the wrapper without custom options:

```html
<app-calendar-date-picker
  [selectedDate]="dueDate()"
  (selectedDateChange)="setDueDate($event)" />
```

## Engine Options

```ts
interface CalendarOptions {
  calendarType?: 'Gregorian' | 'Jalali';
  locale?: 'en' | 'fa' | 'fa-IR' | 'Persian';
  weekStartDay?: 'Sunday' | 'Monday' | 'Saturday' | 0 | 1 | 6;
  showAdjacentMonths?: boolean;
  fixedWeekCount?: boolean;
  showHolidays?: boolean;
  usePersianDigits?: boolean;
  holidays?: { key: string; title: string }[];
  holidayProvider?: (
    key: string,
    context: { date: Date; parts: { year: number; month: number; day: number } }
  ) => string | string[] | null | undefined;
}
```

## Date Picker Options

```ts
interface CalendarDatePickerOptions {
  showMonthSelector?: boolean;
  showYearSelector?: boolean;
  showCalendarLabel?: boolean;
  showTodayButton?: boolean;
  showAdjacentDays?: boolean;
  showHolidays?: boolean;
  fixedWeekCount?: boolean;
  yearRange?: number;
  yearPageSize?: number;
  density?: 'comfortable' | 'compact';
}
```

`showMonthSelector` and `showYearSelector` enable the period picker panel in the Angular wrapper. The header shows the active month/year; clicking it opens a month grid and a paged year grid instead of relying on native browser dropdowns.

## Navigation API

```js
calendar.addCalendarMonths('2026-06-08', 1);
calendar.addCalendarYears('2026-06-08', -1);
calendar.setCalendarMonth('2026-06-08', 12);
calendar.setCalendarYear('2026-06-08', 1405);
calendar.keyFromCalendarParts(1405, 3, 1);
```

In Jalali mode, `setCalendarYear` and `keyFromCalendarParts` read the year and month as Jalali parts. In Gregorian mode, they read them as Gregorian parts. The returned value is always a Gregorian `YYYY-MM-DD` key.

## Styling

Import `ido-calendar.css` globally and set variables on the root calendar element:

```html
<section
  class="ido-calendar"
  style="
    --ido-calendar-accent: #00e6f6;
    --ido-calendar-radius: 22px;
  ">
</section>
```

Supported variables:

- `--ido-calendar-accent`
- `--ido-calendar-surface`
- `--ido-calendar-raised`
- `--ido-calendar-border`
- `--ido-calendar-text`
- `--ido-calendar-muted`
- `--ido-calendar-error`
- `--ido-calendar-bg`
- `--ido-calendar-radius`

## Custom Holidays

```js
const calendar = new IDoCalendar({
  calendarType: 'Jalali',
  locale: 'fa',
  holidays: [
    { key: '1405-02-10', title: 'Release day' },
    { key: '02-15', title: 'Company event' }
  ],
  holidayProvider: (key) => key === '2026-06-08' ? 'Special day' : null
});
```

Holiday keys in `holidays` can be full Jalali keys (`YYYY-MM-DD`) or recurring Jalali month/day keys (`MM-DD`). The `holidayProvider` receives the Gregorian key currently being rendered.

## Notes For Extraction

The library is currently stored inside the Angular app so the existing product can consume it directly. To publish it as a package later:

1. Move this folder to a package root such as `packages/ido-calendar`.
2. Keep `ido-calendar.js`, `ido-calendar.d.ts`, and `ido-calendar.css` as package entry files.
3. Add a `package.json` with `exports` for the JavaScript and CSS files.
4. Keep Angular wrappers in the application or publish them as a separate adapter package.
