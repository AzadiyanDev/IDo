import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CalendarService } from '../../core/calendar.service';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-calendar-date-picker',
  template: `
    <section class="rounded-[22px] border border-theme-border bg-surface-container-lowest p-sm flex flex-col gap-sm" [style.--calendar-accent]="accent()">
      <div class="flex items-center justify-between gap-sm">
        <button type="button" (click)="previousMonth()" class="calendar-nav-button" [attr.aria-label]="i18n.text('Previous month')">
          <span class="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <div class="min-w-0 text-center">
          <p class="text-body-md font-body-md font-semibold text-on-surface m-0 truncate">{{ monthView().title }}</p>
          <p class="text-label-md font-label-md text-on-surface-variant m-0 mt-0.5">{{ calendar.calendarTypeLabel() }}</p>
        </div>
        <button type="button" (click)="nextMonth()" class="calendar-nav-button" [attr.aria-label]="i18n.text('Next month')">
          <span class="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>

      <div class="grid grid-cols-7 gap-xs">
        @for (weekday of monthView().weekdays; track weekday) {
          <span class="h-7 flex items-center justify-center text-label-md font-label-md text-on-surface-variant">{{ weekday }}</span>
        }
      </div>

      <div class="grid grid-cols-7 gap-xs">
        @for (day of monthView().days; track day.key) {
          <button
            type="button"
            (click)="selectDate(day.key)"
            class="calendar-day-button"
            [attr.title]="day.holidayTitle"
            [class.calendar-day-selected]="day.isSelected"
            [class.calendar-day-muted]="!day.isCurrentMonth"
            [class.calendar-day-today]="day.isToday"
            [class.calendar-day-holiday]="day.isHoliday">
            <span>{{ day.dayOfMonth }}</span>
            @if (day.isHoliday) {
              <span class="calendar-holiday-dot"></span>
            }
          </button>
        }
      </div>
    </section>
  `,
  styles: [`
    .calendar-nav-button {
      width: 38px;
      height: 38px;
      border-radius: 999px;
      border: 1px solid var(--color-theme-border);
      background: var(--color-surface-container-high);
      color: var(--color-on-surface);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .calendar-day-button {
      position: relative;
      height: 40px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: var(--color-surface-container-high);
      color: var(--color-on-surface);
      font: 700 12px/14px var(--font-app);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease, opacity 160ms ease;
    }
    .calendar-day-muted {
      opacity: 0.42;
    }
    .calendar-day-today {
      border-color: var(--calendar-accent, var(--color-primary));
    }
    .calendar-day-selected {
      background: var(--calendar-accent, var(--color-primary));
      color: var(--color-theme-bg);
      border-color: var(--calendar-accent, var(--color-primary));
    }
    .calendar-day-holiday:not(.calendar-day-selected) {
      color: var(--color-error);
      border-color: color-mix(in srgb, var(--color-error) 32%, transparent);
    }
    .calendar-holiday-dot {
      position: absolute;
      bottom: 5px;
      width: 4px;
      height: 4px;
      border-radius: 999px;
      background: var(--color-error);
    }
    .calendar-day-selected .calendar-holiday-dot {
      background: var(--color-theme-bg);
    }
  `]
})
export class CalendarDatePickerComponent {
  readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);

  readonly selectedDate = input<string | null>(null);
  readonly accent = input('var(--color-primary)');
  readonly selectedDateChange = output<string>();
  readonly viewDate = signal(this.calendar.todayKey());
  readonly monthView = computed(() => this.calendar.buildMonthView(this.viewDate(), this.selectedDate()));

  constructor() {
    effect(() => {
      const selectedDate = this.selectedDate();
      this.viewDate.set(selectedDate && this.calendar.dateFromKey(selectedDate) ? selectedDate : this.calendar.todayKey());
    });
  }

  previousMonth(): void {
    this.viewDate.set(this.calendar.addCalendarMonths(this.viewDate(), -1));
  }

  nextMonth(): void {
    this.viewDate.set(this.calendar.addCalendarMonths(this.viewDate(), 1));
  }

  selectDate(date: string): void {
    this.selectedDateChange.emit(date);
  }
}
