import { Location } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CalendarService } from '../../core/calendar.service';
import { HabitDayAnalysisDto, HabitDetailsDto, HabitLogStatus, HabitsService } from '../../core/habits.service';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-habit-details',
  template: `
    <header class="w-full top-0 sticky z-40 bg-theme-bg/90 backdrop-blur-md flex items-center justify-between px-margin-mobile py-md">
      <button type="button" (click)="location.back()" class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors active:scale-95 border-none outline-none">
        <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">arrow_back</span>
      </button>
      <div class="flex flex-col items-center min-w-0 px-sm">
        <h1 class="font-headline-md text-headline-md text-on-surface m-0 leading-tight">{{ i18n.text('Habit Details') }}</h1>
        <span class="font-label-md text-label-md text-on-surface-variant truncate max-w-[220px]">{{ scheduleLabel() }}</span>
      </div>
      <button type="button" class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 transition-colors active:scale-95 border-none bg-transparent">
        <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">more_vert</span>
      </button>
    </header>

    @if (isLoading()) {
      <div class="px-margin-mobile py-xl flex flex-col gap-md">
        <div class="h-44 rounded-[24px] bg-theme-surface border border-theme-border animate-pulse"></div>
        <div class="h-36 rounded-[24px] bg-theme-surface border border-theme-border animate-pulse"></div>
        <div class="h-48 rounded-[24px] bg-theme-surface border border-theme-border animate-pulse"></div>
      </div>
    } @else if (loadError()) {
      <div class="px-margin-mobile py-xl">
        <section class="bg-theme-surface border border-theme-border rounded-[24px] p-lg text-center">
          <span class="material-symbols-outlined text-error text-[32px]">error</span>
          <h2 class="font-headline-md text-on-surface mt-sm mb-xs">{{ i18n.text('Habit unavailable') }}</h2>
          <p class="font-body-md text-on-surface-variant m-0">{{ loadError() }}</p>
        </section>
      </div>
    } @else if (details(); as detail) {
      <div class="flex-1 px-margin-mobile flex flex-col gap-lg mt-sm pb-36">
        <section class="bg-theme-surface border border-theme-border rounded-[24px] p-lg flex flex-col gap-md shadow-[0px_10px_30px_rgba(0,0,0,0.32)]">
          <div class="flex items-start justify-between gap-md">
            <div
              class="status-badge"
              [class.status-open]="!isCompletedToday() && !isRestToday()"
              [class.status-done]="isCompletedToday()"
              [class.status-rest]="isRestToday()">
              <span class="material-symbols-outlined text-[15px]" style="font-variation-settings: 'FILL' 1;">{{ statusIcon() }}</span>
              {{ todayStatusLabel() }}
            </div>
            <div class="flex items-center gap-xs text-theme-orange font-label-md bg-surface-container px-sm py-base rounded-full border border-outline-variant/30 shrink-0">
              <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
              <span>{{ streakLabel(detail.habit.currentStreak) }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-xs">
            <h2 class="font-headline-lg-mobile text-on-surface m-0">{{ detail.habit.title }}</h2>
            <p class="font-body-md text-on-surface-variant leading-relaxed m-0">
              {{ detail.habit.description || i18n.text('No description provided.') }}
            </p>
          </div>

          <div class="flex flex-wrap gap-sm mt-xs">
            <div class="info-chip">
              <span class="material-symbols-outlined text-[16px] text-secondary">event_repeat</span>
              {{ scheduleLabel() }}
            </div>
            <div class="info-chip">
              <span class="material-symbols-outlined text-[16px] text-theme-orange">notifications</span>
              {{ reminderLabel() }}
            </div>
            <div class="info-chip">
              <span class="material-symbols-outlined text-[16px] text-theme-purple">emoji_events</span>
              {{ bestStreakLabel() }}
            </div>
          </div>
        </section>

        <section class="bg-theme-surface border border-theme-border rounded-[24px] p-md flex flex-col gap-sm">
          <h3 class="section-label pl-0">{{ i18n.text('Information') }}</h3>
          <div class="detail-row">
            <div class="detail-title">
              <span class="material-symbols-outlined">repeat</span>
              <span>{{ i18n.text('Schedule') }}</span>
            </div>
            <span class="detail-value">{{ scheduleLabel() }}</span>
          </div>
          <div class="divider"></div>
          <div class="detail-row">
            <div class="detail-title">
              <span class="material-symbols-outlined">notifications</span>
              <span>{{ i18n.text('Reminder') }}</span>
            </div>
            <span class="detail-value">{{ reminderLabel() }}</span>
          </div>
          <div class="divider"></div>
          <div class="detail-row">
            <div class="detail-title">
              <span class="material-symbols-outlined">toggle_on</span>
              <span>{{ i18n.text('Status') }}</span>
            </div>
            <span class="detail-value">{{ detail.habit.isActive ? i18n.text('Active') : i18n.text('Disabled') }}</span>
          </div>
        </section>

        <section class="flex flex-col gap-sm">
          <div class="flex items-end justify-between gap-md">
            <h3 class="section-label">{{ i18n.text('Analytics') }}</h3>
            <span class="font-label-md text-label-md text-on-surface-variant">{{ rangeLabel() }}</span>
          </div>
          <div class="table-shell">
            <table class="detail-table">
              <tbody>
                @for (row of analyticsRows(); track row.label) {
                  <tr>
                    <th scope="row">{{ row.label }}</th>
                    <td>{{ row.value }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="flex flex-col gap-sm">
          <div class="flex items-end justify-between gap-md">
            <h3 class="section-label">{{ i18n.text('Completion History') }}</h3>
            <span class="font-label-md text-label-md text-on-surface-variant">{{ completedCountLabel() }}</span>
          </div>
          <div class="table-shell">
            <table class="detail-table history-table">
              <thead>
                <tr>
                  <th scope="col">{{ i18n.text('Date') }}</th>
                  <th scope="col">{{ i18n.text('Day') }}</th>
                  <th scope="col">{{ i18n.text('Completed') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (log of completionHistory(); track log.id) {
                  <tr>
                    <td>{{ dateOnlyLabel(log.date) }}</td>
                    <td>{{ weekdayLabel(log.date) }}</td>
                    <td>{{ log.completedAtUtc ? dateTimeLabel(log.completedAtUtc) : i18n.text('Done') }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="empty-cell">{{ i18n.text('No completed days yet.') }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="flex flex-col gap-sm">
          <h3 class="section-label">{{ i18n.text('Recent Rhythm') }}</h3>
          <div class="bg-theme-surface border border-theme-border rounded-[24px] p-md flex flex-col gap-md">
            <div class="grid grid-cols-10 gap-xs">
              @for (day of recentGrid(); track day.date) {
                <div
                  class="aspect-square rounded-full border flex items-center justify-center"
                  [class.bg-secondary]="isDoneDay(day)"
                  [class.border-secondary]="isDoneDay(day)"
                  [class.bg-theme-orange\/20]="isOpenDay(day)"
                  [class.border-theme-orange\/40]="isOpenDay(day)"
                  [class.bg-error-container\/45]="isMissedDay(day)"
                  [class.border-error\/40]="isMissedDay(day)"
                  [class.bg-surface-container-highest]="!day.isScheduled"
                  [class.border-theme-border]="!day.isScheduled"
                  [attr.title]="dateOnlyLabel(day.date)">
                  @if (isDoneDay(day)) {
                    <span class="material-symbols-outlined text-on-secondary text-[13px]" style="font-variation-settings: 'FILL' 1;">check</span>
                  } @else if (!day.isScheduled) {
                    <span class="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></span>
                  }
                </div>
              }
            </div>

            <div class="flex flex-col gap-sm">
              @for (row of weekdayRows(); track row.label) {
                <div class="weekday-row">
                  <span class="weekday-label">{{ row.label }}</span>
                  <div class="weekday-track">
                    <div class="weekday-fill" [style.width.%]="row.rate"></div>
                  </div>
                  <span class="weekday-rate">{{ percentLabel(row.rate) }}</span>
                </div>
              } @empty {
                <div class="text-body-md font-body-md text-on-surface-variant text-center py-sm">
                  {{ i18n.text('No scheduled days in this range.') }}
                </div>
              }
            </div>
          </div>
        </section>
      </div>

      <div class="fixed bottom-0 left-0 w-full z-50 p-margin-mobile bg-theme-bg/70 backdrop-blur-md border-t border-theme-border/50 rounded-t-[32px] flex justify-center items-center">
        <button
          type="button"
          (touchstart)="startHold($event)" (touchend)="cancelHold()" (touchcancel)="cancelHold()"
          (mousedown)="startHold($event)" (mouseup)="cancelHold()" (mouseleave)="cancelHold()"
          [disabled]="!canCompleteToday() || isSavingCompletion()"
          class="hold-button w-full max-w-[448px]"
          [class.hold-active]="isHolding()"
          [class.hold-complete]="isCompletedToday()"
          [class.hold-rest]="isRestToday()">
          @if (canCompleteToday()) {
            <div class="hold-fill" [class.hold-fill-active]="isHolding()"></div>
          }
          <span class="material-symbols-outlined z-10" [style.font-variation-settings]="isCompletedToday() ? '&quot;FILL&quot; 1' : '&quot;wght&quot; 300'">
            {{ bottomActionIcon() }}
          </span>
          <span class="font-headline-md z-10 text-[16px]">{{ bottomActionLabel() }}</span>
        </button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .section-label { margin: 0; padding-left: 0.25rem; font: 600 11px/14px var(--font-app); color: var(--color-on-surface-variant); text-transform: uppercase; letter-spacing: 0.05em; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font: 600 11px/14px var(--font-app); border: 1px solid transparent; }
    .status-open { background: rgba(255, 192, 0, 0.12); color: var(--color-theme-orange); border-color: rgba(255, 192, 0, 0.24); }
    .status-done { background: rgba(0, 244, 185, 0.12); color: var(--color-theme-green); border-color: rgba(0, 244, 185, 0.22); }
    .status-rest { background: rgba(142, 155, 174, 0.12); color: var(--color-on-surface-variant); border-color: rgba(142, 155, 174, 0.2); }
    .info-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: var(--color-surface-container-lowest); border: 1px solid var(--color-theme-border); color: var(--color-on-surface); font: 500 11px/14px var(--font-app); }
    .detail-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 6px 0; }
    .detail-title { display: flex; align-items: center; gap: 10px; min-width: 0; color: var(--color-on-surface-variant); font: 500 13px/18px var(--font-app); }
    .detail-title .material-symbols-outlined { font-size: 20px; }
    .detail-value { color: var(--color-on-surface); font: 500 13px/18px var(--font-app); text-align: right; min-width: 0; overflow-wrap: anywhere; }
    .divider { height: 1px; width: 100%; background: rgba(42, 51, 65, 0.65); }
    .table-shell { overflow: hidden; border: 1px solid var(--color-theme-border); border-radius: 20px; background: var(--color-theme-surface); }
    .detail-table { width: 100%; border-collapse: collapse; font: 500 12px/17px var(--font-app); }
    .detail-table th, .detail-table td { padding: 11px 12px; border-bottom: 1px solid rgba(42, 51, 65, 0.72); vertical-align: middle; }
    .detail-table tr:last-child th, .detail-table tr:last-child td { border-bottom: 0; }
    .detail-table th { color: var(--color-on-surface-variant); font-weight: 600; text-align: left; }
    .detail-table td { color: var(--color-on-surface); text-align: right; overflow-wrap: anywhere; }
    .history-table thead th { color: var(--color-on-surface-variant); background: var(--color-surface-container-lowest); }
    .empty-cell { text-align: center !important; color: var(--color-on-surface-variant) !important; padding-block: 18px !important; }
    .weekday-row { display: grid; grid-template-columns: 34px 1fr 48px; gap: 10px; align-items: center; }
    .weekday-label { color: var(--color-on-surface); font: 700 12px/16px var(--font-app); }
    .weekday-track { height: 8px; border-radius: 999px; overflow: hidden; background: var(--color-surface-container-highest); }
    .weekday-fill { height: 100%; border-radius: inherit; background: var(--color-secondary); }
    .weekday-rate { color: var(--color-on-surface-variant); font: 600 11px/14px var(--font-app); text-align: right; }
    .hold-button { height: 64px; border-radius: 999px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; gap: 10px; user-select: none; outline: none; border: 1px solid var(--color-theme-border); background: var(--color-theme-elevated); color: var(--color-on-surface); transition: transform 180ms ease, border-color 240ms ease, background-color 240ms ease, color 240ms ease, opacity 180ms ease; }
    .hold-button:active, .hold-active { transform: scale(0.985); }
    .hold-button:disabled { cursor: default; }
    .hold-complete { background: rgba(0, 244, 185, 0.16); border-color: rgba(0, 244, 185, 0.32); color: var(--color-theme-green); }
    .hold-rest { opacity: 0.58; color: var(--color-on-surface-variant); }
    .hold-fill { position: absolute; inset: 0 auto 0 0; width: 0%; opacity: 0.28; background: var(--color-theme-green); transition: width 220ms ease-out; }
    .hold-fill-active { width: 100%; transition: width 2000ms linear; }
  `]
})
export class HabitDetailsComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly habitsService = inject(HabitsService);
  private readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);
  readonly location = inject(Location);

  private readonly habitId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly todayKey = this.calendar.todayKey();
  private readonly holdDuration = 2000;
  private holdTimer?: ReturnType<typeof setTimeout>;

  readonly details = signal<HabitDetailsDto | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isHolding = signal(false);
  readonly isSavingCompletion = signal(false);

  readonly habit = computed(() => this.details()?.habit ?? null);
  readonly todayState = computed(() => this.details()?.recentDays.find(day => day.date === this.todayKey) ?? null);
  readonly isCompletedToday = computed(() => this.isDoneStatus(this.todayState()?.status ?? null));
  readonly isRestToday = computed(() => this.todayState() ? !this.todayState()!.isScheduled : false);
  readonly canCompleteToday = computed(() => Boolean(this.todayState()?.isScheduled) && !this.isCompletedToday());
  readonly completionHistory = computed(() => this.details()?.logs.filter(log => this.isDoneStatus(log.status)) ?? []);
  readonly recentGrid = computed(() => [...(this.details()?.recentDays ?? [])].slice(0, 30).reverse());
  readonly weekdayRows = computed(() => (this.details()?.weekdayStats ?? []).map(item => ({
    label: this.dayOfWeekLabel(item.dayOfWeek),
    rate: item.successRate,
    stats: item
  })));
  readonly analyticsRows = computed(() => {
    const analytics = this.details()?.analytics;
    if (!analytics) return [];
    return [
      { label: this.i18n.text('Success rate'), value: this.percentLabel(analytics.successRate) },
      { label: this.i18n.text('Completed days'), value: this.i18n.number(analytics.completedDays) },
      { label: this.i18n.text('Scheduled days'), value: this.i18n.number(analytics.scheduledDays) },
      { label: this.i18n.text('Missed days'), value: this.i18n.number(analytics.missedDays) },
      { label: this.i18n.text('Open days'), value: this.i18n.number(analytics.openDays) },
      { label: this.i18n.text('Average per week'), value: this.i18n.number(analytics.averageDonePerWeek) },
      { label: this.i18n.text('Longest gap'), value: this.daysLabel(analytics.longestGapDays) },
      { label: this.i18n.text('Last completed'), value: analytics.lastCompletedDate ? this.dateOnlyLabel(analytics.lastCompletedDate) : this.i18n.text('Unknown') }
    ];
  });

  constructor() {
    void this.load();
  }

  ngOnDestroy(): void {
    this.cancelHold();
  }

  startHold(event: Event): void {
    event.preventDefault();
    if (!this.canCompleteToday() || this.isSavingCompletion() || this.isHolding()) return;
    window.navigator.vibrate?.(50);
    this.isHolding.set(true);
    this.holdTimer = setTimeout(() => void this.completeHeldHabit(), this.holdDuration);
  }

  cancelHold(): void {
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = undefined;
    this.isHolding.set(false);
  }

  statusIcon(): string {
    if (this.isCompletedToday()) return 'check_circle';
    if (this.isRestToday()) return 'bedtime';
    return 'radio_button_unchecked';
  }

  todayStatusLabel(): string {
    if (this.isCompletedToday()) return this.i18n.text('Completed today');
    if (this.isRestToday()) return this.i18n.text('Rest day');
    return this.i18n.text('Open');
  }

  bottomActionIcon(): string {
    if (this.isCompletedToday()) return 'check_circle';
    if (this.isRestToday()) return 'bedtime';
    if (this.isSavingCompletion()) return 'progress_activity';
    return 'fingerprint';
  }

  bottomActionLabel(): string {
    if (this.isSavingCompletion()) return this.i18n.text('Completing...');
    if (this.isCompletedToday()) return this.i18n.text('Habit Completed');
    if (this.isRestToday()) return this.i18n.text('Rest day');
    return this.i18n.text('Hold 2s to mark done');
  }

  scheduleLabel(): string {
    const habit = this.habit();
    if (!habit) return this.i18n.text('Loading');
    if (habit.requiredTimesPerWeek && habit.requiredTimesPerWeek > 0) {
      return this.i18n.language() === 'fa'
        ? `${this.i18n.number(habit.requiredTimesPerWeek)} بار در هفته`
        : `${habit.requiredTimesPerWeek} times per week`;
    }
    if (habit.activeDays.length === 7) return this.i18n.text('Every day');
    if (habit.activeDays.length === 0) return this.i18n.text('No active days');
    return habit.activeDays.map(day => this.dayOfWeekLabel(day)).join(' ');
  }

  reminderLabel(): string {
    const reminder = this.habit()?.reminderTime;
    return reminder ? reminder.slice(0, 5) : this.i18n.text('No reminder');
  }

  bestStreakLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.habit()?.bestStreak ?? 0)} روز بهترین`
      : `${this.habit()?.bestStreak ?? 0} day best`;
  }

  streakLabel(value: number): string {
    return this.i18n.language() === 'fa' ? `${this.i18n.number(value)} روز` : `${value}d`;
  }

  completedCountLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.completionHistory().length)} روز انجام شده`
      : `${this.completionHistory().length} completed days`;
  }

  rangeLabel(): string {
    const analytics = this.details()?.analytics;
    if (!analytics) return '';
    return `${this.dateOnlyLabel(analytics.from)} - ${this.dateOnlyLabel(analytics.to)}`;
  }

  dateOnlyLabel(value: string): string {
    return this.calendar.formatShortDateKey(value);
  }

  dateTimeLabel(value: string): string {
    return this.i18n.dateTime(value);
  }

  weekdayLabel(value: string): string {
    const date = this.calendar.dateFromKey(value);
    return date ? this.calendar.weekdayLabel(date, true) : '';
  }

  percentLabel(value: number): string {
    return `${this.i18n.number(Math.round(value))}%`;
  }

  daysLabel(value: number): string {
    return this.i18n.language() === 'fa' ? `${this.i18n.number(value)} روز` : `${value} days`;
  }

  isDoneDay(day: HabitDayAnalysisDto): boolean {
    return this.isDoneStatus(day.status);
  }

  isOpenDay(day: HabitDayAnalysisDto): boolean {
    return day.isScheduled && day.date >= this.todayKey && !this.isDoneStatus(day.status);
  }

  isMissedDay(day: HabitDayAnalysisDto): boolean {
    return day.isScheduled && day.date < this.todayKey && !this.isDoneStatus(day.status);
  }

  private async load(showLoading = true): Promise<void> {
    if (!this.habitId) {
      this.loadError.set(this.i18n.text('Habit id is missing.'));
      this.isLoading.set(false);
      return;
    }
    if (showLoading) this.isLoading.set(true);
    this.loadError.set(null);
    try {
      this.details.set(await this.habitsService.getHabitDetails(this.habitId));
    } catch {
      this.loadError.set(this.i18n.text('The habit could not be loaded.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async completeHeldHabit(): Promise<void> {
    if (!this.canCompleteToday()) return;
    this.isSavingCompletion.set(true);
    try {
      await this.habitsService.completeHabit(this.habitId, this.todayKey);
      await this.load(false);
      window.navigator.vibrate?.([50, 50, 50]);
    } finally {
      this.isSavingCompletion.set(false);
      this.cancelHold();
    }
  }

  private isDoneStatus(status: HabitLogStatus | null | undefined): boolean {
    return status === 'Done' || status === 0;
  }

  private dayOfWeekLabel(value: number | string): string {
    const day = typeof value === 'number'
      ? value
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(value);
    const baseSunday = new Date(2026, 5, 7);
    baseSunday.setDate(baseSunday.getDate() + Math.max(day, 0));
    return this.calendar.weekdayLabel(baseSunday, true);
  }
}
