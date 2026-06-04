import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

export type CalendarType = 'Gregorian' | 'Jalali';

export interface CalendarDayCell {
  key: string;
  weekday: string;
  dayOfMonth: string;
  month: string;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isHoliday: boolean;
  holidayTitle: string | null;
}

export interface CalendarMonthView {
  title: string;
  weekdays: string[];
  days: CalendarDayCell[];
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly auth = inject(AuthService);
  private readonly language = computed<'en' | 'fa'>(() => this.auth.currentUser()?.profile.settings.language === 'fa' ? 'fa' : 'en');
  private readonly persianPartsFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  private readonly gregorianLongFormatter = new Intl.DateTimeFormat('en-US-u-ca-gregory', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  private readonly gregorianLongFormatterFa = new Intl.DateTimeFormat('fa-IR-u-ca-gregory', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  private readonly gregorianShortFormatter = new Intl.DateTimeFormat('en-US-u-ca-gregory', {
    month: 'short',
    day: 'numeric'
  });
  private readonly gregorianShortFormatterFa = new Intl.DateTimeFormat('fa-IR-u-ca-gregory', {
    month: 'short',
    day: 'numeric'
  });
  private readonly timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  private readonly timeFormatterFa = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  private readonly persianNumberFormatter = new Intl.NumberFormat('fa-IR', { useGrouping: false });
  private readonly jalaliDateCache = new Map<string, string>();

  private readonly persianMonths = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند'
  ];
  private readonly gregorianMonthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  private readonly gregorianMonthsLong = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  private readonly gregorianMonthsShortFa = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
  private readonly gregorianMonthsLongFa = this.gregorianMonthsShortFa;
  private readonly persianWeekdaysShort = ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'];
  private readonly persianWeekdaysNarrow = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
  private readonly gregorianWeekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  private readonly gregorianWeekdaysNarrow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  private readonly fixedJalaliHolidays = new Map<string, string[]>([
    ['01-01', ['نوروز']],
    ['01-02', ['نوروز']],
    ['01-03', ['نوروز']],
    ['01-04', ['نوروز']],
    ['01-12', ['روز جمهوری اسلامی']],
    ['01-13', ['روز طبیعت']],
    ['03-14', ['رحلت امام خمینی']],
    ['03-15', ['قیام ۱۵ خرداد']],
    ['11-22', ['پیروزی انقلاب اسلامی']],
    ['12-29', ['روز ملی شدن صنعت نفت']]
  ]);

  private readonly specificJalaliHolidays = new Map<string, string[]>([
    ['1404-01-02', ['شهادت امام علی']],
    ['1404-01-11', ['عید فطر']],
    ['1404-01-12', ['تعطیل عید فطر']],
    ['1404-02-04', ['شهادت امام جعفر صادق']],
    ['1404-03-16', ['عید قربان']],
    ['1404-03-24', ['عید غدیر خم']],
    ['1404-04-14', ['تاسوعا']],
    ['1404-04-15', ['عاشورا']],
    ['1404-05-23', ['اربعین حسینی']],
    ['1404-05-31', ['رحلت پیامبر و شهادت امام حسن']],
    ['1404-06-10', ['شهادت امام حسن عسکری']],
    ['1404-06-19', ['ولادت پیامبر و امام جعفر صادق']],
    ['1404-09-03', ['شهادت حضرت فاطمه']],
    ['1404-10-13', ['ولادت امام علی']],
    ['1404-10-27', ['مبعث پیامبر']],
    ['1404-11-15', ['ولادت امام مهدی']],
    ['1404-12-20', ['شهادت امام علی']],
    ['1405-01-01', ['عید فطر']],
    ['1405-01-02', ['تعطیل عید فطر']],
    ['1405-01-25', ['شهادت امام جعفر صادق']],
    ['1405-03-06', ['عید قربان']],
    ['1405-03-14', ['عید غدیر خم']],
    ['1405-04-03', ['تاسوعا']],
    ['1405-04-04', ['عاشورا']],
    ['1405-05-13', ['اربعین حسینی']],
    ['1405-05-21', ['رحلت پیامبر و شهادت امام حسن']],
    ['1405-05-30', ['شهادت امام حسن عسکری']],
    ['1405-06-08', ['ولادت پیامبر و امام جعفر صادق']],
    ['1405-08-22', ['شهادت حضرت فاطمه']],
    ['1405-10-01', ['ولادت امام علی']],
    ['1405-10-15', ['مبعث پیامبر']],
    ['1405-11-03', ['ولادت امام مهدی']],
    ['1405-12-09', ['شهادت امام علی']],
    ['1405-12-19', ['عید فطر']],
    ['1405-12-20', ['تعطیل عید فطر']],
    ['1406-01-14', ['شهادت امام جعفر صادق']],
    ['1406-02-27', ['عید قربان']],
    ['1406-03-04', ['عید غدیر خم']],
    ['1406-03-24', ['تاسوعا']],
    ['1406-03-25', ['عاشورا']],
    ['1406-05-03', ['اربعین حسینی']],
    ['1406-05-11', ['رحلت پیامبر و شهادت امام حسن']],
    ['1406-05-20', ['شهادت امام حسن عسکری']],
    ['1406-05-29', ['ولادت پیامبر و امام جعفر صادق']],
    ['1406-08-11', ['شهادت حضرت فاطمه']],
    ['1406-09-21', ['ولادت امام علی']],
    ['1406-10-05', ['مبعث پیامبر']],
    ['1406-10-22', ['ولادت امام مهدی']],
    ['1406-11-28', ['شهادت امام علی']],
    ['1406-12-08', ['عید فطر']],
    ['1406-12-09', ['تعطیل عید فطر']]
  ]);

  readonly calendarType = computed<CalendarType>(() => this.normalizeCalendarType(this.auth.currentUser()?.profile.settings.calendarType));
  readonly selectedTaskDate = signal(this.todayKey());

  todayKey(): string {
    return this.formatDateKey(new Date());
  }

  setSelectedTaskDate(date: string): void {
    if (this.dateFromKey(date)) this.selectedTaskDate.set(date);
  }

  calendarTypeLabel(type: CalendarType = this.calendarType()): string {
    if (this.language() === 'fa') return type === 'Jalali' ? 'شمسی' : 'میلادی';
    return type === 'Jalali' ? 'Jalali' : 'Gregorian';
  }

  normalizeCalendarType(value: unknown): CalendarType {
    return value === 'Jalali' || value === 'jalali' ? 'Jalali' : 'Gregorian';
  }

  formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  dateFromKey(key: string | null | undefined): Date | null {
    if (!key) return null;
    const [year, month, day] = key.split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  addDays(date: Date, days: number): Date {
    const item = new Date(date);
    item.setDate(item.getDate() + days);
    return item;
  }

  startOfWeek(date: Date): Date {
    const weekStart = new Date(date);
    const dayOffset = (weekStart.getDay() - this.weekStartJsDay(this.calendarType()) + 7) % 7;
    weekStart.setDate(weekStart.getDate() - dayOffset);
    return weekStart;
  }

  startOfCurrentMonth(date: Date): Date {
    return this.startOfCalendarMonth(date, this.calendarType());
  }

  addCalendarMonths(key: string, amount: number): string {
    const type = this.calendarType();
    const date = this.dateFromKey(key) ?? new Date();
    if (type === 'Gregorian') {
      const parts = this.partsFor(date, type);
      return this.formatDateKey(new Date(parts.year, parts.month - 1 + amount, 1));
    }

    const parts = this.partsFor(date, type);
    const monthIndex = parts.year * 12 + (parts.month - 1) + amount;
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex - year * 12 + 1;
    return this.formatDateKey(this.jalaliToDate(year, month, 1) ?? date);
  }

  buildTimeline(selectedKey: string, daysBefore = 21, daysAfter = 35): CalendarDayCell[] {
    const selectedDate = this.dateFromKey(selectedKey) ?? new Date();
    return Array.from({ length: daysBefore + daysAfter + 1 }, (_, index) => {
      const date = this.addDays(selectedDate, index - daysBefore);
      return this.toDayCell(date, selectedKey, true);
    });
  }

  buildMonthView(viewDateKey: string, selectedKey: string | null): CalendarMonthView {
    const type = this.calendarType();
    const viewDate = this.dateFromKey(viewDateKey) ?? new Date();
    const monthStart = this.startOfCalendarMonth(viewDate, type);
    const weekStart = this.weekStartJsDay(type);
    const leadingDays = (monthStart.getDay() - weekStart + 7) % 7;
    const gridStart = this.addDays(monthStart, -leadingDays);
    const currentMonthId = this.calendarMonthId(monthStart, type);
    const parts = this.partsFor(monthStart, type);

    return {
      title: `${this.monthName(parts.month, type, 'long')} ${this.formatNumber(parts.year, type)}`,
      weekdays: this.weekdayHeaders(type),
      days: Array.from({ length: 42 }, (_, index) => {
        const date = this.addDays(gridStart, index);
        return this.toDayCell(date, selectedKey, this.calendarMonthId(date, type) === currentMonthId);
      })
    };
  }

  formatShortDateKey(key: string): string {
    const date = this.dateFromKey(key);
    return date ? this.formatShortDate(date) : key;
  }

  formatLongDateKey(key: string): string {
    const date = this.dateFromKey(key);
    return date ? this.formatLongDate(date) : key;
  }

  formatShortDate(date: Date): string {
    if (this.calendarType() === 'Jalali') {
      const parts = this.partsFor(date, 'Jalali');
      return `${this.formatNumber(parts.day, 'Jalali')} ${this.monthName(parts.month, 'Jalali', 'short')}`;
    }

    return (this.language() === 'fa' ? this.gregorianShortFormatterFa : this.gregorianShortFormatter).format(date);
  }

  formatLongDate(date: Date): string {
    if (this.calendarType() === 'Jalali') {
      const parts = this.partsFor(date, 'Jalali');
      return `${this.formatNumber(parts.day, 'Jalali')} ${this.monthName(parts.month, 'Jalali', 'long')} ${this.formatNumber(parts.year, 'Jalali')}`;
    }

    return (this.language() === 'fa' ? this.gregorianLongFormatterFa : this.gregorianLongFormatter).format(date);
  }

  formatDateTime(date: Date): string {
    return `${this.formatShortDate(date)}, ${(this.language() === 'fa' ? this.timeFormatterFa : this.timeFormatter).format(date)}`;
  }

  weekdayLabel(date: Date, narrow = false): string {
    const type = this.calendarType();
    if (type === 'Jalali' || this.language() === 'fa') {
      return (narrow ? this.persianWeekdaysNarrow : this.persianWeekdaysShort)[date.getDay()];
    }

    return (narrow ? this.gregorianWeekdaysNarrow : this.gregorianWeekdaysShort)[date.getDay()];
  }

  holidayTitleForKey(key: string): string | null {
    const date = this.dateFromKey(key);
    return date ? this.holidayFor(date)?.title ?? null : null;
  }

  isHolidayKey(key: string): boolean {
    return this.holidayTitleForKey(key) !== null;
  }

  private toDayCell(date: Date, selectedKey: string | null, isCurrentMonth: boolean): CalendarDayCell {
    const type = this.calendarType();
    const key = this.formatDateKey(date);
    const parts = this.partsFor(date, type);
    const holiday = this.holidayFor(date);

    return {
      key,
      weekday: this.weekdayLabel(date),
      dayOfMonth: this.formatNumber(parts.day, type),
      month: this.monthName(parts.month, type, 'short'),
      isToday: key === this.todayKey(),
      isSelected: key === selectedKey,
      isCurrentMonth,
      isHoliday: holiday !== null,
      holidayTitle: holiday?.title ?? null
    };
  }

  private startOfCalendarMonth(date: Date, type: CalendarType): Date {
    const parts = this.partsFor(date, type);
    if (type === 'Gregorian') return new Date(parts.year, parts.month - 1, 1);
    return this.jalaliToDate(parts.year, parts.month, 1) ?? date;
  }

  private partsFor(date: Date, type: CalendarType): DateParts {
    if (type === 'Gregorian') {
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      };
    }

    const parts = this.persianPartsFormatter.formatToParts(date);
    return {
      year: this.numberPart(parts, 'year'),
      month: this.numberPart(parts, 'month'),
      day: this.numberPart(parts, 'day')
    };
  }

  private numberPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
    return Number(parts.find(part => part.type === type)?.value ?? 0);
  }

