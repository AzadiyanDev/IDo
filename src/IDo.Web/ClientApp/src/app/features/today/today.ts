import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CalendarService } from '../../core/calendar.service';
import { HabitsService } from '../../core/habits.service';
import { I18nService } from '../../core/i18n.service';
import { TaskDto, TodayDashboardDto, TodayHabitDto, TodayProjectDto, TodayService } from '../../core/today.service';
import { HorizontalDateStripComponent } from '../../shared/calendar/horizontal-date-strip';
import { SlideAlertComponent } from '../../shared/slide-alert/slide-alert';

@Component({
  selector: 'app-today',
  imports: [RouterLink, SlideAlertComponent, HorizontalDateStripComponent],
  template: `
    <header class="w-full top-0 sticky bg-theme-bg z-40 py-md">
      <div class="flex justify-between items-center px-margin-mobile w-full">
        <a routerLink="/profile" class="flex items-center gap-md min-w-0 no-underline text-inherit rounded-2xl -my-md py-md pr-sm hover:bg-theme-surface transition-colors">
          <div class="w-10 h-10 rounded-full overflow-hidden border border-theme-border flex-shrink-0 bg-theme-surface flex items-center justify-center">
            @if (avatarUrl()) {
              <img [src]="avatarUrl()" [alt]="displayName()" class="w-full h-full object-cover"/>
            } @else {
              <span class="text-body-md font-body-md font-semibold text-primary">{{ initials() }}</span>
            }
          </div>
          <div class="min-w-0">
            <h1 class="text-headline-lg-mobile font-headline-lg-mobile text-primary leading-tight truncate">{{ displayName() }}</h1>
            <p class="text-body-md font-body-md text-on-surface-variant leading-tight">{{ planReadyLabel() }}</p>
          </div>
        </a>
        <button type="button" (click)="toggleNotifications()" class="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity flex-shrink-0 relative">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">notifications</span>
          @if (pendingRequestCount() > 0) {
            <span class="absolute top-2 end-2 w-2 h-2 bg-theme-teal rounded-full"></span>
          }
        </button>
      </div>

      @if (isNotificationsOpen()) {
        <section class="absolute top-[68px] right-margin-mobile left-margin-mobile bg-theme-surface border border-theme-border rounded-2xl p-md shadow-[0_18px_50px_rgba(0,0,0,.35)] flex flex-col gap-sm">
          <div class="flex items-center justify-between gap-md">
            <div>
              <p class="text-headline-md font-headline-md text-on-surface m-0">{{ inviteCountLabel() }}</p>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ i18n.text('Requests waiting in your inbox') }}</p>
            </div>
            <a routerLink="/inbox" class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center no-underline">
              <span class="material-symbols-outlined text-[20px]">inbox</span>
            </a>
          </div>
          <div class="flex flex-col gap-xs">
            @for (request of notificationRequests(); track request.id) {
              <a routerLink="/inbox" class="bg-surface-container-lowest rounded-xl px-sm py-xs flex items-center gap-sm no-underline text-inherit">
                <span class="material-symbols-outlined text-theme-blue text-[18px]">{{ requestIcon(request) }}</span>
                <span class="text-body-md font-body-md text-on-surface truncate">{{ request.title }}</span>
              </a>
            } @empty {
              <div class="bg-surface-container-lowest rounded-xl px-sm py-xs text-body-md font-body-md text-on-surface-variant">
                {{ i18n.text('No pending requests.') }}
              </div>
            }
          </div>
          <a routerLink="/inbox" class="w-full min-h-11 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center gap-xs no-underline text-body-md font-body-md font-semibold">
            {{ i18n.text('Open inbox') }}
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </a>
        </section>
      }
    </header>

    <app-slide-alert
      [open]="pendingRequestCount() > 0"
      [title]="i18n.text('Task request pending')"
      [message]="requestWaitingLabel()"
      [actionText]="i18n.text('Review')"
      (actionClicked)="openInboxFromAlert()"
    />

    <div class="px-margin-mobile flex flex-col gap-xl">
      <section>
        <app-horizontal-date-strip [selectedDate]="selectedDate()" (selectedDateChange)="selectDate($event)" />
      </section>

      <section class="bg-theme-surface rounded-2xl border border-theme-border p-lg flex items-center justify-between relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-theme-teal opacity-5 rounded-full blur-2xl"></div>

        <div class="flex flex-col gap-xs z-10 min-w-0">
          <h2 class="text-headline-md font-headline-md text-on-surface m-0 leading-snug">
            <bdi class="block">{{ selectedDateTitle() }}</bdi>
          </h2>
          <p class="text-body-md font-body-md text-on-surface-variant m-0">{{ itemsForDayLabel() }}</p>
          <div class="flex flex-wrap gap-sm mt-md">
            @for (item of categorySummary(); track item.key) {
              <div class="flex items-center gap-xs">
                <span class="w-2 h-2 rounded-full" [style.background]="item.color"></span>
                <span class="text-label-md font-label-md text-on-surface-variant">{{ item.count }} {{ item.label }}</span>
              </div>
            }
          </div>
        </div>

        <div class="w-24 h-24 relative z-10 shrink-0">
          <svg class="block mx-auto w-24 h-24 -rotate-90" viewBox="0 0 42 42">
            <circle class="fill-none stroke-theme-border" cx="21" cy="21" r="16" stroke-width="4" pathLength="100"></circle>
            @for (segment of progressSegments(); track segment.key) {
              <circle
                class="fill-none transition-all duration-500"
                cx="21"
                cy="21"
                r="16"
                stroke-width="4"
                pathLength="100"
                stroke-linecap="round"
                [attr.stroke]="segment.color"
                [attr.stroke-dasharray]="segment.dashArray"
                [attr.stroke-dashoffset]="segment.dashOffset">
              </circle>
            }
          </svg>
          <div class="absolute inset-0 flex items-center justify-center flex-col">
            <span class="text-headline-md font-headline-md font-bold leading-none">{{ donePercentage() }}%</span>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-md">
        <div class="flex justify-between items-center">
          <h3 class="text-headline-md font-headline-md text-on-surface m-0">
            <bdi class="block">{{ taskSectionTitle() }}</bdi>
          </h3>
          <a routerLink="/tasks" class="text-primary-container text-body-md font-body-md no-underline hover:underline">{{ i18n.text('See All') }}</a>
        </div>

        <div class="flex flex-col gap-sm">
          @for (task of visibleTasks(); track task.id) {
            <a [routerLink]="['/task', task.id]" class="bg-theme-surface rounded-2xl border border-theme-border p-md flex items-center gap-md cursor-pointer hover:bg-surface-container-high transition-colors no-underline text-inherit">
              <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                [class.border-primary-container]="isTaskDone(task)"
                [class.bg-primary-container]="isTaskDone(task)"
                [class.border-theme-border]="!isTaskDone(task)">
                @if (isTaskDone(task)) {
                  <span class="material-symbols-outlined text-[14px] text-theme-bg font-bold" style="font-variation-settings: 'FILL' 1;">check</span>
                }
              </div>
              <div class="flex flex-col flex-1 min-w-0 pl-1">
                <span class="text-body-lg font-body-lg text-on-surface font-medium truncate" [class.line-through]="isTaskDone(task)">{{ task.title }}</span>
                <span class="text-label-md font-label-md text-primary-container mt-0.5">{{ taskTimeLabel(task) }}</span>
              </div>
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                [class.bg-theme-project-bg]="isProjectTask(task)"
                [class.text-theme-purple]="isProjectTask(task)"
                [class.bg-surface-container-high]="!isProjectTask(task)"
                [class.text-primary]="!isProjectTask(task)">
                <span class="material-symbols-outlined text-[18px]">{{ isProjectTask(task) ? 'assignment' : 'checklist' }}</span>
              </div>
            </a>
          } @empty {
            <div class="bg-theme-surface rounded-2xl border border-theme-border p-lg text-center text-on-surface-variant">
              {{ i18n.text('No tasks for this day.') }}
            </div>
          }
        </div>
      </section>

      <section class="flex flex-col gap-md">
        <div class="flex justify-between items-center">
          <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Habits') }}</h3>
          <a routerLink="/habits" class="text-primary-container text-body-md font-body-md no-underline hover:underline">{{ i18n.text('See All') }}</a>
        </div>

        @if (habitError()) {
          <div class="rounded-2xl border border-error/40 bg-error-container/30 text-on-error-container px-md py-sm text-body-md font-body-md">
            {{ habitError() }}
          </div>
        }

        <div class="flex flex-col gap-sm">
          @for (habit of dashboard()?.todayHabits ?? []; track habit.id) {
            <div
              role="link"
              tabindex="0"
              (click)="openHabitDetails(habit.id)"
              (keydown.enter)="openHabitDetails(habit.id)"
              class="bg-theme-surface rounded-2xl border border-theme-border p-md flex items-center gap-md cursor-pointer hover:bg-surface-container-high transition-colors"
              [class.border-secondary]="habit.isCompletedToday">
              <button
                type="button"
                (click)="suppressHabitAction($event)"
                (touchstart)="startHabitHold($event, habit)" (touchend)="cancelHabitHold()" (touchcancel)="cancelHabitHold()"
                (mousedown)="startHabitHold($event, habit)" (mouseup)="cancelHabitHold()" (mouseleave)="cancelHabitHold()"
                [disabled]="habit.isCompletedToday || completingHabitId() === habit.id"
                class="habit-check w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all disabled:cursor-default"
                [class.border-secondary]="habit.isCompletedToday"
                [class.bg-secondary]="habit.isCompletedToday"
                [class.text-on-secondary]="habit.isCompletedToday"
                [class.border-theme-border]="!habit.isCompletedToday"
                [class.habit-check-active]="holdingHabitId() === habit.id">
                @if (!habit.isCompletedToday) {
                  <span class="habit-check-fill" [class.habit-check-fill-active]="holdingHabitId() === habit.id"></span>
                }
                @if (habit.isCompletedToday) {
                  <span class="material-symbols-outlined text-[14px] font-bold z-10" style="font-variation-settings: 'FILL' 1;">check</span>
                } @else if (completingHabitId() === habit.id) {
                  <span class="material-symbols-outlined text-[14px] animate-spin z-10">progress_activity</span>
                }
              </button>

              <div class="flex flex-col flex-1 min-w-0 pl-1">
                <span class="text-body-lg font-body-lg text-on-surface font-medium truncate" [class.line-through]="habit.isCompletedToday">{{ habit.title }}</span>
                <span class="text-label-md font-label-md text-primary-container mt-0.5">{{ habitRowSubtitle(habit) }}</span>
              </div>

              <div class="min-w-12 h-8 px-sm rounded-full bg-theme-habit-bg text-theme-habit-accent flex items-center justify-center gap-1 shrink-0">
                <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
                <span class="text-label-md font-label-md font-bold leading-none">{{ habitStreakLabel(habit.currentStreak) }}</span>
              </div>
            </div>
          } @empty {
            <div class="bg-theme-surface rounded-2xl border border-theme-border p-lg text-center text-on-surface-variant">
              {{ i18n.text('No habits today.') }}
            </div>
          }
        </div>
      </section>

      <section class="flex flex-col gap-md">
        <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Projects') }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-sm">
          @for (project of dashboard()?.activeProjects ?? []; track project.project.id) {
            <a [routerLink]="['/project', project.project.id]" class="bg-theme-project-bg rounded-2xl p-md flex flex-col gap-sm border border-theme-project-accent/20 relative overflow-hidden no-underline">
              <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-theme-project-accent opacity-5 rounded-full blur-xl"></div>
              <div class="flex justify-between items-start z-10 w-full">
                <span class="px-2 py-1 bg-theme-project-accent/20 text-theme-project-accent text-label-md font-label-md rounded-full">{{ projectDoneLabel(project) }}</span>
                <span class="material-symbols-outlined text-theme-project-accent">chevron_right</span>
              </div>
              <div class="z-10 mt-1">
                <h4 class="text-body-lg font-body-lg text-white font-medium m-0">{{ project.project.title }}</h4>
                <p class="text-body-md font-body-md text-white/60 flex items-center gap-2 mt-1 mb-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-theme-project-accent inline-block"></span> {{ projectTasksTodayLabel(project) }}
                </p>
              </div>
            </a>
          } @empty {
            <div class="bg-theme-surface rounded-2xl border border-theme-border p-md text-on-surface-variant">
              {{ i18n.text('No active project tasks today.') }}
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .habit-check { position: relative; overflow: hidden; }
    .habit-check-fill { position: absolute; inset: 0 auto 0 0; width: 0%; height: 100%; background: var(--color-secondary); opacity: 0.28; transition: width 180ms ease-out; }
    .habit-check-fill-active { width: 100%; transition: width 2000ms linear; }
    .habit-check-active { border-color: var(--color-secondary); }
  `]
})
export class TodayComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);
  private readonly todayService = inject(TodayService);
  private readonly habitsService = inject(HabitsService);
  private readonly router = inject(Router);
  private readonly taskCreatedHandler = (event: Event) => void this.handleTaskCreated(event);
  private readonly habitHoldDuration = 2000;
  private habitHoldTimer?: ReturnType<typeof setTimeout>;

  readonly dashboard = signal<TodayDashboardDto | null>(null);
  readonly isLoading = signal(true);
  readonly isNotificationsOpen = signal(false);
  readonly completingHabitId = signal<string | null>(null);
  readonly holdingHabitId = signal<string | null>(null);
  readonly habitError = signal<string | null>(null);
  readonly selectedDate = signal(this.calendar.todayKey());
  readonly currentUser = this.auth.currentUser;
  readonly displayName = computed(() => {
    const user = this.currentUser();
    return user?.profile.fullName?.trim() || user?.userName || this.i18n.text('there');
  });
  readonly avatarUrl = computed(() => this.currentUser()?.profile.avatarUrl?.trim() || null);
  readonly initials = computed(() => this.displayName()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'U');
  readonly todayTasks = computed(() => [...(this.dashboard()?.personalTasks ?? []), ...(this.dashboard()?.projectTasks ?? [])]);
  readonly visibleTasks = computed(() => this.todayTasks());
  readonly selectedDateTitle = computed(() => this.selectedDate() === this.calendar.todayKey() ? this.i18n.text('Today') : this.calendar.formatLongDateKey(this.selectedDate()));
  readonly selectedDateIntro = computed(() => this.selectedDate() === this.calendar.todayKey() ? this.i18n.text('today') : this.calendar.formatShortDateKey(this.selectedDate()));
  readonly taskSectionTitle = computed(() => this.selectedDate() === this.calendar.todayKey()
    ? this.i18n.text("Today's Tasks")
    : this.i18n.language() === 'fa' ? `تسک‌های ${this.calendar.formatShortDateKey(this.selectedDate())}` : `Tasks for ${this.calendar.formatShortDateKey(this.selectedDate())}`);
  readonly totalItems = computed(() => {
    const summary = this.dashboard()?.summary;
    return summary ? summary.personalTaskCount + summary.habitCount + summary.projectTaskCount : 0;
  });
  readonly donePercentage = computed(() => Math.round(this.dashboard()?.summary.donePercentage ?? 0));
  readonly pendingRequestCount = computed(() => this.dashboard()?.summary.pendingRequestCount ?? 0);
  readonly notificationRequests = computed(() => (this.dashboard()?.pendingTaskRequests ?? []).slice(0, 3));
  readonly categorySummary = computed(() => {
    const summary = this.dashboard()?.summary;
    return [
      { key: 'todo', label: this.i18n.text('Todos'), count: summary?.personalTaskCount ?? 0, done: summary?.personalTaskDoneCount ?? 0, color: '#3EAEFF' },
      { key: 'habit', label: this.i18n.text('Habits'), count: summary?.habitCount ?? 0, done: summary?.habitDoneCount ?? 0, color: '#00F4B9' },
      { key: 'project', label: this.i18n.text('Projects'), count: summary?.projectTaskCount ?? 0, done: summary?.projectTaskDoneCount ?? 0, color: '#B072FF' }
    ];
  });
  readonly progressSegments = computed(() => {
    const total = this.totalItems();
    let offset = 0;
    return this.categorySummary()
      .map(item => {
        const length = total === 0 ? 0 : item.done * 100 / total;
        const segment = {
          key: item.key,
          color: item.color,
          dashArray: `${length} ${100 - length}`,
          dashOffset: -offset
        };
        offset += length;
        return segment;
      })
      .filter(segment => !segment.dashArray.startsWith('0 '));
  });

  constructor() {
    window.addEventListener('ido:task-created', this.taskCreatedHandler);
    void this.loadToday();
  }

  ngOnDestroy(): void {
    window.removeEventListener('ido:task-created', this.taskCreatedHandler);
    this.cancelHabitHold();
  }

  taskTimeLabel(task: TaskDto): string {
    if (task.dueTime) return task.dueTime.slice(0, 5);
    if (this.isTaskDone(task)) return this.i18n.text('Done');
    return this.isProjectTask(task) ? this.i18n.text('Project task') : this.i18n.text('Todo');
  }

  planReadyLabel(): string {
    return this.i18n.language() === 'fa'
      ? `برنامه ${this.selectedDateIntro()} آماده است`
      : `Your plan for ${this.selectedDateIntro()} is ready`;
  }

  inviteCountLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.pendingRequestCount())} دعوت`
      : `${this.pendingRequestCount()} invite${this.pendingRequestCount() === 1 ? '' : 's'}`;
  }

  requestWaitingLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.pendingRequestCount())} درخواست منتظر بررسی است`
      : `${this.pendingRequestCount()} request${this.pendingRequestCount() === 1 ? '' : 's'} waiting for review`;
  }

  itemsForDayLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.totalItems())} مورد برای این روز`
      : `${this.totalItems()} items for this day`;
  }

  projectDoneLabel(project: TodayProjectDto): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(project.doneCount)}/${this.i18n.number(project.taskCount)} انجام شده`
      : `${project.doneCount}/${project.taskCount} done`;
  }

  projectTasksTodayLabel(project: TodayProjectDto): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(project.taskCount)} تسک امروز`
      : `${project.taskCount} task${project.taskCount === 1 ? '' : 's'} today`;
  }

  isTaskDone(task: TaskDto): boolean {
    return task.status === 'Done' || task.status === 3;
  }

  isProjectTask(task: TaskDto): boolean {
    return task.type === 'Project' || task.type === 1;
  }

  toggleNotifications(): void {
    this.isNotificationsOpen.update(value => !value);
  }

  openInboxFromAlert(): void {
    void this.router.navigate(['/inbox']);
  }

  openHabitDetails(id: string): void {
    void this.router.navigate(['/habit', id], { queryParams: { date: this.selectedDate() } });
  }

  startHabitHold(event: Event, habit: TodayHabitDto): void {
    event.preventDefault();
    event.stopPropagation();
    if (habit.isCompletedToday || this.completingHabitId() || this.holdingHabitId()) return;
    window.navigator.vibrate?.(50);
    this.holdingHabitId.set(habit.id);
    this.habitHoldTimer = setTimeout(() => void this.completeHeldHabit(habit), this.habitHoldDuration);
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

  habitRowSubtitle(habit: TodayHabitDto): string {
    if (habit.isCompletedToday) return this.i18n.text('Done');
    return this.i18n.text('Habit');
  }

  habitStreakLabel(value: number): string {
    return this.i18n.language() === 'fa' ? this.i18n.number(value) : `${value}`;
  }

  selectDate(date: string): void {
    if (date === this.selectedDate()) return;
    this.selectedDate.set(date);
    this.calendar.setSelectedTaskDate(date);
    void this.loadToday();
  }

  requestIcon(request: TodayDashboardDto['pendingTaskRequests'][number]): string {
    if (request.type === 'ProjectInvite' || request.type === 0) return 'group_add';
    if (request.type === 'SectionAssignment' || request.type === 1) return 'view_column';
    return 'assignment_turned_in';
  }

  private async completeHeldHabit(habit: TodayHabitDto): Promise<void> {
    if (habit.isCompletedToday) return;
    this.completingHabitId.set(habit.id);
    this.habitError.set(null);
    try {
      await this.habitsService.completeHabit(habit.id, this.selectedDate());
      await this.loadToday(false);
      window.navigator.vibrate?.([50, 50, 50]);
    } catch (error) {
      this.habitError.set(this.messageFromError(error, this.i18n.text('Could not complete habit.')));
    } finally {
      this.completingHabitId.set(null);
      this.cancelHabitHold();
    }
  }

  private async loadToday(showLoading = true): Promise<void> {
    if (showLoading) this.isLoading.set(true);
    try {
      this.dashboard.set(await this.todayService.getToday(this.selectedDate()));
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleTaskCreated(event: Event): void {
    const dueDate = event instanceof CustomEvent ? event.detail?.dueDate as string | undefined : undefined;
    if (dueDate && this.calendar.dateFromKey(dueDate) && dueDate !== this.selectedDate()) {
      this.selectedDate.set(dueDate);
      this.calendar.setSelectedTaskDate(dueDate);
    }

    void this.loadToday();
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
