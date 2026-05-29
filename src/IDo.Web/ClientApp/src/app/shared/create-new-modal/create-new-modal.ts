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
        class="w-full max-w-[448px] bg-surface-container rounded-t-[28px] shadow-[0px_-10px_40px_rgba(0,0,0,0.5)] flex flex-col transform transition-transform duration-300 translate-y-0 max-h-[82vh]">

        <button type="button" class="w-full flex justify-center pt-sm pb-xs cursor-grab active:cursor-grabbing border-none bg-transparent" aria-label="Close create modal" (click)="closeClicked.emit()">
          <div class="w-12 h-1.5 bg-outline-variant rounded-full opacity-60"></div>
        </button>

        <div class="px-margin-mobile pt-sm pb-md flex justify-between items-start shrink-0">
          <div class="min-w-0">
            <p class="m-0 text-label-md font-label-md text-primary uppercase">New todo</p>
            <h2 class="text-headline-lg-mobile font-headline-lg-mobile text-on-surface m-0 mt-1">Create task</h2>
          </div>
          <button type="button" (click)="closeClicked.emit()" class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form class="flex-1 overflow-y-auto px-margin-mobile pb-[104px] flex flex-col gap-md hide-scrollbar" (submit)="submit($event)">
          <label class="flex flex-col gap-xs">
            <span class="text-label-md font-label-md text-on-surface-variant uppercase">Title</span>
            <input
              [value]="title()"
              (input)="title.set(inputValue($event))"
              type="text"
              placeholder="What do you need to do?"
              class="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-md py-sm text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              required />
          </label>

          <label class="flex flex-col gap-xs">
            <span class="text-label-md font-label-md text-on-surface-variant uppercase">Description</span>
            <textarea
              [value]="description()"
              (input)="description.set(inputValue($event))"
              rows="3"
              placeholder="Optional details"
              class="w-full resize-none bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-md py-sm text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary focus:outline-none transition-all"></textarea>
          </label>

          <div class="grid grid-cols-2 gap-sm">
            <label class="flex flex-col gap-xs">
              <span class="text-label-md font-label-md text-on-surface-variant uppercase">Date</span>
              <input
                [value]="dueDate()"
                (input)="dueDate.set(inputValue($event))"
                type="date"
                class="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-md py-sm text-body-md font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
            </label>

            <label class="flex flex-col gap-xs">
              <span class="text-label-md font-label-md text-on-surface-variant uppercase">Time</span>
              <input
                [value]="dueTime()"
                (input)="dueTime.set(inputValue($event))"
                type="time"
                class="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-md py-sm text-body-md font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
            </label>
          </div>

          <label class="flex items-center justify-between gap-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 px-md py-sm">
            <span class="text-body-md font-body-md text-on-surface">Count in progress</span>
            <input type="checkbox" [checked]="isCountable()" (change)="isCountable.set(checkedValue($event))" class="w-5 h-5 accent-primary" />
          </label>

          @if (error()) {
            <div class="rounded-xl border border-error/40 bg-error-container/30 text-on-error-container px-md py-sm text-body-md font-body-md">
              {{ error() }}
            </div>
          }
        </form>

        <div class="absolute bottom-0 left-0 w-full p-margin-mobile bg-gradient-to-t from-surface-container via-surface-container to-transparent pt-xl shrink-0 rounded-b-xl border-t border-outline-variant/10">
          <button type="button" (click)="submit()" [disabled]="isSubmitting()" class="w-full bg-primary text-on-primary py-md rounded-xl text-headline-md font-headline-md font-bold shadow-[0_4px_14px_rgba(0,230,246,0.22)] hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-xs">
            Create todo
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

  private messageFromError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { errors?: string[]; error?: string } | null;
      if (Array.isArray(body?.errors) && body.errors.length > 0) return body.errors.join(' ');
      if (body?.error) return body.error;
    }

    return 'Could not create task.';
  }
}
