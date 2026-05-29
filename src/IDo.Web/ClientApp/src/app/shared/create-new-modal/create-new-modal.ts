import { Component, signal, output } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TasksService } from '../../core/tasks.service';
import { LoadingModalComponent } from '../loading-modal/loading-modal';

@Component({
  selector: 'app-create-new-modal',
  imports: [LoadingModalComponent],
  template: `
    <div
      class="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 transition-opacity flex items-end justify-center"
      role="button"
      tabindex="0"
      (click)="closeOnBackdrop($event)"
      (keydown.enter)="closeOnBackdrop($event)"
      (keydown.space)="closeOnBackdrop($event)">

      <div
        role="dialog"
        aria-modal="true"
        class="w-[calc(100%-32px)] max-w-[560px] bg-surface-container rounded-t-[34px] shadow-[0px_-18px_60px_rgba(0,0,0,0.6)] flex flex-col transform transition-transform duration-300 translate-y-0 h-[80vh] overflow-hidden">

        <button type="button" class="w-full flex justify-center pt-sm pb-xs cursor-grab active:cursor-grabbing border-none bg-transparent" aria-label="Close create modal" (click)="closeClicked.emit()">
          <div class="w-[60px] h-1.5 bg-outline-variant rounded-full opacity-60"></div>
        </button>

        <div class="px-lg pt-sm pb-md flex justify-between items-start shrink-0">
          <div class="min-w-0">
            <h2 class="text-[26px] leading-[32px] font-semibold text-on-surface m-0">Create New</h2>
            <p class="text-body-lg font-body-lg text-on-surface-variant m-0 mt-1">Add a task for today</p>
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
              placeholder="What do you need to do?"
              class="w-full h-[52px] bg-surface-container-lowest border-none rounded-full px-lg text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              required />

            <div class="relative">
              <span class="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[25px]">notes</span>
              <input
                [value]="description()"
                (input)="description.set(inputValue($event))"
                type="text"
                placeholder="Description (optional)"
                class="w-full h-[48px] bg-surface-container-lowest border-none rounded-full pl-[54px] pr-lg text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
            </div>
          </div>

          <div class="flex flex-col gap-sm">
            <span class="text-label-md font-label-md text-on-surface-variant uppercase">Date</span>
            <div class="flex flex-wrap gap-xs">
              <button type="button" (click)="setToday()" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                [class.bg-primary-container]="isTodaySelected()"
                [class.text-on-primary-container]="isTodaySelected()"
                [class.bg-surface-container-highest]="!isTodaySelected()"
                [class.text-on-surface]="!isTodaySelected()">
                Today
              </button>
              <button type="button" (click)="setTomorrow()" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                [class.bg-primary-container]="isTomorrowSelected()"
                [class.text-on-primary-container]="isTomorrowSelected()"
                [class.bg-surface-container-highest]="!isTomorrowSelected()"
                [class.text-on-surface]="!isTomorrowSelected()">
                Tomorrow
              </button>
              <button type="button" (click)="showDatePicker.set(!showDatePicker())" class="px-md py-3 rounded-full bg-surface-container-highest text-on-surface text-body-md font-body-md font-semibold flex items-center gap-xs hover:bg-surface-variant transition-colors">
                <span class="material-symbols-outlined text-[22px]">calendar_month</span>
                Pick Date
              </button>
            </div>
            @if (showDatePicker()) {
              <input
                [value]="dueDate()"
                (input)="dueDate.set(inputValue($event))"
                type="date"
                class="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full px-md py-sm text-body-md font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
            }
          </div>

          <div class="flex flex-col gap-sm">
            <span class="text-label-md font-label-md text-on-surface-variant uppercase">Reminder</span>
            <div class="flex flex-wrap gap-xs">
              <button type="button" (click)="dueTime.set('')" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                [class.bg-primary-container]="!dueTime()"
                [class.text-on-primary-container]="!dueTime()"
                [class.bg-surface-container-highest]="dueTime()"
                [class.text-on-surface]="dueTime()">
                No reminder
              </button>
              <button type="button" (click)="dueTime.set('10:00')" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                [class.bg-primary-container]="dueTime() === '10:00'"
                [class.text-on-primary-container]="dueTime() === '10:00'"
                [class.bg-surface-container-highest]="dueTime() !== '10:00'"
                [class.text-on-surface]="dueTime() !== '10:00'">
                10:00 AM
              </button>
              <button type="button" (click)="dueTime.set('14:00')" class="px-md py-3 rounded-full text-body-md font-body-md font-semibold transition-colors"
                [class.bg-primary-container]="dueTime() === '14:00'"
                [class.text-on-primary-container]="dueTime() === '14:00'"
                [class.bg-surface-container-highest]="dueTime() !== '14:00'"
                [class.text-on-surface]="dueTime() !== '14:00'">
                2:00 PM
              </button>
              <button type="button" (click)="showTimePicker.set(!showTimePicker())" class="w-11 h-11 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:bg-surface-variant transition-colors">
                <span class="material-symbols-outlined text-[30px]">add</span>
              </button>
            </div>
            @if (showTimePicker()) {
              <input
                [value]="dueTime()"
                (input)="dueTime.set(inputValue($event))"
                type="time"
                class="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-full px-md py-sm text-body-md font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
            }
          </div>

          @if (error()) {
            <div class="rounded-xl border border-error/40 bg-error-container/30 text-on-error-container px-md py-sm text-body-md font-body-md">
              {{ error() }}
            </div>
          }
        </form>

        <div class="absolute bottom-0 left-0 w-full px-lg pb-lg pt-xxl bg-gradient-to-t from-surface-container via-surface-container to-transparent shrink-0">
          <button type="button" (click)="submit()" [disabled]="isSubmitting()" class="w-full bg-primary-container text-on-primary-container py-md rounded-full text-headline-md font-headline-md font-bold shadow-[0_12px_26px_rgba(0,230,246,0.22)] hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-xs">
            Create Task
            <span class="material-symbols-outlined">arrow_upward</span>
          </button>
        </div>
      </div>
    </div>

    <app-loading-modal [open]="isSubmitting()" title="Creating todo" message="Adding it to today" />
  `
})
export class CreateNewModalComponent {
  closeClicked = output<void>();
  created = output<void>();
  title = signal('');
  description = signal('');
  dueDate = signal(new Date().toISOString().slice(0, 10));
  dueTime = signal('');
  showDatePicker = signal(false);
  showTimePicker = signal(false);
  isCountable = signal(true);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  constructor(private readonly tasks: TasksService) {}

