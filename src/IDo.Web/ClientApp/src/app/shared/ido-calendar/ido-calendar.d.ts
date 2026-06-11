export type CalendarType = 'Gregorian' | 'Jalali';
export type CalendarLocale = 'en' | 'fa';
export type CalendarWeekStartDay = 'Sunday' | 'Monday' | 'Saturday' | 0 | 1 | 6;

export interface CalendarHoliday {
  key: string;
  title: string;
}

export interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

export interface CalendarOptions {
  calendarType?: CalendarType;
  locale?: CalendarLocale | 'fa-IR' | 'Persian';
  weekStartDay?: CalendarWeekStartDay;
  showAdjacentMonths?: boolean;
  fixedWeekCount?: boolean;
  showHolidays?: boolean;
  usePersianDigits?: boolean;
  holidays?: CalendarHoliday[];
  holidayProvider?: (key: string, context: { date: Date; parts: CalendarDateParts }) => string | string[] | null | undefined;
}

export interface CalendarDayCell {
  key: string;
  weekday: string;
  dayOfMonth: string;
  month: string;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isVisible: boolean;
  isHoliday: boolean;
  holidayTitle: string | null;
  parts: CalendarDateParts;
}

export interface CalendarMonthOption {
  value: number;
  label: string;
}

export interface CalendarYearOption {
  value: number;
  label: string;
}

export interface CalendarMonthView {
  title: string;
  year: number;
  month: number;
  calendarType: CalendarType;
  weekdays: string[];
  monthOptions: CalendarMonthOption[];
  yearOptions: CalendarYearOption[];
  days: CalendarDayCell[];
}

export declare class IDoCalendar {
  constructor(options?: CalendarOptions);
  get options(): Required<Omit<CalendarOptions, 'weekStartDay' | 'usePersianDigits' | 'holidayProvider'>> & Pick<CalendarOptions, 'weekStartDay' | 'usePersianDigits' | 'holidayProvider'>;
  setOptions(options?: CalendarOptions): this;
  todayKey(): string;
  calendarTypeLabel(type?: CalendarType): string;
  normalizeCalendarType(value: unknown): CalendarType;
  formatDateKey(date: Date): string;
  dateFromKey(key: string | null | undefined): Date | null;
  addDays(date: Date, days: number): Date;
  startOfWeek(date: Date): Date;
  startOfCurrentMonth(date: Date): Date;
  addCalendarMonths(key: string, amount: number): string;
  addCalendarYears(key: string, amount: number): string;
  setCalendarMonth(key: string, month: number): string;
  setCalendarYear(key: string, year: number): string;
  keyFromCalendarParts(year: number, month: number, day?: number): string;
  buildTimeline(selectedKey: string, daysBefore?: number, daysAfter?: number, options?: CalendarOptions): CalendarDayCell[];
  buildMonthView(viewDateKey: string, selectedKey: string | null, options?: CalendarOptions & { yearRange?: number }): CalendarMonthView;
  monthOptions(type?: CalendarType): CalendarMonthOption[];
  yearOptions(centerYear: number, range?: number, type?: CalendarType): CalendarYearOption[];
  formatShortDateKey(key: string): string;
  formatLongDateKey(key: string): string;
  formatShortDate(date: Date): string;
  formatLongDate(date: Date): string;
  formatDateTime(date: Date): string;
  weekdayLabel(date: Date, narrow?: boolean): string;
  holidayTitleForKey(key: string): string | null;
  isHolidayKey(key: string): boolean;
  startOfCalendarMonth(date: Date, type?: CalendarType): Date;
  partsFor(date: Date, type?: CalendarType): CalendarDateParts;
  calendarMonthId(date: Date, type?: CalendarType): string;
  monthName(month: number, type?: CalendarType, length?: 'short' | 'long'): string;
  formatNumber(value: number, type?: CalendarType): string;
  weekdayHeaders(type?: CalendarType, weekStartDay?: CalendarWeekStartDay): string[];
  weekStartJsDay(type?: CalendarType, weekStartDay?: CalendarWeekStartDay): number;
  holidayFor(date: Date): { title: string } | null;
  jalaliToDate(year: number, month: number, day: number): Date | null;
  dateForCalendarParts(year: number, month: number, day: number, type?: CalendarType): Date | null;
  daysInCalendarMonth(year: number, month: number, type?: CalendarType): number;
}
