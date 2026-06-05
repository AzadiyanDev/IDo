import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-update-modal',
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[110] flex items-center justify-center px-margin-mobile bg-black/55 backdrop-blur-md">
        <div class="w-full max-w-[320px] rounded-[28px] border border-white/10 bg-surface-container/85 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl px-xl py-xl flex flex-col items-center gap-lg text-center">
          <div class="h-14 w-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-[0_0_30px_rgba(0,230,246,0.22)]">
            <span class="material-symbols-outlined text-[30px]">system_update_alt</span>
          </div>

          <div class="flex flex-col gap-xs">
            <h2 class="m-0 text-headline-md font-headline-md text-on-surface">{{ i18n.text('Update available') }}</h2>
            <p class="m-0 text-body-md font-body-md text-on-surface-variant">{{ i18n.text('A new version is ready. Update now to clear cached files and load the latest fixes.') }}</p>
          </div>

          <button type="button" (click)="updateClicked.emit()" class="w-full h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center gap-sm text-body-lg font-body-lg font-semibold active:scale-[0.98] transition-transform">
            <span class="material-symbols-outlined text-[20px]">refresh</span>
            {{ i18n.text('Update') }}
          </button>
        </div>
      </div>
    }
  `
})
export class AppUpdateModalComponent {
  readonly i18n = inject(I18nService);
  open = input(false);
  updateClicked = output<void>();
}
