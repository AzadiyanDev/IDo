import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskDto, TodayDashboardDto, TodayService } from '../../core/today.service';

@Component({
  selector: 'app-tasks',
  imports: [RouterLink],
  template: `
    <header class="w-full top-0 sticky bg-theme-bg z-40 py-md">
      <div class="px-margin-mobile flex items-center justify-between">
        <div>
          <h1 class="text-headline-lg-mobile font-headline-lg-mobile text-on-surface m-0">Tasks</h1>
          <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">Everything scheduled for the selected day</p>
        </div>
        <a routerLink="/today" class="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-on-surface no-underline">
          <span class="material-symbols-outlined">close</span>
        </a>
      </div>
    </header>

    <div class="px-margin-mobile flex flex-col gap-lg">
      <section>
        <div class="flex overflow-x-auto hide-scrollbar gap-sm py-xs snap-x -mx-margin-mobile px-margin-mobile">
          @for (day of calendarDays(); track day.key) {
            <button
              type="button"
              (click)="selectDate(day.key)"
              class="flex flex-col items-center justify-center min-w-[64px] h-[88px] rounded-full snap-center shrink-0 border relative transition-colors"
              [class.bg-primary-container]="day.key === selectedDate()"
              [class.text-on-primary-container]="day.key === selectedDate()"
              [class.border-primary-container]="day.key === selectedDate()"
              [class.bg-theme-surface]="day.key !== selectedDate()"
              [class.text-on-surface-variant]="day.key !== selectedDate()"
              [class.border-theme-border]="day.key !== selectedDate()">
              <span class="text-label-md font-label-md uppercase mb-1">{{ day.weekday }}</span>
              <span class="text-headline-md font-headline-md font-bold">{{ day.dayOfMonth }}</span>
              <span class="text-[10px] leading-none mt-0.5">{{ day.month }}</span>
            </button>
          }
        </div>
      </section>

      <section class="flex flex-col gap-md">
        <div class="flex items-center justify-between">
          <h2 class="text-headline-md font-headline-md text-on-surface m-0">All todos</h2>
          <span class="text-label-md font-label-md text-on-surface-variant">{{ tasks().length }} total</span>
        </div>

        <div class="flex flex-col gap-sm">
          @for (task of tasks(); track task.id) {
            <a [routerLink]="['/task', task.id]" class="bg-theme-surface rounded-2xl border border-theme-border p-md flex items-center gap-md cursor-pointer hover:bg-surface-container-high transition-colors no-underline text-inherit">
              <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                [class.border-primary-container]="task.status === 'Done'"
                [class.bg-primary-container]="task.status === 'Done'"
                [class.border-theme-border]="task.status !== 'Done'">
                @if (task.status === 'Done') {
                  <span class="material-symbols-outlined text-[14px] text-theme-bg font-bold" style="font-variation-settings: 'FILL' 1;">check</span>
                }
              </div>
              <div class="flex flex-col flex-1 min-w-0">
                <span class="text-body-lg font-body-lg text-on-surface font-medium truncate">{{ task.title }}</span>
                <span class="text-label-md font-label-md text-primary-container mt-0.5">{{ taskLabel(task) }}</span>
              </div>
              <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </a>
          } @empty {
            <div class="bg-theme-surface rounded-2xl border border-theme-border p-lg text-center text-on-surface-variant">
              No todos for this day.
            </div>
          }
        </div>
      </section>
    </div>
  `
})
export class TasksComponent {
  private readonly todayService = inject(TodayService);
  private readonly today = new Date();

  readonly selectedDate = signal(this.formatDate(this.today));
  readonly dashboard = signal<TodayDashboardDto | null>(null);
  readonly calendarDays = computed(() => this.buildCurrentWeek(this.today));
  readonly tasks = computed(() => [...(this.dashboard()?.personalTasks ?? []), ...(this.dashboard()?.projectTasks ?? [])]);

  constructor() {
    void this.load();
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    void this.load();
  }

  taskLabel(task: TaskDto): string {
    if (task.dueTime) return task.dueTime.slice(0, 5);
    return task.type === 'Project' ? 'Project' : 'Todo';
  }

  private async load(): Promise<void> {
    this.dashboard.set(await this.todayService.getToday(this.selectedDate()));
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
        month: item.toLocaleDateString('en-US', { month: 'short' })
      };
    });
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
}
