import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CalendarService } from '../../core/calendar.service';
import { I18nService } from '../../core/i18n.service';

export interface CalendarDatePickerOptions {
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

const DEFAULT_PICKER_OPTIONS: Required<CalendarDatePickerOptions> = {
  showMonthSelector: true,
  showYearSelector: true,
  showCalendarLabel: true,
  showTodayButton: true,
  showAdjacentDays: true,
  showHolidays: true,
  fixedWeekCount: true,
  yearRange: 121,
  yearPageSize: 12,
  density: 'comfortable'
};

@Component({
  selector: 'app-calendar-date-picker',
  template: `
    <section class="ido-calendar" [attr.data-density]="pickerOptions().density" [style.--ido-calendar-accent]="accent()">
      <div class="ido-calendar__header">
        <button type="button" (click)="previousMonth()" class="ido-calendar__nav-button" [attr.aria-label]="i18n.text('Previous month')">
          <span class="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        @if (canOpenPeriodPanel()) {
          <button
            type="button"
            class="ido-calendar__period-button"
            (click)="togglePeriodPanel()"
            [attr.aria-expanded]="periodPanelOpen()"
            [attr.aria-label]="monthView().title">
            <span class="ido-calendar__period-title">{{ monthView().title }}</span>
            <span class="material-symbols-outlined text-[18px]">{{ periodPanelOpen() ? 'expand_less' : 'expand_more' }}</span>
          </button>
        } @else {
          <span class="ido-calendar__title">{{ monthView().title }}</span>
        }

        <button type="button" (click)="nextMonth()" class="ido-calendar__nav-button" [attr.aria-label]="i18n.text('Next month')">
          <span class="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>

      @if (pickerOptions().showCalendarLabel || pickerOptions().showTodayButton) {
        <div class="ido-calendar__meta">
          @if (pickerOptions().showCalendarLabel) {
            <span>{{ calendar.calendarTypeLabel() }}</span>
          }
          @if (pickerOptions().showTodayButton) {
            <button type="button" class="ido-calendar__today-button" (click)="jumpToToday()">{{ i18n.text('Today') }}</button>
          }
        </div>
      }

      @if (periodPanelOpen()) {
        <div class="ido-calendar__panel">
          @if (pickerOptions().showMonthSelector && pickerOptions().showYearSelector) {
            <div class="ido-calendar__tabs">
              <button type="button" class="ido-calendar__tab" [class.is-active]="periodPanelMode() === 'month'" (click)="periodPanelMode.set('month')">{{ i18n.text('Month') }}</button>
              <button type="button" class="ido-calendar__tab" [class.is-active]="periodPanelMode() === 'year'" (click)="periodPanelMode.set('year')">{{ i18n.text('Year') }}</button>
            </div>
          }

          @if (periodPanelMode() === 'year') {
            <div class="ido-calendar__stepper">
              <button type="button" class="ido-calendar__mini-button" (click)="moveYearPage(-1)" [attr.aria-label]="i18n.text('Previous year')">
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span>{{ yearPageTitle() }}</span>
              <button type="button" class="ido-calendar__mini-button" (click)="moveYearPage(1)" [attr.aria-label]="i18n.text('Next year')">
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
            <div class="ido-calendar__year-grid">
              @for (year of visibleYearOptions(); track year.value) {
                <button type="button" class="ido-calendar__picker-button" [class.is-active]="year.value === monthView().year" (click)="chooseYear(year.value)">
                  {{ year.label }}
                </button>
              }
            </div>
          } @else {
            @if (pickerOptions().showYearSelector) {
              <div class="ido-calendar__stepper">
                <button type="button" class="ido-calendar__mini-button" (click)="setViewYear(monthView().year - 1)" [attr.aria-label]="i18n.text('Previous year')">
                  <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span>{{ currentYearLabel() }}</span>
                <button type="button" class="ido-calendar__mini-button" (click)="setViewYear(monthView().year + 1)" [attr.aria-label]="i18n.text('Next year')">
                  <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            }
            <div class="ido-calendar__month-grid">
              @for (month of monthView().monthOptions; track month.value) {
                <button type="button" class="ido-calendar__picker-button" [class.is-active]="month.value === monthView().month" (click)="chooseMonth(month.value)">
                  {{ month.label }}
                </button>
              }
            </div>
          }
        </div>
      } @else {
        <div class="ido-calendar__weekdays">
          @for (weekday of monthView().weekdays; track weekday) {
            <span class="ido-calendar__weekday">{{ weekday }}</span>
          }
        </div>

        <div class="ido-calendar__days">
          @for (day of monthView().days; track day.key) {
            <button
              type="button"
              (click)="selectDate(day.key)"
              class="ido-calendar__day-button"
              [attr.title]="day.holidayTitle"
              [attr.aria-pressed]="day.isSelected"
              [disabled]="!day.isVisible"
              [class.is-selected]="day.isSelected"
              [class.is-muted]="!day.isCurrentMonth"
              [class.is-hidden]="!day.isVisible"
              [class.is-today]="day.isToday"
              [class.is-holiday]="day.isHoliday">
              <span>{{ day.dayOfMonth }}</span>
              @if (day.isHoliday && day.isVisible) {
                <span class="ido-calendar__holiday-dot"></span>
              }
            </button>
          }
        </div>
      }
    </section>
  `
})
export class CalendarDatePickerComponent {
  readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);