  private calendarMonthId(date: Date, type: CalendarType): string {
    const parts = this.partsFor(date, type);
    return `${parts.year}-${`${parts.month}`.padStart(2, '0')}`;
  }

  private monthName(month: number, type: CalendarType, length: 'short' | 'long'): string {
    if (type === 'Jalali') return this.persianMonths[month - 1] ?? '';
    if (this.language() === 'fa') {
      return length === 'long'
        ? this.gregorianMonthsLongFa[month - 1] ?? ''
        : this.gregorianMonthsShortFa[month - 1] ?? '';
    }
    return length === 'long'
      ? this.gregorianMonthsLong[month - 1] ?? ''
      : this.gregorianMonthsShort[month - 1] ?? '';
  }

  private formatNumber(value: number, type: CalendarType): string {
    return type === 'Jalali' || this.language() === 'fa' ? this.persianNumberFormatter.format(value) : `${value}`;
  }

  private weekdayHeaders(type: CalendarType): string[] {
    const labels = type === 'Jalali' || this.language() === 'fa' ? this.persianWeekdaysNarrow : this.gregorianWeekdaysShort;
    const start = this.weekStartJsDay(type);
    return Array.from({ length: 7 }, (_, index) => labels[(start + index) % 7]);
  }

  private weekStartJsDay(type: CalendarType): number {
    if (type === 'Jalali') return 6;
    const value: unknown = this.auth.currentUser()?.profile.settings.weekStartDay ?? 'Monday';
    if (value === 'Sunday' || value === 0) return 0;
    if (value === 'Saturday' || value === 6) return 6;
    return 1;
  }

