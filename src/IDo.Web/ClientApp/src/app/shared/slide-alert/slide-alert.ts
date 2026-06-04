import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-slide-alert',
  template: `
    @if (open()) {
      <div class="fixed left-0 right-0 top-0 z-[90] flex justify-center px-margin-mobile pt-md pointer-events-none">
        <div class="slide-alert w-full max-w-[400px] rounded-2xl border border-white/10 bg-surface-container/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] px-md py-sm flex items-center gap-sm pointer-events-auto">
          <div class="w-9 h-9 rounded-full bg-theme-purple-bright/15 text-theme-purple-bright flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[20px]">{{ icon() }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="m-0 text-body-md font-body-md text-on-surface font-semibold leading-tight">{{ i18n.text(title()) }}</p>
            <p class="m-0 mt-0.5 text-label-md font-label-md text-on-surface-variant leading-tight truncate">{{ i18n.text(message()) }}</p>
          </div>
          @if (actionText()) {
            <button type="button" (click)="actionClicked.emit()" class="px-sm py-1.5 rounded-full bg-theme-purple-bright/15 text-theme-purple-bright text-label-md font-label-md hover:bg-theme-purple-bright/25 transition-colors shrink-0">
              {{ i18n.text(actionText()) }}
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .slide-alert {
      animation: alert-slide 4.2s cubic-bezier(.22, 1, .36, 1) both;
    }

    @keyframes alert-slide {
      0% {
        opacity: 0;
        transform: translateY(-120%);
      }
      12%, 82% {
        opacity: 1;
        transform: translateY(0);
      }
      100% {
        opacity: 0;
        transform: translateY(-120%);
      }
    }
  `]
})
export class SlideAlertComponent {
  readonly i18n = inject(I18nService);
  open = input(false);
  icon = input('person_add');
  title = input('Notification');
  message = input('');
  actionText = input<string | null>(null);
  actionClicked = output<void>();
}
