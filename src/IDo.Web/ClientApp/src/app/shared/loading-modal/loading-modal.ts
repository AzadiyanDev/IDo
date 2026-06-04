import { Component, inject, input } from '@angular/core';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-loading-modal',
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center px-margin-mobile bg-black/45 backdrop-blur-md">
        <div class="w-full max-w-[300px] rounded-[30px] border border-white/10 bg-surface-container/70 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl px-xl py-xl flex flex-col items-center gap-lg">
          <div class="relative h-20 w-20 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border border-primary/20"></div>
            <div class="absolute inset-2 rounded-full border border-secondary/20"></div>
            <div class="loading-ring absolute inset-0 rounded-full"></div>
            <div class="loading-orbit absolute inset-0 rounded-full"></div>
            <div class="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shadow-[0_0_30px_rgba(0,230,246,0.26)]">
              <span class="material-symbols-outlined text-[24px]">hourglass_top</span>
            </div>
          </div>

          <div class="text-center flex flex-col gap-xs">
            <h2 class="m-0 text-headline-md font-headline-md text-on-surface">{{ i18n.text(title()) }}</h2>
            <p class="m-0 text-body-md font-body-md text-on-surface-variant">{{ i18n.text(message()) }}</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-ring {
      background:
        conic-gradient(from 120deg, transparent 0 18%, var(--color-primary) 34%, var(--color-secondary) 54%, transparent 72% 100%);
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
      mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
      animation: loader-spin 1s linear infinite;
    }

    .loading-orbit::before {
      content: "";
      position: absolute;
      left: 50%;
      top: -3px;
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--color-primary);
      box-shadow: 0 0 18px rgba(0, 230, 246, 0.8);
      transform: translateX(-50%);
    }

    .loading-orbit {
      animation: loader-spin 1.7s cubic-bezier(.55, .1, .45, .9) infinite;
    }

    @keyframes loader-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class LoadingModalComponent {
  readonly i18n = inject(I18nService);
  open = input(false);
  title = input('Please wait');
  message = input('Working on your request');
}
