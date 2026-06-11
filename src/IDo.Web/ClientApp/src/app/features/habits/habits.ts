import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CalendarService } from '../../core/calendar.service';
import { I18nService } from '../../core/i18n.service';
import { HabitDto, HabitsService } from '../../core/habits.service';
import { TodayDashboardDto, TodayService } from '../../core/today.service';

type HabitFilter = 'today' | 'all' | 'open' | 'done' | 'rest';

@Component({
  selector: 'app-habits',
  imports: [],
  template: `
    <header class="w-full top-0 sticky bg-theme-bg z-40 py-md">
      <div class="px-margin-mobile flex items-center justify-between">
        <div class="min-w-0">
          <h1 class="text-headline-lg-mobile font-headline-lg-mobile text-on-surface m-0">{{ i18n.text('Habits') }}</h1>
          <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ i18n.text('Build small routines, every day.') }}</p>
        </div>
        <button type="button" (click)="openCreateHabit()" class="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-on-surface hover:opacity-80 active:scale-95 transition-all">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
    </header>

    <div class="px-margin-mobile flex flex-col gap-xl pb-md">
      <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-theme-green/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="flex items-center justify-between gap-lg">
          <div class="min-w-0">
            <h2 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text("Today's Progress") }}</h2>
            <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ completedTodayLabel() }}</p>
            <div class="flex gap-sm mt-md pt-xs items-center">
              <div class="flex flex-col">
                <span class="text-headline-lg-mobile font-headline-lg-mobile text-primary">{{ totalToday() }}</span>
                <span class="text-label-md font-label-md text-on-surface-variant">{{ i18n.text('Total') }}</span>
              </div>
              <div class="w-px h-8 bg-theme-border"></div>
              <div class="flex flex-col">
                <span class="text-headline-lg-mobile font-headline-lg-mobile text-secondary">{{ doneToday() }}</span>
                <span class="text-label-md font-label-md text-on-surface-variant">{{ i18n.text('Done') }}</span>
              </div>
              <div class="w-px h-8 bg-theme-border"></div>
              <div class="flex flex-col">
                <span class="text-headline-lg-mobile font-headline-lg-mobile text-primary">{{ leftToday() }}</span>
                <span class="text-label-md font-label-md text-on-surface-variant">{{ i18n.text('Left') }}</span>
              </div>
            </div>
          </div>

          <div class="relative w-20 h-20 rounded-full flex items-center justify-center shrink-0" [style.background]="progressRing()">
            <div class="absolute w-[80%] h-[80%] bg-theme-surface rounded-full"></div>
            <span class="relative z-10 text-headline-md font-headline-md text-on-surface">{{ donePercentage() }}%</span>
          </div>
        </div>
      </section>

      <section class="flex gap-sm overflow-x-auto snap-x hide-scrollbar -mx-margin-mobile px-margin-mobile">
        <div class="snap-start shrink-0 min-w-[132px] bg-theme-surface border border-theme-border rounded-2xl p-md flex flex-col gap-xs">
          <div class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-theme-orange text-[20px]" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
            <span class="text-label-md font-label-md text-on-surface-variant">{{ i18n.text('Best Streak') }}</span>
          </div>
          <div class="text-headline-md font-headline-md text-on-surface mt-1">{{ bestStreakLabel() }}</div>
        </div>

        <div class="snap-start shrink-0 min-w-[132px] bg-theme-surface border border-theme-border rounded-2xl p-md flex flex-col gap-xs">
          <div class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-secondary text-[20px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
            <span class="text-label-md font-label-md text-on-surface-variant">{{ i18n.text('Active') }}</span>
          </div>
          <div class="text-headline-md font-headline-md text-on-surface mt-1">{{ activeHabits() }}</div>
        </div>

        <div class="snap-start shrink-0 min-w-[132px] bg-theme-surface border border-theme-border rounded-2xl p-md flex flex-col gap-xs">
          <div class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-primary text-[20px]" style="font-variation-settings: 'FILL' 1;">insert_chart</span>
            <span class="text-label-md font-label-md text-on-surface-variant">{{ i18n.text('Success') }}</span>
          </div>
          <div class="text-headline-md font-headline-md text-on-surface mt-1">{{ donePercentage() }}%</div>
        </div>
      </section>

      <section class="flex flex-col gap-sm">
        <h3 class="text-[28px] leading-[34px] font-semibold text-on-surface m-0">{{ i18n.text('Weekly Plan') }}</h3>
        <div class="grid grid-cols-7 items-center gap-xs bg-[#111827] rounded-[32px] px-md py-lg border border-[#2d3a56] min-h-[132px] shadow-[0_12px_34px_rgba(0,0,0,0.22)]">
          @for (day of weeklyPlan(); track day.key) {
            <div
              class="min-w-0 flex flex-col items-center justify-center gap-sm"
              [class.h-[124px]]="day.isToday"
              [class.-my-md]="day.isToday"
              [class.rounded-full]="day.isToday"
              [class.bg-theme-bg\/20]="day.isToday"
              [class.border]="day.isToday"
              [class.border-theme-border]="day.isToday">
              <span
                class="text-headline-md font-headline-md leading-none"
                [class.text-on-surface]="day.isToday"
                [class.text-on-surface-variant]="!day.isToday && day.state === 'future'"
                [class.text-white\/80]="!day.isToday && day.state !== 'future'">
                {{ day.label }}
              </span>

              <div class="relative w-12 h-12 rounded-full flex items-center justify-center"
                [class.bg-secondary-container]="day.state === 'complete'"
                [class.text-secondary]="day.state === 'complete'"
                [class.bg-theme-orange\/20]="day.state === 'partial'"
                [class.text-theme-orange]="day.state === 'partial'"
                [class.bg-error-container\/35]="day.state === 'empty'"
                [class.text-error]="day.state === 'empty'"
                [class.bg-surface-container-highest]="day.state === 'future'"
                [class.text-on-surface-variant]="day.state === 'future'"
                [class.bg-transparent]="day.isToday"
                [class.border-2]="day.state === 'future'"
                [class.border-theme-border]="day.state === 'future'">
                @if (day.isToday) {
                  <div class="absolute inset-0 rounded-full border-[3px] border-dashed border-primary/80"></div>
                  <div class="w-7 h-7 rounded-full border-[3px] border-primary flex items-center justify-center">
                    @if (day.total > 0 && day.done === day.total) {
                      <span class="material-symbols-outlined text-secondary text-[16px]" style="font-variation-settings: 'FILL' 1;">check</span>
                    } @else {
                      <span class="w-3 h-3 rounded-full bg-primary"></span>
                    }
                  </div>
                } @else if (day.state === 'complete') {
                  <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">check</span>
                } @else if (day.state === 'partial') {
                  <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">priority_high</span>
                } @else if (day.state === 'empty') {
                  <span class="material-symbols-outlined text-[21px]" style="font-variation-settings: 'FILL' 1;">close</span>
                } @else if (day.total > 0) {
                  <span class="w-4 h-4 rounded-full bg-primary/80"></span>
                } @else {
                  <span class="material-symbols-outlined text-[24px]">bedtime</span>
                }
              </div>

              <div
                class="h-5 min-w-9 px-2 rounded-full flex items-center justify-center text-[10px] leading-none font-semibold"
                [class.bg-primary\/15]="day.isToday"
                [class.text-primary]="day.isToday"
                [class.bg-white\/5]="!day.isToday"
                [class.text-on-surface-variant]="!day.isToday">
                @if (day.total > 0) {
                  {{ day.done }}/{{ day.total }}
                } @else {
                  0
                }
              </div>
            </div>
          }
        </div>
      </section>

      <section class="flex flex-col gap-md">
        <div class="flex items-center justify-between gap-md">
          <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Habit List') }}</h3>
          <span class="text-label-md font-label-md text-on-surface-variant">{{ shownLabel(filteredHabits().length) }}</span>
        </div>

        <div class="flex gap-sm overflow-x-auto hide-scrollbar pb-xs -mx-margin-mobile px-margin-mobile">
          @for (item of filters; track item.value) {
            <button
              type="button"
              (click)="filter.set(item.value)"
              class="shrink-0 px-md py-2 rounded-full border text-label-md font-label-md transition-colors"
              [class.bg-secondary-container]="filter() === item.value"
              [class.text-on-secondary-container]="filter() === item.value"
              [class.border-secondary-container]="filter() === item.value"
              [class.bg-theme-surface]="filter() !== item.value"
              [class.text-on-surface-variant]="filter() !== item.value"
              [class.border-theme-border]="filter() !== item.value">
              {{ i18n.text(item.label) }} {{ filterCount(item.value) }}
            </button>
          }
        </div>

        @if (error()) {
          <div class="rounded-2xl border border-error/40 bg-error-container/30 text-on-error-container px-md py-sm text-body-md font-body-md">
            {{ error() }}
          </div>
        }

        <div class="flex flex-col gap-sm">
          @if (isLoading()) {
            @for (item of [1, 2, 3]; track item) {
              <div class="h-[78px] rounded-2xl bg-theme-surface border border-theme-border animate-pulse"></div>
            }
          } @else {
            @for (habit of filteredHabits(); track habit.id) {
              <div
                role="link"
                tabindex="0"
                (click)="openHabitDetails(habit.id)"
                (keydown.enter)="openHabitDetails(habit.id)"
                class="bg-theme-surface border border-theme-border rounded-2xl p-md flex items-center justify-between gap-md transition-all active:scale-[0.98] cursor-pointer hover:bg-surface-container-high"
                [class.border-secondary]="habit.isCompletedToday"
                [class.opacity-55]="habit.isRestToday">
                <div class="flex items-center gap-md min-w-0">
                  <button
                    type="button"
                    (click)="suppressHabitAction($event)"
                    (touchstart)="startHabitHold($event, habit)" (touchend)="cancelHabitHold()" (touchcancel)="cancelHabitHold()"
                    (mousedown)="startHabitHold($event, habit)" (mouseup)="cancelHabitHold()" (mouseleave)="cancelHabitHold()"
                    [attr.aria-label]="habit.isCompletedToday ? habit.title + ' completed' : habit.isRestToday ? habit.title + ' rest day' : 'Complete ' + habit.title"
                    [disabled]="habit.isCompletedToday || habit.isRestToday || completingId() === habit.id"
                    class="habit-check w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all disabled:cursor-default"
                    [class.bg-secondary]="habit.isCompletedToday"
                    [class.text-on-secondary]="habit.isCompletedToday"
                    [class.border-secondary]="habit.isCompletedToday"
                    [class.bg-surface-container-high]="habit.isRestToday"
                    [class.border-theme-border]="!habit.isCompletedToday"
                    [class.text-on-surface-variant]="habit.isRestToday"
                    [class.habit-check-active]="holdingHabitId() === habit.id">
                    @if (!habit.isCompletedToday && !habit.isRestToday) {
                      <span class="habit-check-fill" [class.habit-check-fill-active]="holdingHabitId() === habit.id"></span>
                    }
                    @if (habit.isCompletedToday) {
                      <span class="material-symbols-outlined text-[17px] z-10" style="font-variation-settings: 'FILL' 1;">check</span>
                    } @else if (habit.isRestToday) {
                      <span class="material-symbols-outlined text-[16px] z-10">bedtime</span>
                    } @else if (completingId() === habit.id) {
                      <span class="material-symbols-outlined text-[16px] animate-spin z-10">progress_activity</span>
                    }
                  </button>

                  <div class="min-w-0">
                    <h4 class="text-body-lg font-body-lg text-on-surface m-0 leading-tight truncate" [class.line-through]="habit.isCompletedToday">{{ habit.title }}</h4>
                    <div class="flex items-center gap-sm mt-1 min-w-0">
                      <span class="text-label-md font-label-md text-on-surface-variant truncate">{{ habitSubtitle(habit) }}</span>
                      <span class="w-1 h-1 rounded-full bg-theme-border shrink-0"></span>
                      <div class="flex items-center gap-1 text-theme-orange shrink-0">
                        <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
                        <span class="text-label-md font-label-md leading-none">{{ habit.currentStreak }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="min-w-12 h-8 px-sm rounded-full bg-theme-habit-bg text-theme-habit-accent flex items-center justify-center gap-1 shrink-0">
                  <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
                  <span class="text-label-md font-label-md font-bold leading-none">{{ habitStreakLabel(habit.currentStreak) }}</span>
                </div>
              </div>
            } @empty {
              <div class="bg-theme-surface rounded-2xl border border-theme-border p-lg text-center text-on-surface-variant">
                {{ i18n.text('No habits match this view.') }}
              </div>
            }
          }
        </div>
      </section>

      <div class="bg-secondary-container/10 border border-secondary/20 rounded-2xl p-md flex items-start gap-md">
        <span class="material-symbols-outlined text-secondary shrink-0" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
        <div>
          <h4 class="text-body-md font-body-md text-on-surface font-semibold m-0 leading-tight">{{ i18n.text('Small wins compound.') }}</h4>
          <p class="text-label-md font-label-md text-on-surface-variant mt-1 m-0">{{ i18n.text('Do one honest rep today and make tomorrow easier to start.') }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .habit-check { position: relative; overflow: hidden; }
    .habit-check-fill { position: absolute; inset: 0 auto 0 0; width: 0%; height: 100%; background: var(--color-secondary); opacity: 0.28; transition: width 180ms ease-out; }
    .habit-check-fill-active { width: 100%; transition: width 2000ms linear; }
    .habit-check-active { border-color: var(--color-secondary); }
  `]
})
export class HabitsComponent implements OnDestroy {
  private readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);
  private readonly habitsService = inject(HabitsService);
  private readonly todayService = inject(TodayService);
  private readonly router = inject(Router);
  private readonly today = new Date();
  private readonly todayKey = this.calendar.todayKey();
  private readonly habitCreatedHandler = () => void this.load();
  private readonly habitHoldDuration = 2000;
  private habitHoldTimer?: ReturnType<typeof setTimeout>;

  readonly habits = signal<HabitDto[]>([]);
  readonly dashboard = signal<TodayDashboardDto | null>(null);
  readonly weeklyDashboards = signal<Record<string, TodayDashboardDto>>({});
  readonly isLoading = signal(true);
  readonly filter = signal<HabitFilter>('today');
  readonly completingId = signal<string | null>(null);
  readonly holdingHabitId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly filters: { value: HabitFilter; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'done', label: 'Done' },
    { value: 'rest', label: 'Rest' }
  ];
  readonly currentWeek = computed(() => this.buildCurrentWeek(this.today));
  readonly weekDays = computed(() => this.calendar.calendarType() === 'Jalali' || this.i18n.language() === 'fa'
    ? [
        { value: 6, label: 'ش' },
        { value: 0, label: 'ی' },
        { value: 1, label: 'د' },
        { value: 2, label: 'س' },
        { value: 3, label: 'چ' },
        { value: 4, label: 'پ' },
        { value: 5, label: 'ج' }
      ]
    : [
        { value: 1, label: 'M' },
        { value: 2, label: 'T' },
        { value: 3, label: 'W' },
        { value: 4, label: 'T' },
        { value: 5, label: 'F' },
        { value: 6, label: 'S' },
        { value: 0, label: 'S' }
      ]);
  readonly todayHabitMap = computed(() => new Map((this.dashboard()?.todayHabits ?? []).map(habit => [habit.id, habit])));
  readonly habitViews = computed(() => this.habits().map(habit => this.toHabitView(habit)));
  readonly filteredHabits = computed(() => {
    const views = this.habitViews();
    switch (this.filter()) {
      case 'all':
        return views;
      case 'open':
        return views.filter(habit => habit.isActiveToday && !habit.isCompletedToday);
      case 'done':
        return views.filter(habit => habit.isCompletedToday);
      case 'rest':
        return views.filter(habit => habit.isRestToday);
      case 'today':
        return views.filter(habit => habit.isActiveToday);
    }
  });
  readonly totalToday = computed(() => this.dashboard()?.summary.habitCount ?? this.habitViews().filter(habit => habit.isActiveToday).length);
  readonly doneToday = computed(() => this.dashboard()?.summary.habitDoneCount ?? this.habitViews().filter(habit => habit.isCompletedToday).length);
  readonly leftToday = computed(() => Math.max(0, this.totalToday() - this.doneToday()));
  readonly donePercentage = computed(() => this.totalToday() === 0 ? 0 : Math.round(this.doneToday() * 100 / this.totalToday()));
  readonly progressRing = computed(() => `conic-gradient(var(--color-secondary) ${this.donePercentage()}%, var(--color-theme-border) 0)`);
  readonly bestStreak = computed(() => Math.max(0, ...this.habits().map(habit => habit.bestStreak)));
  readonly activeHabits = computed(() => this.habits().filter(habit => habit.isActive).length);
  readonly weeklyPlan = computed<WeeklyPlanDay[]>(() => this.currentWeek().map(day => {
    const dashboard = this.weeklyDashboards()[day.key];
    const total = dashboard?.summary.habitCount ?? this.habits().filter(habit => this.isHabitActiveOn(habit, day.value)).length;
    const done = dashboard?.summary.habitDoneCount ?? 0;
    return {
      ...day,
      total,
      done,
      state: this.weekDayState(day, total, done)
    };
  }));

  constructor() {
    window.addEventListener('ido:habit-created', this.habitCreatedHandler);
    void this.load();
  }

  ngOnDestroy(): void {
    window.removeEventListener('ido:habit-created', this.habitCreatedHandler);
    this.cancelHabitHold();
  }

  openCreateHabit(): void {
    window.dispatchEvent(new CustomEvent('ido:open-create-modal', { detail: { mode: 'habit' } }));
  }

  openHabitDetails(id: string): void {
    void this.router.navigate(['/habit', id]);
  }

  startHabitHold(event: Event, habit: HabitView): void {
    event.preventDefault();
    event.stopPropagation();
    if (habit.isCompletedToday || habit.isRestToday || this.completingId() || this.holdingHabitId()) return;
    window.navigator.vibrate?.(50);
    this.holdingHabitId.set(habit.id);
    this.habitHoldTimer = setTimeout(() => void this.completeHabit(habit), this.habitHoldDuration);
  }

  cancelHabitHold(): void {
    if (this.habitHoldTimer) clearTimeout(this.habitHoldTimer);
    this.habitHoldTimer = undefined;
    this.holdingHabitId.set(null);
  }

  suppressHabitAction(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  async completeHabit(habit: HabitView): Promise<void> {
    if (habit.isCompletedToday || habit.isRestToday || this.completingId()) return;
    this.completingId.set(habit.id);
    this.error.set(null);

    try {
      await this.habitsService.completeHabit(habit.id, this.todayKey);
      await this.load(false);
    } catch (error) {
      this.error.set(this.messageFromError(error, this.i18n.text('Could not complete habit.')));
    } finally {
      this.completingId.set(null);
      this.cancelHabitHold();
    }
  }

  habitSubtitle(habit: HabitView): string {
    if (habit.isCompletedToday) return this.i18n.text('Completed today');
    if (habit.isRestToday) return this.i18n.text('Rest day');
    if (habit.reminderTime) return this.i18n.language() === 'fa' ? `یادآور ${habit.reminderTime.slice(0, 5)}` : `Reminder ${habit.reminderTime.slice(0, 5)}`;
    return this.activeDayLabel(habit);
  }

  completedTodayLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.doneToday())} از ${this.i18n.number(this.totalToday())} تکمیل شده`
      : `${this.doneToday()} of ${this.totalToday()} completed`;
  }

  bestStreakLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.bestStreak())} روز`
      : `${this.bestStreak()} Days`;
  }

  habitStreakLabel(value: number): string {
    return this.i18n.language() === 'fa' ? this.i18n.number(value) : `${value}`;
  }

  shownLabel(count: number): string {
    return this.i18n.language() === 'fa' ? `${this.i18n.number(count)} نمایش` : `${count} shown`;
  }

  filterCount(filter: HabitFilter): number {
    const views = this.habitViews();
    switch (filter) {
      case 'all':
        return views.length;
      case 'open':
        return views.filter(habit => habit.isActiveToday && !habit.isCompletedToday).length;
      case 'done':
        return views.filter(habit => habit.isCompletedToday).length;
      case 'rest':
        return views.filter(habit => habit.isRestToday).length;
      case 'today':
        return views.filter(habit => habit.isActiveToday).length;
    }
  }

  private async load(showLoading = true): Promise<void> {
    if (showLoading) this.isLoading.set(true);
    this.error.set(null);

    try {
      const [habits, dashboard, weeklyDashboards] = await Promise.all([
        this.habitsService.getHabits(),
        this.todayService.getToday(this.todayKey),
        this.loadWeeklyDashboards()
      ]);
      this.habits.set(habits);
      this.dashboard.set(dashboard);
      this.weeklyDashboards.set(weeklyDashboards);
    } catch (error) {
      this.error.set(this.messageFromError(error, this.i18n.text('Could not load habits.')));
    } finally {
      this.isLoading.set(false);
    }
  }

  private toHabitView(habit: HabitDto): HabitView {
    const todayHabit = this.todayHabitMap().get(habit.id);
    const isActiveToday = this.isHabitActiveOn(habit, this.today.getDay()) || todayHabit !== undefined;
    return {
      ...habit,
      isActiveToday,
      isCompletedToday: todayHabit?.isCompletedToday ?? false,
      isRestToday: !isActiveToday
    };
  }

  private isHabitActiveOn(habit: HabitDto, day: number): boolean {
    if (!habit.isActive) return false;
    if (habit.requiredTimesPerWeek !== null && habit.requiredTimesPerWeek > 0) return true;
    return habit.activeDays.includes(day);
  }

  private activeDayLabel(habit: HabitDto): string {
    const activeDays = this.weekDays().filter(day => habit.activeDays.includes(day.value)).map(day => day.label);
    if (activeDays.length === 7) return this.i18n.text('Every day');
    if (activeDays.length === 0) return this.i18n.text('No active days');
    return activeDays.join(' ');
  }

  private async loadWeeklyDashboards(): Promise<Record<string, TodayDashboardDto>> {
    const entries = await Promise.all(this.currentWeek().map(async day => [day.key, await this.todayService.getToday(day.key)] as const));
    return Object.fromEntries(entries);
  }

  private buildCurrentWeek(date: Date): WeekDay[] {
    const weekStart = this.calendar.startOfWeek(date);

    return Array.from({ length: 7 }, (_, index) => {
      const item = new Date(weekStart);
      item.setDate(weekStart.getDate() + index);
      const key = this.calendar.formatDateKey(item);
      return {
        key,
        value: item.getDay(),
        label: this.calendar.weekdayLabel(item, true),
        isToday: key === this.todayKey,
        isPast: key < this.todayKey,
        isFuture: key > this.todayKey
      };
    });
  }

  private weekDayState(day: WeekDay, total: number, done: number): WeeklyPlanState {
    if (day.isToday) return 'today';
    if (day.isFuture) return 'future';
    if (total === 0) return 'empty';
    if (done >= total) return 'complete';
    return 'partial';
  }

  private messageFromError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { errors?: string[]; error?: string } | null;
      if (Array.isArray(body?.errors) && body.errors.length > 0) return body.errors.join(' ');
      if (body?.error) return body.error;
    }

    return fallback;
  }

}

interface HabitView extends HabitDto {
  isActiveToday: boolean;
  isCompletedToday: boolean;
  isRestToday: boolean;
}

type WeeklyPlanState = 'today' | 'complete' | 'partial' | 'empty' | 'future';

interface WeekDay {
  key: string;
  value: number;
  label: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

interface WeeklyPlanDay extends WeekDay {
  total: number;
  done: number;
  state: WeeklyPlanState;
}