  closeOnBackdrop(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeClicked.emit();
    }
  }

  async submit(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.isSubmitting()) return;
    if (!this.title().trim()) {
      this.error.set('Task title is required.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      await this.tasks.createPersonalTask({
        title: this.title().trim(),
        description: this.description().trim() || null,
        color: null,
        icon: null,
        dueDate: this.dueDate() || null,
        dueTime: this.dueTime() || null,
        reminderAtUtc: null,
        assigneeUserId: null,
        projectId: null,
        sectionId: null,
        habitId: null,
        isCountableInProgress: this.isCountable()
      });
      window.dispatchEvent(new CustomEvent('ido:task-created'));
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

  setToday(): void {
    this.dueDate.set(this.formatDate(new Date()));
    this.showDatePicker.set(false);
  }

  setTomorrow(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.dueDate.set(this.formatDate(tomorrow));
    this.showDatePicker.set(false);
  }

  isTodaySelected(): boolean {
    return this.dueDate() === this.formatDate(new Date());
  }

  isTomorrowSelected(): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.dueDate() === this.formatDate(tomorrow);
  }

  private messageFromError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { errors?: string[]; error?: string } | null;
      if (Array.isArray(body?.errors) && body.errors.length > 0) return body.errors.join(' ');
      if (body?.error) return body.error;
    }

    return 'Could not create task.';
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
