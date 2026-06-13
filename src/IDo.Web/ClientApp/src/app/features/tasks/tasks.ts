import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarService } from '../../core/calendar.service';
import { I18nService } from '../../core/i18n.service';
import { TaskDto, TodayDashboardDto, TodayService } from '../../core/today.service';
import { HorizontalDateStripComponent } from '../../shared/calendar/horizontal-date-strip';

@Component({
  selector: 'app-tasks',
  imports: [RouterLink, HorizontalDateStripComponent],
  template: `
    <header class="w-full top-0 sticky bg-theme-bg z-40 py-md">
      <div class="px-margin-mobile flex items-center justify-between">
        <div>
          <h1 class="text-headline-lg-mobile font-headline-lg-mobile text-on-surface m-0">{{ i18n.text('Tasks') }}</h1>
          <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ i18n.text('Everything scheduled for the selected day') }}</p>
        </div>
        <a routerLink="/today" class="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-on-surface no-underline">
          <span class="material-symbols-outlined">close</span>
        </a>
      </div>
    </header>

    <div class="px-margin-mobile flex flex-col gap-lg">
      <section>
        <app-horizontal-date-strip [selectedDate]="selectedDate()" (selectedDateChange)="selectDate($event)" />
      </section>

      <section class="flex flex-col gap-md">
        <div class="flex items-center justify-between">
          <h2 class="text-headline-md font-headline-md text-on-surface m-0">{{ selectedDateTitle() }}</h2>
          <span class="text-label-md font-label-md text-on-surface-variant">{{ totalLabel() }}</span>
        </div>

        <div class="flex flex-col gap-sm">
          @for (task of tasks(); track task.id) {
            <a [routerLink]="['/task', task.id]" class="bg-theme-surface rounded-2xl border border-theme-border p-md flex items-center gap-md cursor-pointer hover:bg-surface-container-high transition-colors no-underline text-inherit">
              <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                [class.border-primary-container]="isTaskDone(task)"
                [class.bg-primary-container]="isTaskDone(task)"
                [class.border-theme-border]="!isTaskDone(task)">
                @if (isTaskDone(task)) {
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
              {{ i18n.text('No todos for this day.') }}
            </div>
          }
        </div>
      </section>
    </div>
  `
})
export class TasksComponent implements OnDestroy {
  private readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);
  private readonly todayService = inject(TodayService);
  private readonly taskCreatedHandler = (event: Event) => void this.handleTaskCreated(event);
  private readonly tasksRolledOverHandler = () => void this.load();

  readonly selectedDate = signal(this.calendar.todayKey());
  readonly dashboard = signal<TodayDashboardDto | null>(null);
  readonly tasks = computed(() => [...(this.dashboard()?.personalTasks ?? []), ...(this.dashboard()?.projectTasks ?? [])]);
  readonly selectedDateTitle = computed(() => this.selectedDate() === this.calendar.todayKey()
    ? this.i18n.text('All todos today')
    : this.i18n.language() === 'fa' ? `تسک‌های ${this.calendar.formatLongDateKey(this.selectedDate())}` : `Todos for ${this.calendar.formatLongDateKey(this.selectedDate())}`);

  constructor() {
    window.addEventListener('ido:task-created', this.taskCreatedHandler);
    window.addEventListener('ido:tasks-rolled-over', this.tasksRolledOverHandler);
    void this.load();
  }

  ngOnDestroy(): void {
    window.removeEventListener('ido:task-created', this.taskCreatedHandler);
    window.removeEventListener('ido:tasks-rolled-over', this.tasksRolledOverHandler);
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.calendar.setSelectedTaskDate(date);
    void this.load();
  }

  taskLabel(task: TaskDto): string {
    if (task.dueTime) return task.dueTime.slice(0, 5);
    return this.isProjectTask(task) ? this.i18n.text('Project') : this.i18n.text('Todo');
  }

  totalLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.tasks().length)} کل`
      : `${this.tasks().length} total`;
  }

  isTaskDone(task: TaskDto): boolean {
    return task.status === 'Done' || task.status === 3;
  }

  isProjectTask(task: TaskDto): boolean {
    return task.type === 'Project' || task.type === 1;
  }

  private async load(): Promise<void> {
    this.dashboard.set(await this.todayService.getToday(this.selectedDate()));
  }

  private handleTaskCreated(event: Event): void {
    const dueDate = event instanceof CustomEvent ? event.detail?.dueDate as string | undefined : undefined;
    if (dueDate && this.calendar.dateFromKey(dueDate) && dueDate !== this.selectedDate()) {
      this.selectedDate.set(dueDate);
      this.calendar.setSelectedTaskDate(dueDate);
    }

    void this.load();
  }
}
