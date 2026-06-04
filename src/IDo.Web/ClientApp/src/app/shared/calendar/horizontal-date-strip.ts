import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, input, output, signal } from '@angular/core';
import { CalendarService } from '../../core/calendar.service';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'app-horizontal-date-strip',
  template: `
    <div class="relative -mx-margin-mobile">
      @if (todayButtonSide(); as side) {
        <button
          type="button"
          (click)="jumpToToday()"
          class="absolute top-1/2 -translate-y-1/2 z-20 min-h-10 px-sm rounded-full border border-primary/35 bg-theme-elevated/95 text-primary shadow-[0_8px_24px_rgba(0,0,0,0.34)] backdrop-blur-md flex items-center gap-xs text-label-md font-label-md font-semibold"
          [class.left-2]="side === 'left'"
          [class.right-2]="side === 'right'">
          @if (side === 'left') {
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          }
          {{ i18n.text('Today') }}
          @if (side === 'right') {
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          }
        </button>
      }
      <div #scroller (scroll)="onStripScroll()" class="flex overflow-x-auto hide-scrollbar gap-sm py-xs snap-x px-margin-mobile">
        @for (day of days(); track day.key) {
          <button
            type="button"
            (click)="selectDate(day.key)"
            class="flex flex-col items-center justify-center min-w-[64px] h-[88px] rounded-full snap-center shrink-0 border relative transition-colors"
            [attr.data-date]="day.key"
            [attr.title]="day.holidayTitle"
            [class.bg-primary-container]="day.isSelected"
            [class.text-on-primary-container]="day.isSelected"
            [class.border-primary-container]="day.isSelected && !day.isHoliday"
            [class.bg-theme-surface]="!day.isSelected"
            [class.text-on-surface-variant]="!day.isSelected && !day.isHoliday"
            [class.border-theme-border]="!day.isSelected && !day.isHoliday"
            [class.border-error]="day.isHoliday"
            [class.text-error]="day.isHoliday && !day.isSelected">
            <span class="text-label-md font-label-md uppercase mb-1" [class.font-bold]="day.isToday || day.isSelected">{{ day.weekday }}</span>
            <span class="text-headline-md font-headline-md" [class.font-bold]="day.isToday || day.isSelected">{{ day.dayOfMonth }}</span>
            <span class="text-[10px] leading-none mt-0.5">{{ day.month }}</span>
            @if (day.isToday) {
              <span class="absolute -bottom-1 w-1.5 h-1.5 rounded-full" [class.bg-theme-bg]="!day.isHoliday" [class.bg-error]="day.isHoliday"></span>
            } @else if (day.isHoliday) {
              <span class="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-error"></span>
            }
          </button>
        }
      </div>
    </div>
  `
})
export class HorizontalDateStripComponent implements AfterViewInit, OnDestroy {
  private readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);
  private hasView = false;
  private scrollFrame: number | null = null;

  @ViewChild('scroller') private scroller?: ElementRef<HTMLDivElement>;

  readonly selectedDate = input<string>(this.calendar.todayKey());
  readonly selectedDateChange = output<string>();
  readonly days = computed(() => this.calendar.buildTimeline(this.selectedDate() || this.calendar.todayKey()));
  readonly todayButtonSide = signal<'left' | 'right' | null>(null);

  constructor() {
    effect(() => {
      const selectedDate = this.selectedDate();
      this.days();
      if (this.hasView) this.queueScrollToDate(selectedDate, 'smooth');
    });
  }

  ngAfterViewInit(): void {
    this.hasView = true;
    this.queueScrollToDate(this.selectedDate(), 'auto');
  }

  ngOnDestroy(): void {
    if (this.scrollFrame !== null) cancelAnimationFrame(this.scrollFrame);
  }

  selectDate(date: string): void {
    this.calendar.setSelectedTaskDate(date);
    this.selectedDateChange.emit(date);
  }

  jumpToToday(): void {
    const today = this.calendar.todayKey();
    this.calendar.setSelectedTaskDate(today);
    this.selectedDateChange.emit(today);
    this.queueScrollToDate(today, 'smooth');
  }

  onStripScroll(): void {
    this.queueTodayButtonUpdate();
  }

  private queueScrollToDate(date: string, behavior: ScrollBehavior): void {
    window.setTimeout(() => {
      this.scrollToDate(date, behavior);
      this.updateTodayButton();
    });
  }

  private scrollToDate(date: string, behavior: ScrollBehavior): void {
    const scroller = this.scroller?.nativeElement;
    const button = scroller?.querySelector<HTMLElement>(`[data-date="${date}"]`);
    if (!scroller || !button) return;

    button.scrollIntoView({ behavior, block: 'nearest', inline: 'center' });
  }

  private queueTodayButtonUpdate(): void {
    if (this.scrollFrame !== null) cancelAnimationFrame(this.scrollFrame);
    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = null;
      this.updateTodayButton();
    });
  }

  private updateTodayButton(): void {
    const scroller = this.scroller?.nativeElement;
    if (!scroller) return;

    const today = this.calendar.todayKey();
    const todayButton = scroller.querySelector<HTMLElement>(`[data-date="${today}"]`);
    if (!todayButton) {
      this.todayButtonSide.set(this.sideForTodayOutsideTimeline(today));
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const todayRect = todayButton.getBoundingClientRect();
    const tolerance = 10;
    if (todayRect.right < scrollerRect.left + tolerance) {
      this.todayButtonSide.set('left');
    } else if (todayRect.left > scrollerRect.right - tolerance) {
      this.todayButtonSide.set('right');
    } else {
      this.todayButtonSide.set(null);
    }
  }

  private sideForTodayOutsideTimeline(today: string): 'left' | 'right' | null {
    const selectedDate = this.selectedDate();
    if (selectedDate === today) return null;

    const todayIsBeforeSelection = selectedDate > today;
    if (this.i18n.isRtl()) return todayIsBeforeSelection ? 'right' : 'left';
    return todayIsBeforeSelection ? 'left' : 'right';
  }
}