  readonly selectedDate = input<string | null>(null);
  readonly accent = input('var(--color-primary)');
  readonly options = input<CalendarDatePickerOptions>({});
  readonly selectedDateChange = output<string>();
  readonly viewDate = signal(this.calendar.todayKey());
  readonly periodPanelOpen = signal(false);
  readonly periodPanelMode = signal<'month' | 'year'>('month');
  readonly yearPageStart = signal<number | null>(null);

  readonly pickerOptions = computed(() => ({ ...DEFAULT_PICKER_OPTIONS, ...this.options() }));
  readonly monthView = computed(() => this.calendar.buildMonthView(this.viewDate(), this.selectedDate(), {
    showAdjacentMonths: this.pickerOptions().showAdjacentDays,
    showHolidays: this.pickerOptions().showHolidays,
    fixedWeekCount: this.pickerOptions().fixedWeekCount,
    yearRange: this.pickerOptions().yearRange
  }));
  readonly currentMonthLabel = computed(() => this.monthView().monthOptions.find(month => month.value === this.monthView().month)?.label ?? '');
  readonly currentYearLabel = computed(() => this.monthView().yearOptions.find(year => year.value === this.monthView().year)?.label ?? `${this.monthView().year}`);
  readonly canOpenPeriodPanel = computed(() => this.pickerOptions().showMonthSelector || this.pickerOptions().showYearSelector);
  readonly visibleYearOptions = computed(() => {
    const size = Math.max(6, this.pickerOptions().yearPageSize);
    const start = this.yearPageStart() ?? this.defaultYearPageStart();
    return this.calendar.yearOptions(start + Math.floor(size / 2), size);
  });
  readonly yearPageTitle = computed(() => {
    const years = this.visibleYearOptions();
    return years.length ? `${years[0].label} - ${years[years.length - 1].label}` : '';
  });

  constructor() {
    effect(() => {
      const selectedDate = this.selectedDate();
      this.viewDate.set(selectedDate && this.calendar.dateFromKey(selectedDate) ? selectedDate : this.calendar.todayKey());
      this.yearPageStart.set(null);
    });
  }

  previousMonth(): void {
    this.viewDate.set(this.calendar.addCalendarMonths(this.viewDate(), -1));
    this.periodPanelOpen.set(false);
  }

  nextMonth(): void {
    this.viewDate.set(this.calendar.addCalendarMonths(this.viewDate(), 1));
    this.periodPanelOpen.set(false);
  }

  setViewMonth(month: number): void {
    if (!Number.isFinite(month)) return;
    this.viewDate.set(this.calendar.setCalendarMonth(this.viewDate(), month));
  }

  setViewYear(year: number): void {
    if (!Number.isFinite(year)) return;
    this.viewDate.set(this.calendar.setCalendarYear(this.viewDate(), year));
  }

  jumpToToday(): void {
    this.viewDate.set(this.calendar.todayKey());
    this.periodPanelOpen.set(false);
  }

  selectDate(date: string): void {
    this.selectedDateChange.emit(date);
  }

  togglePeriodPanel(): void {
    if (!this.canOpenPeriodPanel()) return;
    const nextOpen = !this.periodPanelOpen();
    this.periodPanelOpen.set(nextOpen);
    if (nextOpen) {
      this.periodPanelMode.set(this.pickerOptions().showMonthSelector ? 'month' : 'year');
      this.yearPageStart.set(this.defaultYearPageStart());
    }
  }

  chooseMonth(month: number): void {
    this.setViewMonth(month);
    this.periodPanelOpen.set(false);
  }

  chooseYear(year: number): void {
    this.setViewYear(year);
    if (this.pickerOptions().showMonthSelector) {
      this.periodPanelMode.set('month');
    } else {
      this.periodPanelOpen.set(false);
    }
  }

  moveYearPage(direction: -1 | 1): void {
    const size = Math.max(6, this.pickerOptions().yearPageSize);
    this.yearPageStart.set((this.yearPageStart() ?? this.defaultYearPageStart()) + direction * size);
  }

  private defaultYearPageStart(): number {
    const size = Math.max(6, this.pickerOptions().yearPageSize);
    return this.monthView().year - Math.floor(size / 2);
  }
}
