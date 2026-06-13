import { Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-task-rollover-modal',
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[105] flex items-center justify-center px-margin-mobile bg-black/55 backdrop-blur-md">
        <div class="w-full max-w-[340px] rounded-[28px] border border-white/10 bg-surface-container/90 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl px-xl py-xl flex flex-col gap-lg text-center">
          <div class="mx-auto h-14 w-14 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shadow-[0_0_30px_rgba(0,244,185,0.18)]">
            <span class="material-symbols-outlined text-[30px]">today</span>
          </div>

          <div class="flex flex-col gap-xs">
            <h2 class="m-0 text-headline-md font-headline-md text-on-surface">{{ i18n.text('Move unfinished tasks?') }}</h2>
            <p class="m-0 text-body-md font-body-md text-on-surface-variant">{{ promptMessage() }}</p>
          </div>

          @if (error()) {
            <p class="m-0 rounded-xl border border-error/35 bg-error-container/30 px-md py-sm text-body-md font-body-md text-on-error-container">
              {{ error() }}
            </p>
          }

          <div class="grid grid-cols-2 gap-sm">
            <button
              type="button"
              (click)="dismissClicked.emit()"
              [disabled]="loading()"
              class="h-12 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center text-body-md font-body-md font-semibold disabled:opacity-55 active:scale-[0.98] transition-transform">
              {{ i18n.text('Not now') }}
            </button>
            <button
              type="button"
              (click)="confirmClicked.emit()"
              [disabled]="loading()"
              class="h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center gap-xs text-body-md font-body-md font-semibold disabled:opacity-55 active:scale-[0.98] transition-transform">
              @if (loading()) {
                <span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              }
              {{ loading() ? i18n.text('Moving tasks...') : i18n.text('Move to today') }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class TaskRolloverModalComponent {
  readonly i18n = inject(I18nService);

  open = input(false);
  count = input(0);
  loading = input(false);
  error = input<string | null>(null);
  confirmClicked = output<void>();
  dismissClicked = output<void>();

  readonly promptMessage = computed(() => this.i18n.language() === 'fa'
    ? `${this.i18n.number(this.count())} تسک دیروز انجام نشده است. می‌خواهی به امروز منتقلشان کنم؟`
    : `You left ${this.count()} unfinished task${this.count() === 1 ? '' : 's'} yesterday. Move ${this.count() === 1 ? 'it' : 'them'} to today?`);
}