  private holidayFor(date: Date): { title: string } | null {
    const parts = this.partsFor(date, 'Jalali');
    const monthDayKey = `${`${parts.month}`.padStart(2, '0')}-${`${parts.day}`.padStart(2, '0')}`;
    const yearMonthDayKey = `${parts.year}-${monthDayKey}`;
    const titles = [
      ...(this.fixedJalaliHolidays.get(monthDayKey) ?? []),
      ...(this.specificJalaliHolidays.get(yearMonthDayKey) ?? [])
    ];

    if (date.getDay() === 5) titles.push('جمعه');
    if (titles.length === 0) return null;
    return { title: [...new Set(titles)].join('، ') };
  }

  private jalaliToDate(year: number, month: number, day: number): Date | null {
    const cacheKey = `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
    const cached = this.jalaliDateCache.get(cacheKey);
    if (cached) return this.dateFromKey(cached);

    const start = new Date(year + 621, 2, 1);
    for (let index = 0; index < 430; index += 1) {
      const candidate = this.addDays(start, index);
      const parts = this.partsFor(candidate, 'Jalali');
      if (parts.year === year && parts.month === month && parts.day === day) {
        this.jalaliDateCache.set(cacheKey, this.formatDateKey(candidate));
        return candidate;
      }
    }

    return null;
  }
}
