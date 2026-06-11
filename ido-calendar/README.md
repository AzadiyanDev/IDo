# IDo Calendar

A standalone Gregorian/Jalali calendar date picker. It has no Angular, React, Tailwind, or IDo app dependency. Give it an empty element and it renders the full calendar UI inside it.

## What You Get

- Vanilla JavaScript date picker renderer.
- Gregorian and Jalali calendar modes.
- Persian and English labels.
- Month and year picker panel.
- Previous/next month navigation.
- Paged year selection.
- Optional Today button.
- Optional adjacent-month days.
- Optional holidays with built-in Iranian fixed holidays and known 1404-1406 holidays.
- Custom holidays and custom holiday provider.
- Themeable CSS variables.
- TypeScript declarations.
- Browser global and ESM usage.

## Folder Structure

```text
ido-calendar/
  src/
    ido-calendar.js
    ido-calendar.css
    ido-calendar.d.ts
  demo/
    index.html
  scripts/
    smoke-test.mjs
  package.json
  README.md
  LICENSE
```

## Quick Start

Add an empty div:

```html
<div id="calendar"></div>
```

Import the CSS and mount the calendar:

```html
<link rel="stylesheet" href="./src/ido-calendar.css">

<script type="module">
  import { mountIDoCalendar } from './src/ido-calendar.js';

  const calendar = mountIDoCalendar('calendar', {
    calendarType: 'Jalali',
    locale: 'fa',
    selectedDate: '2026-06-08',
    accent: '#00e6f6',
    onChange: ({ date, parts }) => {
      console.log(date, parts);
    }
  });
</script>
```

The selected value is always returned as a Gregorian API-safe key: `YYYY-MM-DD`.

## Browser Global Usage

Because the module also registers itself on `window.IDoCalendar`, you can load it and mount from the global:

```html
<link rel="stylesheet" href="./src/ido-calendar.css">
<div id="calendar"></div>

<script type="module" src="./src/ido-calendar.js"></script>
<script type="module">
  window.IDoCalendar.mount('calendar', {
    calendarType: 'Gregorian',
    locale: 'en'
  });
</script>
```

## NPM Usage

```bash
npm install ido-calendar
```

```js
import { mountIDoCalendar } from 'ido-calendar';
import 'ido-calendar/style.css';

mountIDoCalendar('calendar', {
  calendarType: 'Jalali',
  locale: 'fa'
});
```

## Options

```ts
interface CalendarPickerOptions {
  selectedDate?: string | null;
  calendarType?: 'Gregorian' | 'Jalali';
  locale?: 'en' | 'fa' | 'fa-IR' | 'Persian';
  weekStartDay?: 'Sunday' | 'Monday' | 'Saturday' | 0 | 1 | 6;
  showCalendarLabel?: boolean;
  showTodayButton?: boolean;
  showMonthSelector?: boolean;
  showYearSelector?: boolean;
  showAdjacentDays?: boolean;
  fixedWeekCount?: boolean;
  showHolidays?: boolean;
  usePersianDigits?: boolean;
  yearRange?: number;
  yearPageSize?: number;
  density?: 'comfortable' | 'compact';
  accent?: string;
  dir?: 'ltr' | 'rtl';
  labels?: {
    month?: string;
    year?: string;
    today?: string;
    previousMonth?: string;
    nextMonth?: string;
    previousYear?: string;
    nextYear?: string;
  };
  holidays?: { key: string; title: string }[];
  holidayProvider?: (
    key: string,
    context: { date: Date; parts: { year: number; month: number; day: number } }
  ) => string | string[] | null | undefined;
  onChange?: (detail: CalendarPickerChangeDetail) => void;
  onViewChange?: (detail: CalendarPickerViewChangeDetail) => void;
}
```

## Events

You can use callbacks:

```js
mountIDoCalendar('calendar', {
  onChange: ({ date, dateObject, parts, calendarType }) => {
    console.log(date, dateObject, parts, calendarType);
  },
  onViewChange: ({ viewDate, parts }) => {
    console.log(viewDate, parts);
  }
});
```

Or DOM events:

```js
document.getElementById('calendar').addEventListener('ido-calendar:change', event => {
  console.log(event.detail.date);
});
```

## API

```js
const picker = mountIDoCalendar('calendar', options);

picker.setDate('2026-06-08');
picker.setViewDate('2026-07-01');
picker.setOptions({ calendarType: 'Jalali', locale: 'fa' });
picker.render();
picker.destroy();
```

The lower-level calendar engine is also exported:

```js
import { IDoCalendar } from './src/ido-calendar.js';

const engine = new IDoCalendar({ calendarType: 'Jalali', locale: 'fa' });
const month = engine.buildMonthView('2026-06-08', '2026-06-08');
```

## Styling

The CSS is standalone and works without IDo theme variables. Override variables on the target area or on `.ido-calendar`:

```css
#calendar {
  --ido-calendar-accent: #00f4b9;
  --ido-calendar-surface: #080b10;
  --ido-calendar-raised: #171d26;
  --ido-calendar-border: #2a3341;
  --ido-calendar-text: #f2f5f8;
  --ido-calendar-muted: #8e9bae;
  --ido-calendar-error: #ffb4ab;
  --ido-calendar-bg: #0b0e14;
  --ido-calendar-radius: 22px;
}
```

## Custom Holidays

```js
mountIDoCalendar('calendar', {
  calendarType: 'Jalali',
  locale: 'fa',
  holidays: [
    { key: '1405-02-10', title: 'Release day' },
    { key: '02-15', title: 'Company event' }
  ],
  holidayProvider: (key) => key === '2026-06-08' ? 'Special day' : null
});
```

Holiday keys in `holidays` can be full Jalali keys (`YYYY-MM-DD`) or recurring Jalali month/day keys (`MM-DD`). `holidayProvider` receives the Gregorian date key being rendered.

## Run The Demo

Open `demo/index.html` through any static server. For example:

```bash
cd ido-calendar
npx serve .
```

Then open:

```text
http://localhost:3000/demo/
```

## Smoke Test

```bash
npm run smoke
```
