import { Component, OnDestroy, OnInit, computed, inject, input, signal, output } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CalendarService } from '../../core/calendar.service';
import { TasksService } from '../../core/tasks.service';
import type { TaskDto } from '../../core/today.service';
import { HabitScheduleType, HabitsService } from '../../core/habits.service';
import { ProjectsService } from '../../core/projects.service';
import { I18nService } from '../../core/i18n.service';
import { CalendarDatePickerComponent } from '../calendar/calendar-date-picker';
import { LoadingModalComponent } from '../loading-modal/loading-modal';
import { HABIT_ICON_OPTIONS, PROJECT_COLOR_OPTIONS, PROJECT_ICON_OPTIONS } from '../project-icon-options';

export type CreateNewMode = 'task' | 'habit' | 'project';

@Component({
  selector: 'app-create-new-modal',
  imports: [LoadingModalComponent, CalendarDatePickerComponent],
  template: `
    <div
      class="fixed inset-0 bg-black/45 backdrop-blur-sm z-[90] transition-opacity flex items-end justify-center"
      role="button"
      tabindex="0"
      (click)="closeOnBackdrop($event)"
      (keydown.enter)="closeOnBackdrop($event)"
      (keydown.space)="closeOnBackdrop($event)">

      <div
        role="dialog"
        aria-modal="true"
        class="create-sheet w-[calc(100%-32px)] max-w-[560px] bg-surface-container shadow-[0px_-18px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden transition-[height,border-radius,transform] duration-300 ease-out"
        [class.rounded-t-[34px]]="!isExpanded()"
        [class.rounded-t-[18px]]="isExpanded()"
        [style.height]="sheetHeight()"
        [style.max-height]="isExpanded() ? '100dvh' : 'calc(100dvh - 48px)'">

        <button
          type="button"
          class="w-full flex justify-center pt-sm pb-xs cursor-grab active:cursor-grabbing border-none bg-transparent touch-none"
          [attr.aria-label]="i18n.text('Expand create modal')"
          (click)="toggleExpanded()"
          (pointerdown)="startDrag($event)">
          <div class="w-[60px] h-1.5 bg-outline-variant rounded-full opacity-60"></div>
        </button>

        <div class="px-lg pt-sm pb-md flex justify-between items-start shrink-0">
          <div class="min-w-0">
            <h2 class="text-[26px] leading-[32px] font-semibold text-on-surface m-0">{{ modalTitle() }}</h2>
            <p class="text-body-lg font-body-lg text-on-surface-variant m-0 mt-1">{{ modalSubtitle() }}</p>
          </div>
          <button type="button" (click)="closeClicked.emit()" class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors">
            <span class="material-symbols-outlined text-[26px]">close</span>
          </button>
        </div>

        <form class="flex-1 overflow-y-auto px-lg pb-[120px] flex flex-col gap-lg hide-scrollbar" (submit)="submit($event)">
          <div class="h-px w-full bg-outline-variant/30"></div>

          <div class="flex flex-col gap-sm">
            <input
              [value]="title()"
              (input)="title.set(inputValue($event))"
              type="text"
              [placeholder]="titlePlaceholder()"
              class="w-full h-[52px] bg-surface-container-lowest border-none rounded-full px-lg text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              required />

            <div class="relative">
              <span class="material-symbols-outlined absolute start-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[25px]">notes</span>
              <input
                [value]="description()"
                (input)="description.set(inputValue($event))"
                type="text"
                [placeholder]="descriptionPlaceholder()"
                class="w-full h-[48px] bg-surface-container-lowest border-none rounded-full ps-[54px] pe-lg text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
            </div>
          </div>

          @if (mode() === 'habit') {
            <div class="flex flex-col gap-sm">
              <span class="text-label-md font-label-md text-on-surface-variant uppercase">{{ i18n.text('Active days') }}</span>
              <div class="grid grid-cols-7 gap-xs">
                @for (day of weekDays(); track day.value) {
                  <button
                    type="button"
                    (click)="toggleHabitDay(day.value)"
                    class="h-11 rounded-full text-label-md font-label-md font-semibold transition-colors"
                    [class.bg-secondary-container]="isHabitDaySelected(day.value)"
                    [class.text-on-secondary-container]="isHabitDaySelected(day.value)"
                    [class.bg-surface-container-highest]="!isHabitDaySelected(day.value)"
                    [class.text-on-surface-variant]="!isHabitDaySelected(day.value)">
                    {{ day.label }}
                  </button>
                }
              </div>
            </div>

            <div class="flex flex-col gap-sm">
              <span class="text-label-md font-label-md text-on-surface-variant uppercase">{{ i18n.text('Icon') }}</span>
              <div class="grid grid-cols-6 gap-xs max-h-[156px] overflow-y-auto hide-scrollbar pr-1">
                @for (icon of habitIcons; track icon) {
                  <button
                    type="button"
                    (click)="habitIcon.set(icon)"
                    class="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                    [class.bg-theme-habit-bg]="habitIcon() === icon"
                    [class.text-theme-habit-accent]="habitIcon() === icon"
                    [class.border]="habitIcon() === icon"
                    [class.border-theme-habit-accent]="habitIcon() === icon"
                    [class.bg-surface-container-highest]="habitIcon() !== icon"
                    [class.text-on-surface]="habitIcon() !== icon">
                    <span class="material-symbols-outlined">{{ icon }}</span>
                  </button>
                }
              </div>
            </div>
          } @else if (mode() === 'project') {
            <div class="flex flex-col gap-sm">
              <span class="text-label-md font-label-md text-on-surface-variant uppercase">{{ i18n.text('Project icon') }}</span>
              <div class="grid grid-cols-6 gap-xs max-h-[156px] overflow-y-auto hide-scrollbar pr-1">
                @for (icon of projectIcons; track icon) {
                  <button
                    type="button"
                    (click)="projectIcon.set(icon)"
                    class="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                    [class.bg-theme-project-bg]="projectIcon() === icon"
                    [class.text-theme-project-accent]="projectIcon() === icon"
                    [class.border]="projectIcon() === icon"
                    [class.border-theme-project-accent]="projectIcon() === icon"
                    [class.bg-surface-container-highest]="projectIcon() !== icon"
                    [class.text-on-surface]="projectIcon() !== icon">
                    <span class="material-symbols-outlined">{{ icon }}</span>
                  </button>
                }
              </div>
            </div>

            <div class="flex flex-col gap-sm">
              <span class="text-label-md font-label-md text-on-surface-variant uppercase">{{ i18n.text('Accent') }}</span>
              <div class="grid grid-cols-5 gap-xs">
                @for (color of projectColors; track color.value) {
                  <button
                    type="button"
                    (click)="projectColor.set(color.value)"
                    class="h-11 rounded-full flex items-center justify-center border transition-all"
                    [class.border-white]="projectColor() === color.value"
                    [class.border-outline-variant]="projectColor() !== color.value"
                    [style.background]="color.value">
                    @if (projectColor() === color.value) {
                      <span class="material-symbols-outlined text-[18px] text-white" style="font-variation-settings: 'FILL' 1;">check</span>
                    }
                  </button>
                }
              </div>
            </div>
          } @else {
            <div class="flex flex-col gap-sm">
              <span class="text-label-md font-label-md text-on-surface-variant uppercase">{{ i18n.text('Date') }}</span>
              <div class="flex flex-wrap gap-xs">
                <button type="button" (click)="setToday()" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                  [class.bg-primary-container]="isTodaySelected()"
                  [class.text-on-primary-container]="isTodaySelected()"
                  [class.bg-surface-container-highest]="!isTodaySelected()"
                  [class.text-on-surface]="!isTodaySelected()">
                  {{ i18n.text('Today') }}
                </button>
                <button type="button" (click)="setTomorrow()" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                  [class.bg-primary-container]="isTomorrowSelected()"
                  [class.text-on-primary-container]="isTomorrowSelected()"
                  [class.bg-surface-container-highest]="!isTomorrowSelected()"
                  [class.text-on-surface]="!isTomorrowSelected()">
                  {{ i18n.text('Tomorrow') }}
                </button>
                <button type="button" (click)="clearDueDate()" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                  [class.bg-primary-container]="!dueDate()"
                  [class.text-on-primary-container]="!dueDate()"
                  [class.bg-surface-container-highest]="!!dueDate()"
                  [class.text-on-surface]="!!dueDate()">
                  {{ i18n.text('No date') }}
                </button>
                <button type="button" (click)="showDatePicker.set(!showDatePicker())" class="px-md py-3 rounded-full bg-surface-container-highest text-on-surface text-body-md font-body-md font-semibold flex items-center gap-xs hover:bg-surface-variant transition-colors">
                  <span class="material-symbols-outlined text-[22px]">calendar_month</span>
                  {{ dueDateLabel() }}
                </button>
              </div>
              @if (showDatePicker()) {
                <app-calendar-date-picker [selectedDate]="datePickerSelectedDate()" (selectedDateChange)="setDueDate($event)" />
              }
            </div>
          }

          @if (mode() !== 'project') {
            <div class="flex flex-col gap-sm">
              <span class="text-label-md font-label-md text-on-surface-variant uppercase">{{ i18n.text('Reminder') }}</span>
              <div class="flex flex-wrap gap-xs">
                <button type="button" (click)="setReminder('')" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                  [class.bg-primary-container]="!selectedReminder()"
                  [class.text-on-primary-container]="!selectedReminder()"
                  [class.bg-surface-container-highest]="selectedReminder()"
                  [class.text-on-surface]="selectedReminder()">
                  {{ i18n.text('No reminder') }}
                </button>
                <button type="button" (click)="setReminder('10:00')" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                  [class.bg-primary-container]="selectedReminder() === '10:00'"
                  [class.text-on-primary-container]="selectedReminder() === '10:00'"
                  [class.bg-surface-container-highest]="selectedReminder() !== '10:00'"
                  [class.text-on-surface]="selectedReminder() !== '10:00'">
                  10:00 AM
                </button>
                <button type="button" (click)="setReminder('14:00')" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                  [class.bg-primary-container]="selectedReminder() === '14:00'"
                  [class.text-on-primary-container]="selectedReminder() === '14:00'"
                  [class.bg-surface-container-highest]="selectedReminder() !== '14:00'"
                  [class.text-on-surface]="selectedReminder() !== '14:00'">
                  2:00 PM
                </button>
                <button type="button" (click)="showTimePicker.set(!showTimePicker())" class="w-11 h-11 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:bg-surface-variant transition-colors">
                  <span class="material-symbols-outlined text-[30px]">add</span>
                </button>
              </div>
              @if (showTimePicker()) {
                <input
                  [value]="selectedReminder()"
                  (input)="setReminder(inputValue($event))"
                  type="time"
                  class="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full px-md py-sm text-body-md font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
              }
            </div>
          }

          @if (error()) {
            <div class="rounded-xl border border-error/40 bg-error-container/30 text-on-error-container px-md py-sm text-body-md font-body-md">
              {{ error() }}
            </div>
          }
        </form>

        <div class="absolute bottom-0 left-0 w-full px-lg pb-lg pt-xxl bg-gradient-to-t from-surface-container via-surface-container to-transparent shrink-0">
          <button type="button" (click)="submit()" [disabled]="isSubmitting()" class="w-full bg-primary-container text-on-primary-container py-md rounded-full text-headline-md font-headline-md font-bold shadow-[0_12px_26px_rgba(0,230,246,0.22)] hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-xs">
            {{ submitLabel() }}
            <span class="material-symbols-outlined">arrow_upward</span>
          </button>
        </div>
      </div>
    </div>

    <app-loading-modal [open]="isSubmitting()" [title]="loadingTitle()" [message]="loadingMessage()" />
  `,
  styles: [`
    .create-sheet {
      animation: sheet-enter 280ms cubic-bezier(.22, 1, .36, 1) both;
    }

    @keyframes sheet-enter {
      from {
        opacity: 0;
        transform: translateY(100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class CreateNewModalComponent implements OnDestroy, OnInit {
  private readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);

  mode = input<CreateNewMode>('task');
  taskEdit = input<TaskDto | null>(null);
  closeClicked = output<void>();
  created = output<void>();
  title = signal('');
  description = signal('');
  dueDate = signal<string | null>(this.calendar.selectedTaskDate());
  dueTime = signal('');
  habitReminderTime = signal('');
  habitIcon = signal('repeat');
  projectIcon = signal('assignment');
  projectColor = signal('#B072FF');
  activeDays = signal<number[]>([0, 1, 2, 3, 4, 5, 6]);
  showDatePicker = signal(false);
  showTimePicker = signal(false);
  isExpanded = signal(false);
  sheetHeight = signal<string | null>(null);
  isCountable = signal(true);
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  readonly dueDateLabel = computed(() => this.dueDate() ? this.calendar.formatShortDateKey(this.dueDate()!) : this.i18n.text('No date'));
  readonly datePickerSelectedDate = computed(() => this.dueDate() ?? this.calendar.todayKey());
  readonly isEditingTask = computed(() => this.mode() === 'task' && this.taskEdit() !== null);
  private dragStartY: number | null = null;
  private dragStartHeight: number | null = null;
  private readonly collapsedHeight = 535;
  private didDrag = false;
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
  readonly habitIcons = HABIT_ICON_OPTIONS;
  readonly projectIcons = PROJECT_ICON_OPTIONS;
  readonly projectColors = PROJECT_COLOR_OPTIONS;
  private readonly allDayValues = [0, 1, 2, 3, 4, 5, 6];

  constructor(
    private readonly tasks: TasksService,
    private readonly habits: HabitsService,
    private readonly projects: ProjectsService
  ) {}

  ngOnInit(): void {
    this.hydrateTaskEdit();
  }

  ngOnDestroy(): void {
    this.removeDragListeners();
  }

  closeOnBackdrop(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeClicked.emit();
    }
  }

  async submit(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.isSubmitting()) return;
    if (!this.title().trim()) {
      this.error.set(this.i18n.text(`${this.entityName()} title is required.`));
      return;
    }

    if (this.mode() === 'habit' && this.activeDays().length === 0) {
      this.error.set(this.i18n.text('Select at least one active day.'));
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      if (this.mode() === 'habit') {
        await this.habits.createHabit({
          title: this.title().trim(),
          description: this.description().trim() || null,
          color: null,
          icon: this.habitIcon(),
          scheduleType: HabitScheduleType.SpecificDays,
          requiredTimesPerWeek: null,
          reminderTime: this.toTimeOnly(this.habitReminderTime()),
          activeDays: [...this.activeDays()].sort((left, right) => left - right),
          restDays: this.allDayValues.filter(day => !this.activeDays().includes(day))
        });
        window.dispatchEvent(new CustomEvent('ido:habit-created'));
      } else if (this.mode() === 'project') {
        await this.projects.createProject({
          title: this.title().trim(),
          description: this.description().trim() || null,
          color: this.projectColor(),
          icon: this.projectIcon()
        });
        window.dispatchEvent(new CustomEvent('ido:project-created'));
      } else if (this.isEditingTask()) {
        const task = this.taskEdit()!;
        const updatedTask = await this.tasks.updateTask(task.id, {
          title: this.title().trim(),
          description: this.description().trim() || null,
          color: task.color,
          icon: task.icon,
          dueDate: this.dueDate() || null,
          dueTime: this.toTimeOnly(this.dueTime()),
          reminderAtUtc: task.reminderAtUtc,
          assigneeUserId: task.assigneeUserId,
          status: null,
          priority: task.priority,
          isCountableInProgress: this.isCountable()
        });
        if (updatedTask.dueDate) this.calendar.setSelectedTaskDate(updatedTask.dueDate);
        window.dispatchEvent(new CustomEvent('ido:task-updated', { detail: { task: updatedTask } }));
      } else {
        const task = await this.tasks.createPersonalTask({
          title: this.title().trim(),
          description: this.description().trim() || null,
          color: null,
          icon: null,
          dueDate: this.dueDate() || null,
          dueTime: this.toTimeOnly(this.dueTime()),
          reminderAtUtc: null,
          assigneeUserId: null,
          projectId: null,
          sectionId: null,
          habitId: null,
          priority: null,
          isCountableInProgress: this.isCountable()
        });
        const dueDate = task.dueDate ?? this.dueDate();
        if (dueDate) this.calendar.setSelectedTaskDate(dueDate);
        window.dispatchEvent(new CustomEvent('ido:task-created', { detail: { dueDate } }));
      }
      this.created.emit();
      this.closeClicked.emit();
    } catch (error) {
      this.error.set(this.messageFromError(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }

  checkedValue(event: Event): boolean {
    return event.target instanceof HTMLInputElement ? event.target.checked : false;
  }

  selectedReminder(): string {
    return this.mode() === 'habit' ? this.habitReminderTime() : this.dueTime();
  }

  modalTitle(): string {
    if (this.mode() === 'habit') return this.i18n.text('Create Habit');
    if (this.mode() === 'project') return this.i18n.text('Create Project');
    if (this.isEditingTask()) return this.i18n.text('Edit Task');
    return this.i18n.text('Create New');
  }

  modalSubtitle(): string {
    if (this.mode() === 'habit') return this.i18n.text('Add a repeatable routine');
    if (this.mode() === 'project') return this.i18n.text('Start a project workspace');
    if (this.isEditingTask()) return this.i18n.text('Update this task');
    return this.i18n.text('Add a task for today');
  }

  titlePlaceholder(): string {
    if (this.mode() === 'habit') return this.i18n.text('What routine do you want to build?');
    if (this.mode() === 'project') return this.i18n.text('What project are you starting?');
    return this.i18n.text('What do you need to do?');
  }

  descriptionPlaceholder(): string {
    if (this.mode() === 'project') return this.i18n.text('Project brief (optional)');
    return this.i18n.text('Description (optional)');
  }

  submitLabel(): string {
    if (this.mode() === 'habit') return this.i18n.text('Create Habit');
    if (this.mode() === 'project') return this.i18n.text('Create Project');
    if (this.isEditingTask()) return this.i18n.text('Update Task');
    return this.i18n.text('Create Task');
  }

  loadingTitle(): string {
    if (this.mode() === 'habit') return this.i18n.text('Creating habit');
    if (this.mode() === 'project') return this.i18n.text('Creating project');
    if (this.isEditingTask()) return this.i18n.text('Updating task');
    return this.i18n.text('Creating todo');
  }

  loadingMessage(): string {
    if (this.mode() === 'habit') return this.i18n.text('Adding it to your routines');
    if (this.mode() === 'project') return this.i18n.text('Preparing the workspace');
    if (this.isEditingTask()) return this.i18n.text('Saving task changes');
    return this.i18n.text('Adding it to today');
  }

  setReminder(value: string): void {
    if (this.mode() === 'habit') {
      this.habitReminderTime.set(value);
    } else {
      this.dueTime.set(value);
    }
  }

  isHabitDaySelected(day: number): boolean {
    return this.activeDays().includes(day);
  }

  toggleHabitDay(day: number): void {
    this.activeDays.update(days => days.includes(day)
      ? days.filter(item => item !== day)
      : [...days, day]);
  }

  toggleExpanded(): void {
    if (this.didDrag) {
      this.didDrag = false;
      return;
    }

    this.isExpanded.update(value => !value);
  }

  startDrag(event: PointerEvent): void {
    this.dragStartY = event.clientY;
    this.dragStartHeight = this.currentSheetHeight();
    this.didDrag = false;
    document.addEventListener('pointermove', this.handleDragMove);
    document.addEventListener('pointerup', this.finishDrag);
    document.addEventListener('pointercancel', this.finishDrag);
  }

  private readonly handleDragMove = (event: PointerEvent): void => {
    if (this.dragStartY === null || this.dragStartHeight === null) return;
    const deltaY = event.clientY - this.dragStartY;
    const nextHeight = this.clampHeight(this.dragStartHeight - deltaY);
    this.didDrag = true;
    this.sheetHeight.set(`${nextHeight}px`);
  };

  private readonly finishDrag = (): void => {
    if (this.dragStartHeight !== null && this.sheetHeight()) {
      const height = Number.parseFloat(this.sheetHeight() ?? '0');
      const shouldExpand = height > window.innerHeight * 0.68;
      this.isExpanded.set(shouldExpand);
      this.sheetHeight.set(shouldExpand ? '100dvh' : null);
    }

    this.dragStartY = null;
    this.dragStartHeight = null;
    this.removeDragListeners();
  };

  private removeDragListeners(): void {
    document.removeEventListener('pointermove', this.handleDragMove);
    document.removeEventListener('pointerup', this.finishDrag);
    document.removeEventListener('pointercancel', this.finishDrag);
  }

  private currentSheetHeight(): number {
    if (this.sheetHeight()) return Number.parseFloat(this.sheetHeight() ?? `${this.collapsedHeight}`);
    return this.isExpanded() ? window.innerHeight : this.collapsedHeight;
  }

  private clampHeight(height: number): number {
    return Math.max(this.collapsedHeight, Math.min(window.innerHeight, height));
  }

  setToday(): void {
    this.dueDate.set(this.calendar.todayKey());
    this.showDatePicker.set(false);
  }

  setTomorrow(): void {
    const tomorrow = this.calendar.addDays(new Date(), 1);
    this.dueDate.set(this.calendar.formatDateKey(tomorrow));
    this.showDatePicker.set(false);
  }

  setDueDate(date: string): void {
    this.dueDate.set(date);
  }

  clearDueDate(): void {
    this.dueDate.set(null);
    this.showDatePicker.set(false);
  }

  isTodaySelected(): boolean {
    return this.dueDate() === this.calendar.todayKey();
  }

  isTomorrowSelected(): boolean {
    const tomorrow = this.calendar.addDays(new Date(), 1);
    return this.dueDate() === this.calendar.formatDateKey(tomorrow);
  }

  private messageFromError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { errors?: string[]; error?: string } | null;
      if (Array.isArray(body?.errors) && body.errors.length > 0) return body.errors.join(' ');
      if (body?.error) return body.error;
    }

    return this.isEditingTask()
      ? this.i18n.text('Could not update task.')
      : this.i18n.text(`Could not create ${this.entityName().toLowerCase()}.`);
  }

  private entityName(): string {
    if (this.mode() === 'habit') return 'Habit';
    if (this.mode() === 'project') return 'Project';
    return 'Task';
  }

  private toTimeOnly(value: string): string | null {
    if (!value) return null;
    return value.length === 5 ? `${value}:00` : value;
  }

  private hydrateTaskEdit(): void {
    const task = this.taskEdit();
    if (!task || this.mode() !== 'task') return;
    this.title.set(task.title);
    this.description.set(task.description ?? '');
    this.dueDate.set(task.dueDate);
    this.dueTime.set(task.dueTime?.slice(0, 5) ?? '');
    this.isCountable.set(task.isCountableInProgress);
  }
}
