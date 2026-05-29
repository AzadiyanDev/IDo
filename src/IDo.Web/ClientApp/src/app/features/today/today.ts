import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-today',
  template: `
    <!-- TopAppBar -->
    <header class="w-full top-0 sticky bg-theme-bg z-40 py-md">
      <div class="flex justify-between items-center px-margin-mobile w-full">
        <div class="flex items-center gap-md">
          <div class="w-10 h-10 rounded-full overflow-hidden border border-theme-border flex-shrink-0 bg-theme-surface flex items-center justify-center">
            @if (avatarUrl()) {
              <img [src]="avatarUrl()" [alt]="displayName()" class="w-full h-full object-cover"/>
            } @else {
              <span class="text-body-md font-body-md font-semibold text-primary">{{ initials() }}</span>
            }
          </div>
          <div class="min-w-0">
            <h1 class="text-headline-lg-mobile font-headline-lg-mobile text-primary leading-tight truncate">Good Morning, {{ displayName() }}</h1>
            <p class="text-body-md font-body-md text-on-surface-variant leading-tight">Your plan for today is ready</p>
          </div>
        </div>
        <button class="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity flex-shrink-0 relative">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">notifications</span>
          <span class="absolute top-2 right-2 w-2 h-2 bg-theme-teal rounded-full"></span>
        </button>
      </div>
    </header>

    <div class="px-margin-mobile flex flex-col gap-xl">
      <!-- Weekly Calendar -->
      <section>
        <div class="flex overflow-x-auto hide-scrollbar gap-sm py-xs snap-x -mx-margin-mobile px-margin-mobile">
          @for (day of calendarDays(); track day.key) {
            <div
              class="flex flex-col items-center justify-center min-w-[64px] h-[88px] rounded-full snap-center shrink-0 border relative"
              [class.bg-primary-container]="day.isToday"
              [class.text-on-primary-container]="day.isToday"
              [class.border-primary-container]="day.isToday"
              [class.bg-theme-surface]="!day.isToday"
              [class.text-on-surface-variant]="!day.isToday"
              [class.border-theme-border]="!day.isToday"
            >
              <span class="text-label-md font-label-md uppercase mb-1" [class.font-bold]="day.isToday">{{ day.weekday }}</span>
              <span class="text-headline-md font-headline-md" [class.font-bold]="day.isToday">{{ day.dayOfMonth }}</span>
              <span class="text-[10px] leading-none mt-0.5" [class.text-on-primary-container]="day.isToday" [class.text-on-surface-variant]="!day.isToday">{{ day.month }}</span>
              @if (day.isToday) {
                <span class="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-theme-bg"></span>
              }
            </div>
          }
        </div>
      </section>

      <!-- Summary Card -->
      <section class="bg-theme-surface rounded-2xl border border-theme-border p-lg flex items-center justify-between relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-theme-teal opacity-5 rounded-full blur-2xl"></div>
        
        <div class="flex flex-col gap-xs z-10">
          <h2 class="text-headline-md font-headline-md text-on-surface">Today</h2>
          <p class="text-body-md font-body-md text-on-surface-variant">12 items for today</p>
          <div class="flex gap-sm mt-md">
            <div class="flex items-center gap-xs">
              <span class="w-2 h-2 rounded-full bg-primary-container"></span>
              <span class="text-label-md font-label-md text-on-surface-variant">7 Tasks</span>
            </div>
            <div class="flex items-center gap-xs">
              <span class="w-2 h-2 rounded-full bg-theme-habit-accent"></span>
              <span class="text-label-md font-label-md text-on-surface-variant">3 Habits</span>
            </div>
          </div>
        </div>
        
        <div class="w-24 h-24 relative z-10 shrink-0">
          <svg class="block mx-auto max-w-full max-h-[250px] text-theme-teal" viewBox="0 0 36 36">
            <path class="fill-none stroke-theme-border stroke-[3.8]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
            <path class="fill-none stroke-[3.8] stroke-current stroke-width-[3.8] stroke-linecap-round" stroke-dasharray="58, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center flex-col">
            <span class="text-headline-md font-headline-md font-bold leading-none">58%</span>
          </div>
        </div>
      </section>

      <!-- Personal Tasks -->
      <section class="flex flex-col gap-md">
        <div class="flex justify-between items-center">
          <h3 class="text-headline-md font-headline-md text-on-surface">Personal Tasks</h3>
          <button class="text-primary-container text-body-md font-body-md hover:underline">See All</button>
        </div>
        
        <div class="flex flex-col gap-sm">
          <!-- Task 1 -->
          <div class="bg-theme-surface rounded-2xl border border-theme-border p-md flex items-center gap-md cursor-pointer hover:bg-surface-container-high transition-colors">
            <div class="w-6 h-6 rounded-full border-2 border-theme-border flex items-center justify-center shrink-0 transition-all duration-200"></div>
            <div class="flex flex-col flex-1 pl-1">
              <span class="text-body-lg font-body-lg text-on-surface font-medium">Review Design System</span>
              <span class="text-label-md font-label-md text-primary-container mt-0.5">10:00 AM - 11:30 AM</span>
            </div>
          </div>
          
          <!-- Task 2 (Current) -->
          <div class="bg-theme-surface rounded-2xl border border-theme-border p-md flex items-center gap-md cursor-pointer hover:bg-surface-container-high transition-colors relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary-container rounded-l-2xl"></div>
            <div class="w-6 h-6 rounded-full border-2 border-theme-border flex items-center justify-center shrink-0"></div>
            <div class="flex flex-col flex-1 pl-1">
              <span class="text-body-lg font-body-lg text-on-surface font-medium">Team Sync</span>
              <span class="text-label-md font-label-md text-primary-container mt-0.5">2:00 PM - 3:00 PM</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-on-surface-variant text-[18px]">group</span>
            </div>
          </div>

          <!-- Task 3 (Done) -->
          <div class="bg-theme-surface rounded-2xl border border-theme-border p-md flex items-center gap-md opacity-60 transition-all">
            <div class="w-6 h-6 rounded-full border-2 border-primary-container bg-primary-container flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[14px] text-theme-bg font-bold" style="font-variation-settings: 'FILL' 1;">check</span>
            </div>
            <div class="flex flex-col flex-1 pl-1">
              <span class="text-body-lg font-body-lg text-on-surface font-medium line-through decoration-on-surface-variant">Finish Case Study</span>
              <span class="text-label-md font-label-md text-on-surface-variant mt-0.5">Done</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Habits -->
      <section class="flex flex-col gap-md">
        <h3 class="text-headline-md font-headline-md text-on-surface">Habits</h3>
        <div class="flex overflow-x-auto hide-scrollbar gap-sm snap-x pb-xs -mx-margin-mobile px-margin-mobile">
          
          <!-- Habit 1 -->
          <div class="bg-theme-habit-bg rounded-2xl p-md min-w-[140px] flex flex-col justify-between h-[120px] snap-center shrink-0 border border-theme-habit-accent/10">
            <div class="flex justify-between items-start z-10 w-full mb-4">
              <div class="w-8 h-8 rounded-full bg-theme-habit-accent/20 flex items-center justify-center text-theme-habit-accent">
                <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">menu_book</span>
              </div>
              <span class="text-label-md font-label-md text-theme-habit-accent font-bold">5 🔥</span>
            </div>
            <div class="z-10 w-full">
              <span class="text-body-md font-body-md text-white font-medium block">Reading</span>
              <span class="text-label-md font-label-md text-white/60">30 mins</span>
            </div>
          </div>

          <!-- Habit 2 (Done) -->
          <div class="bg-theme-surface border border-theme-habit-accent rounded-2xl p-md min-w-[140px] flex flex-col justify-between h-[120px] snap-center shrink-0 relative overflow-hidden">
            <div class="absolute inset-0 bg-theme-habit-accent opacity-10"></div>
            <div class="flex justify-between items-start z-10 w-full mb-4">
              <div class="w-8 h-8 rounded-full bg-theme-habit-accent flex items-center justify-center text-theme-bg">
                <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">check</span>
              </div>
            </div>
            <div class="z-10 w-full">
              <span class="text-body-md font-body-md text-theme-habit-accent font-medium block">Workout</span>
              <span class="text-label-md font-label-md text-white/60">Done</span>
            </div>
          </div>

          <!-- Habit 3 -->
          <div class="bg-theme-surface rounded-2xl p-md min-w-[140px] flex flex-col justify-between h-[120px] snap-center shrink-0 border border-theme-border">
            <div class="flex justify-between items-start z-10 w-full mb-4">
              <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary-container">
                <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">water_drop</span>
              </div>
              <span class="text-label-md font-label-md text-on-surface-variant">6/8</span>
            </div>
            <div class="z-10 w-full">
              <span class="text-body-md font-body-md text-on-surface font-medium block">Drink Water</span>
              <div class="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden mt-1">
                <div class="h-full bg-primary-container rounded-full" style="width: 75%;"></div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      <!-- Projects -->
      <section class="flex flex-col gap-md">
        <h3 class="text-headline-md font-headline-md text-on-surface">Projects</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-sm">
          
          <div class="bg-theme-project-bg rounded-2xl p-md flex flex-col gap-sm border border-theme-project-accent/10 relative overflow-hidden">
            <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-theme-project-accent opacity-5 rounded-full blur-xl"></div>
            <div class="flex justify-between items-start z-10 w-full">
              <span class="px-2 py-1 bg-theme-project-accent/20 text-theme-project-accent text-label-md font-label-md rounded-full">In Progress</span>
              <div class="flex -space-x-2">
                <div class="w-6 h-6 rounded-full bg-surface-variant border-2 border-theme-project-bg"></div>
                <div class="w-6 h-6 rounded-full border-2 border-theme-project-bg bg-theme-project-accent text-theme-bg flex items-center justify-center text-[10px] font-bold">+2</div>
              </div>
            </div>
            <div class="z-10 mt-1">
              <h4 class="text-body-lg font-body-lg text-white font-medium">IDo App Design</h4>
              <p class="text-body-md font-body-md text-white/60 flex items-center gap-2 mt-1">
                <span class="w-1.5 h-1.5 rounded-full bg-theme-project-accent inline-block"></span> Finalize UI
              </p>
            </div>
          </div>

          <div class="bg-theme-surface rounded-2xl p-md flex flex-col gap-sm border border-theme-border">
            <div class="flex justify-between items-start w-full">
              <span class="px-2 py-1 bg-surface-variant text-on-surface-variant text-label-md font-label-md rounded-full">To Do</span>
              <div class="flex -space-x-2">
                <div class="w-6 h-6 rounded-full bg-surface-variant border-2 border-theme-surface"></div>
              </div>
            </div>
            <div class="mt-1">
              <h4 class="text-body-lg font-body-lg text-on-surface font-medium">Web Dev</h4>
              <p class="text-body-md font-body-md text-on-surface-variant flex items-center gap-2 mt-1">
                <span class="w-1.5 h-1.5 rounded-full border border-on-surface-variant inline-block"></span> API Integration
              </p>
            </div>
          </div>
          
        </div>
      </section>

      <!-- Task Request -->
      <section class="bg-theme-surface rounded-2xl border border-theme-purple-bright/20 p-md flex items-center justify-between mt-sm">
        <div class="flex items-center gap-sm">
          <div class="w-10 h-10 rounded-full bg-theme-purple-bright/10 flex items-center justify-center text-theme-purple-bright">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">person_add</span>
          </div>
          <div>
            <p class="text-body-md font-body-md text-white font-medium leading-tight">1 task request pending</p>
            <p class="text-label-md font-label-md text-white/50 leading-tight">From Alex</p>
          </div>
        </div>
        <button class="px-4 py-2 bg-theme-purple-bright/20 text-theme-purple-bright text-body-md font-body-md font-medium rounded-full hover:bg-theme-purple-bright/30 transition-colors">
          Review
        </button>
      </section>
      
    </div>
  `
})
export class TodayComponent {
  private readonly auth = inject(AuthService);
  private readonly today = new Date();

  readonly currentUser = this.auth.currentUser;
  readonly displayName = computed(() => {
    const user = this.currentUser();
    return user?.profile.fullName?.trim() || user?.userName || 'there';
  });
  readonly avatarUrl = computed(() => this.currentUser()?.profile.avatarUrl?.trim() || null);
  readonly initials = computed(() => this.displayName()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'U');
  readonly calendarDays = computed(() => this.buildCurrentWeek());

  private buildCurrentWeek(): CalendarDay[] {
    const weekStart = new Date(this.today);
    const dayOffset = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - dayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return {
        key: date.toISOString(),
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayOfMonth: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: this.isSameDate(date, this.today)
      };
    });
  }

  private isSameDate(left: Date, right: Date): boolean {
    return left.getFullYear() === right.getFullYear()
      && left.getMonth() === right.getMonth()
      && left.getDate() === right.getDate();
  }
}

interface CalendarDay {
  key: string;
  weekday: string;
  dayOfMonth: number;
  month: string;
  isToday: boolean;
}
