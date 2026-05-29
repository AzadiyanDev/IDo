import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TaskDto, TodayDashboardDto, TodayHabitDto, TodayProjectDto, TodayService } from '../../core/today.service';
import { SlideAlertComponent } from '../../shared/slide-alert/slide-alert';

@Component({
  selector: 'app-today',
  imports: [RouterLink, SlideAlertComponent],
  template: `
    <header class="w-full top-0 sticky bg-theme-bg z-40 py-md">
      <div class="flex justify-between items-center px-margin-mobile w-full">
        <div class="flex items-center gap-md min-w-0">
          <div class="w-10 h-10 rounded-full overflow-hidden border border-theme-border flex-shrink-0 bg-theme-surface flex items-center justify-center">
            @if (avatarUrl()) {
              <img [src]="avatarUrl()" [alt]="displayName()" class="w-full h-full object-cover"/>
            } @else {
              <span class="text-body-md font-body-md font-semibold text-primary">{{ initials() }}</span>
            }
          </div>
          <div class="min-w-0">
            <h1 class="text-headline-lg-mobile font-headline-lg-mobile text-primary leading-tight truncate">{{ displayName() }}</h1>
            <p class="text-body-md font-body-md text-on-surface-variant leading-tight">Your plan for today is ready</p>
          </div>
        </div>
        <button class="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity flex-shrink-0 relative">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">notifications</span>
          @if (pendingRequestCount() > 0) {
            <span class="absolute top-2 right-2 w-2 h-2 bg-theme-teal rounded-full"></span>
          }
        </button>
      </div>
    </header>

    <app-slide-alert
      [open]="pendingRequestCount() > 0"
      title="Task request pending"
      [message]="pendingRequestCount() + ' request waiting for review'"
      actionText="Review"
    />

    <div class="px-margin-mobile flex flex-col gap-xl">
      <section>
        <div class="flex overflow-x-auto hide-scrollbar gap-sm py-xs snap-x -mx-margin-mobile px-margin-mobile">
          @for (day of calendarDays(); track day.key) {
            <div
              class="flex flex-col items-center justify-center min-w-[64px] h-[88px] rounded-full snap-center shrink-0 border relative"
              [class.bg-primary-container]="day.isToday"
              [class.text-on-primary-container]="day.isToday"
              [class.border-primary-container]="day.isToday"
              [class.bg-theme-surface]="!day.isToday"
              [class.text-on-surface-variant]="!day.isToday"
              [class.border-theme-border]="!day.isToday"
            >
              <span class="text-label-md font-label-md uppercase mb-1" [class.font-bold]="day.isToday">{{ day.weekday }}</span>
              <span class="text-headline-md font-headline-md" [class.font-bold]="day.isToday">{{ day.dayOfMonth }}</span>
              <span class="text-[10px] leading-none mt-0.5">{{ day.month }}</span>
              @if (day.isToday) {
                <span class="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-theme-bg"></span>
              }
            </div>
          }
        </div>
      </section>

      <section class="bg-theme-surface rounded-2xl border border-theme-border p-lg flex items-center justify-between relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-theme-teal opacity-5 rounded-full blur-2xl"></div>

        <div class="flex flex-col gap-xs z-10 min-w-0">
          <h2 class="text-headline-md font-headline-md text-on-surface m-0">Today</h2>
          <p class="text-body-md font-body-md text-on-surface-variant m-0">{{ totalItems() }} items for today</p>
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
          <h3 class="text-headline-md font-headline-md text-on-surface m-0">Today's Tasks</h3>
          <a routerLink="/tasks" class="text-primary-container text-body-md font-body-md no-underline hover:underline">See All</a>
        </div>

        <div class="flex flex-col gap-sm">
          @for (task of visibleTasks(); track task.id) {
            <a [routerLink]="['/task', task.id]" class="bg-theme-surface rounded-2xl border border-theme-border p-md flex items-center gap-md cursor-pointer hover:bg-surface-container-high transition-colors no-underline text-inherit">
              <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                [class.border-primary-container]="task.status === 'Done'"
                [class.bg-primary-container]="task.status === 'Done'"
                [class.border-theme-border]="task.status !== 'Done'">
                @if (task.status === 'Done') {
                  <span class="material-symbols-outlined text-[14px] text-theme-bg font-bold" style="font-variation-settings: 'FILL' 1;">check</span>
                }
              </div>
              <div class="flex flex-col flex-1 min-w-0 pl-1">
                <span class="text-body-lg font-body-lg text-on-surface font-medium truncate" [class.line-through]="task.status === 'Done'">{{ task.title }}</span>
                <span class="text-label-md font-label-md text-primary-container mt-0.5">{{ taskTimeLabel(task) }}</span>
              </div>
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                [class.bg-theme-project-bg]="task.type === 'Project'"
                [class.text-theme-purple]="task.type === 'Project'"
                [class.bg-surface-container-high]="task.type !== 'Project'"
                [class.text-primary]="task.type !== 'Project'">
                <span class="material-symbols-outlined text-[18px]">{{ task.type === 'Project' ? 'assignment' : 'checklist' }}</span>
              </div>
            </a>
          } @empty {
            <div class="bg-theme-surface rounded-2xl border border-theme-border p-lg text-center text-on-surface-variant">
              No tasks for today.
            </div>
          }
        </div>
      </section>

      <section class="flex flex-col gap-md">
        <h3 class="text-headline-md font-headline-md text-on-surface m-0">Habits</h3>
        <div class="flex overflow-x-auto hide-scrollbar gap-sm snap-x pb-xs -mx-margin-mobile px-margin-mobile">
          @for (habit of dashboard()?.todayHabits ?? []; track habit.id) {
            <div class="rounded-2xl p-md min-w-[140px] flex flex-col justify-between h-[120px] snap-center shrink-0 border"
              [class.bg-theme-habit-bg]="!habit.isCompletedToday"
              [class.border-theme-habit-accent]="habit.isCompletedToday"
              [class.bg-theme-surface]="habit.isCompletedToday"
              [class.border-theme-border]="!habit.isCompletedToday">
              <div class="flex justify-between items-start z-10 w-full mb-4">
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                  [class.bg-theme-habit-accent]="habit.isCompletedToday"
                  [class.text-theme-bg]="habit.isCompletedToday"
                  [class.bg-theme-habit-accent\/20]="!habit.isCompletedToday"
                  [class.text-theme-habit-accent]="!habit.isCompletedToday">
                  <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">{{ habit.isCompletedToday ? 'check' : habit.icon || 'repeat' }}</span>
                </div>
                <span class="text-label-md font-label-md text-theme-habit-accent font-bold">{{ habit.currentStreak }}</span>
              </div>
              <div class="z-10 w-full">
                <span class="text-body-md font-body-md font-medium block" [class.text-theme-habit-accent]="habit.isCompletedToday" [class.text-white]="!habit.isCompletedToday">{{ habit.title }}</span>
                <span class="text-label-md font-label-md text-white/60">{{ habit.isCompletedToday ? 'Done' : 'Streak' }}</span>
              </div>
            </div>
          } @empty {
            <div class="bg-theme-surface rounded-2xl border border-theme-border p-md min-w-[180px] text-on-surface-variant">
              No habits today.
            </div>
          }
        </div>
      </section>

      <section class="flex flex-col gap-md">
        <h3 class="text-headline-md font-headline-md text-on-surface m-0">Projects</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-sm">
          @for (project of dashboard()?.activeProjects ?? []; track project.project.id) {
            <a [routerLink]="['/project', project.project.id]" class="bg-theme-project-bg rounded-2xl p-md flex flex-col gap-sm border border-theme-project-accent/20 relative overflow-hidden no-underline">
              <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-theme-project-accent opacity-5 rounded-full blur-xl"></div>
              <div class="flex justify-between items-start z-10 w-full">
                <span class="px-2 py-1 bg-theme-project-accent/20 text-theme-project-accent text-label-md font-label-md rounded-full">{{ project.doneCount }}/{{ project.taskCount }} done</span>
                <span class="material-symbols-outlined text-theme-project-accent">chevron_right</span>
              </div>
              <div class="z-10 mt-1">
                <h4 class="text-body-lg font-body-lg text-white font-medium m-0">{{ project.project.title }}</h4>
                <p class="text-body-md font-body-md text-white/60 flex items-center gap-2 mt-1 mb-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-theme-project-accent inline-block"></span> {{ project.taskCount }} task{{ project.taskCount === 1 ? '' : 's' }} today
                </p>
              </div>
            </a>
          } @empty {
            <div class="bg-theme-surface rounded-2xl border border-theme-border p-md text-on-surface-variant">
              No active project tasks today.
            </div>
          }
        </div>
      </section>
    </div>
  `
})
export class TodayComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly todayService = inject(TodayService);
  private readonly today = new Date();
  private readonly taskCreatedHandler = () => void this.loadToday();

  readonly dashboard = signal<TodayDashboardDto | null>(null);
  readonly isLoading = signal(true);
  readonly currentUser = this.auth.currentUser;
  readonly displayName = computed(() => {
    const user = this.currentUser();
    return user?.profile.fullName?.trim() || user?.userName || 'there';
  });
  readonly avatarUrl = computed(() => this.currentUser()?.profile.avatarUrl?.trim() || null);
  readonly initials = computed(() => this.displayName()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'U');
  readonly calendarDays = computed(() => this.buildCurrentWeek(this.today));
  readonly todayTasks = computed(() => [...(this.dashboard()?.personalTasks ?? []), ...(this.dashboard()?.projectTasks ?? [])]);
  readonly visibleTasks = computed(() => this.todayTasks().slice(0, 3));
  readonly totalItems = computed(() => {
    const summary = this.dashboard()?.summary;
    return summary ? summary.personalTaskCount + summary.habitCount + summary.projectTaskCount : 0;
  });
  readonly donePercentage = computed(() => Math.round(this.dashboard()?.summary.donePercentage ?? 0));
  readonly pendingRequestCount = computed(() => this.dashboard()?.summary.pendingRequestCount ?? 0);
  readonly categorySummary = computed(() => {
    const summary = this.dashboard()?.summary;
    return [
      { key: 'todo', label: 'Todos', count: summary?.personalTaskCount ?? 0, done: summary?.personalTaskDoneCount ?? 0, color: '#3EAEFF' },
      { key: 'habit', label: 'Habits', count: summary?.habitCount ?? 0, done: summary?.habitDoneCount ?? 0, color: '#00F4B9' },
      { key: 'project', label: 'Projects', count: summary?.projectTaskCount ?? 0, done: summary?.projectTaskDoneCount ?? 0, color: '#B072FF' }
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
  }

  taskTimeLabel(task: TaskDto): string {
    if (task.dueTime) return task.dueTime.slice(0, 5);
    if (task.status === 'Done') return 'Done';
    return task.type === 'Project' ? 'Project task' : 'Todo';
  }

  private async loadToday(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.dashboard.set(await this.todayService.getToday(this.formatDate(this.today)));
    } finally {
      this.isLoading.set(false);
    }
  }

  private buildCurrentWeek(date: Date): CalendarDay[] {
    const weekStart = new Date(date);
    const dayOffset = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - dayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const item = new Date(weekStart);
      item.setDate(weekStart.getDate() + index);
      return {
        key: this.formatDate(item),
        weekday: item.toLocaleDateString('en-US', { weekday: 'short' }),
        dayOfMonth: item.getDate(),
        month: item.toLocaleDateString('en-US', { month: 'short' }),
        isToday: this.isSameDate(item, date)
      };
    });
  }

  private isSameDate(left: Date, right: Date): boolean {
    return this.formatDate(left) === this.formatDate(right);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

interface CalendarDay {
  key: string;
  weekday: string;
  dayOfMonth: number;
  month: string;
  isToday: boolean;
}
