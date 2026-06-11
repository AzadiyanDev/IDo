import { Injectable, computed, inject, signal } from '@angular/core';
import { IDoCalendar } from '../shared/ido-calendar/ido-calendar.js';
import type {
  CalendarDayCell as IDoCalendarDayCell,
  CalendarMonthOption,
  CalendarMonthView as IDoCalendarMonthView,
  CalendarOptions,
  CalendarType as IDoCalendarType,
  CalendarWeekStartDay,
  CalendarYearOption
} from '../shared/ido-calendar/ido-calendar.js';
import { AuthService } from './auth.service';

export type CalendarType = IDoCalendarType;
export type CalendarDayCell = IDoCalendarDayCell;
export type CalendarMonthView = IDoCalendarMonthView;
export type { CalendarMonthOption, CalendarYearOption };

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly auth = inject(AuthService);
  private readonly engine = new IDoCalendar();
  private readonly language = computed<'en' | 'fa'>(() => this.auth.currentUser()?.profile.settings.language === 'fa' ? 'fa' : 'en');

  readonly calendarType = computed<CalendarType>(() => this.normalizeCalendarType(this.auth.currentUser()?.profile.settings.calendarType));
  readonly selectedTaskDate = signal(this.todayKey());

  todayKey(): string {
    return this.withCurrentOptions().todayKey();
  }

  setSelectedTaskDate(date: string): void {
    if (this.dateFromKey(date)) this.selectedTaskDate.set(date);
  }

  calendarTypeLabel(type: CalendarType = this.calendarType()): string {
    return this.withCurrentOptions().calendarTypeLabel(type);
  }

  normalizeCalendarType(value: unknown): CalendarType {
    return this.engine.normalizeCalendarType(value);
  }

  formatDateKey(date: Date): string {
    return this.engine.formatDateKey(date);
  }

  dateFromKey(key: string | null | undefined): Date | null {
    return this.engine.dateFromKey(key);
  }

  addDays(date: Date, days: number): Date {
    return this.engine.addDays(date, days);
  }

  startOfWeek(date: Date): Date {
    return this.withCurrentOptions().startOfWeek(date);
  }

  startOfCurrentMonth(date: Date): Date {
    return this.withCurrentOptions().startOfCurrentMonth(date);
  }

  addCalendarMonths(key: string, amount: number): string {
    return this.withCurrentOptions().addCalendarMonths(key, amount);
  }

  addCalendarYears(key: string, amount: number): string {
    return this.withCurrentOptions().addCalendarYears(key, amount);
  }

  setCalendarMonth(key: string, month: number): string {
    return this.withCurrentOptions().setCalendarMonth(key, month);
  }

  setCalendarYear(key: string, year: number): string {
    return this.withCurrentOptions().setCalendarYear(key, year);
  }

  buildTimeline(selectedKey: string, daysBefore = 21, daysAfter = 35): CalendarDayCell[] {
    return this.withCurrentOptions().buildTimeline(selectedKey, daysBefore, daysAfter);
  }

  buildMonthView(viewDateKey: string, selectedKey: string | null, options: CalendarOptions & { yearRange?: number } = {}): CalendarMonthView {
    return this.withCurrentOptions().buildMonthView(viewDateKey, selectedKey, options);
  }

  monthOptions(type: CalendarType = this.calendarType()): CalendarMonthOption[] {
    return this.withCurrentOptions().monthOptions(type);
  }

  yearOptions(centerYear: number, range?: number, type: CalendarType = this.calendarType()): CalendarYearOption[] {
    return this.withCurrentOptions().yearOptions(centerYear, range, type);
  }

  formatShortDateKey(key: string): string {
    return this.withCurrentOptions().formatShortDateKey(key);
  }

  formatLongDateKey(key: string): string {
    return this.withCurrentOptions().formatLongDateKey(key);
  }

  formatShortDate(date: Date): string {
    return this.withCurrentOptions().formatShortDate(date);
  }

  formatLongDate(date: Date): string {
    return this.withCurrentOptions().formatLongDate(date);
  }

  formatDateTime(date: Date): string {
    return this.withCurrentOptions().formatDateTime(date);
  }

  weekdayLabel(date: Date, narrow = false): string {
    return this.withCurrentOptions().weekdayLabel(date, narrow);
  }

  holidayTitleForKey(key: string): string | null {
    return this.withCurrentOptions().holidayTitleForKey(key);
  }

  isHolidayKey(key: string): boolean {
    return this.withCurrentOptions().isHolidayKey(key);
  }

  private withCurrentOptions(): IDoCalendar {
    const type = this.calendarType();
    this.engine.setOptions({
      calendarType: type,
      locale: this.language(),
      weekStartDay: this.weekStartDay(type)
    });
    return this.engine;
  }

  private weekStartDay(type: CalendarType): CalendarWeekStartDay | undefined {
    if (type === 'Jalali') return undefined;

    const value: unknown = this.auth.currentUser()?.profile.settings.weekStartDay ?? 'Monday';
    if (value === 'Sunday' || value === 0) return 'Sunday';
    if (value === 'Saturday' || value === 6) return 'Saturday';
    return 'Monday';
  }
}
