import { Component } from '@angular/core';

@Component({
  selector: 'app-habits',
  template: `
    <!-- TopAppBar -->
    <header class="w-full top-0 sticky bg-background flex items-center justify-between px-margin-mobile py-md z-40">
      <div class="flex items-center gap-md">
        <h1 class="font-display text-display text-on-surface m-0 leading-none">Habits</h1>
      </div>
      <div class="flex items-center gap-sm">
        <button class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-variant/50 transition-colors">
          <span class="material-symbols-outlined text-on-surface-variant" style="font-variation-settings: 'FILL' 0;">search</span>
        </button>
        <button class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-variant/50 transition-colors">
          <span class="material-symbols-outlined text-on-surface-variant" style="font-variation-settings: 'FILL' 0;">settings</span>
        </button>
      </div>
    </header>

    <div class="px-margin-mobile space-y-xl">
      <!-- Sub-headline -->
      <p class="font-body-md text-body-md text-on-surface-variant -mt-sm">Build small routines, every day.</p>
      
      <!-- Summary Card -->
      <section class="bg-surface-container border border-outline-variant rounded-3xl p-lg shadow-lg relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="flex items-center justify-between">
          <div class="space-y-xs">
            <h2 class="font-headline-md text-headline-md text-on-surface m-0">Today's Progress</h2>
            <p class="font-body-md text-body-md text-on-surface-variant m-0">3 of 5 completed</p>
            <div class="flex gap-sm mt-md pt-xs items-center">
              <div class="flex flex-col">
                <span class="font-headline-lg-mobile text-headline-lg-mobile text-primary">5</span>
                <span class="font-label-md text-label-md text-on-surface-variant">Total</span>
              </div>
              <div class="w-px h-8 bg-outline-variant/50"></div>
              <div class="flex flex-col">
                <span class="font-headline-lg-mobile text-headline-lg-mobile text-secondary">3</span>
                <span class="font-label-md text-label-md text-on-surface-variant">Done</span>
              </div>
              <div class="w-px h-8 bg-outline-variant/50"></div>
              <div class="flex flex-col">
                <span class="font-headline-lg-mobile text-headline-lg-mobile text-primary">2</span>
                <span class="font-label-md text-label-md text-on-surface-variant">Left</span>
              </div>
            </div>
          </div>
          
          <div class="relative w-20 h-20 bg-[conic-gradient(theme(colors.secondary)_60%,_theme(colors.surface-variant)_0)] rounded-full flex items-center justify-center">
            <div class="absolute w-[80%] h-[80%] bg-surface-container rounded-full"></div>
            <span class="relative z-10 font-headline-md text-headline-md text-on-surface">60%</span>
          </div>
        </div>
      </section>

      <!-- Streak Overview -->
      <section class="flex gap-md overflow-x-auto snap-x hide-scrollbar -mx-margin-mobile px-margin-mobile">
        <div class="snap-start shrink-0 w-40 bg-surface-container border border-outline-variant rounded-3xl p-md flex flex-col gap-xs">
          <div class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-tertiary text-[20px]" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
            <span class="font-label-md text-label-md text-on-surface-variant">Best Streak</span>
          </div>
          <div class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-1">12 Days</div>
        </div>
        
        <div class="snap-start shrink-0 w-40 bg-surface-container border border-outline-variant rounded-3xl p-md flex flex-col gap-xs">
          <div class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-secondary text-[20px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
            <span class="font-label-md text-label-md text-on-surface-variant">This Week</span>
          </div>
          <div class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-1">18 Done</div>
        </div>
        
        <div class="snap-start shrink-0 w-40 bg-surface-container border border-outline-variant rounded-3xl p-md flex flex-col gap-xs">
          <div class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-primary text-[20px]" style="font-variation-settings: 'FILL' 1;">insert_chart</span>
            <span class="font-label-md text-label-md text-on-surface-variant">Success</span>
          </div>
          <div class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-1">74%</div>
        </div>
      </section>

      <!-- Weekly Habit Calendar -->
      <section class="space-y-sm">
        <h3 class="font-headline-md text-headline-md text-on-surface m-0">Weekly Plan</h3>
        <div class="flex justify-between items-end bg-surface-container rounded-3xl p-md border border-outline-variant mt-sm">
          <div class="flex flex-col items-center gap-xs">
            <span class="font-label-md text-label-md text-on-surface-variant">M</span>
            <div class="w-8 h-8 rounded-full bg-secondary-container/30 flex items-center justify-center">
              <span class="material-symbols-outlined text-secondary text-[16px]" style="font-variation-settings: 'FILL' 1;">check</span>
            </div>
          </div>
          <div class="flex flex-col items-center gap-xs">
            <span class="font-label-md text-label-md text-on-surface-variant">T</span>
            <div class="w-8 h-8 rounded-full bg-secondary-container/30 flex items-center justify-center">
              <span class="material-symbols-outlined text-secondary text-[16px]" style="font-variation-settings: 'FILL' 1;">check</span>
            </div>
          </div>
          <div class="flex flex-col items-center gap-xs bg-surface-container px-xs py-sm rounded-full border border-outline-variant/50 -mb-sm pb-sm shadow-md">
            <span class="font-label-md text-label-md text-on-surface font-bold">W</span>
            <div class="w-10 h-10 rounded-full border-2 border-primary border-dashed flex items-center justify-center">
              <span class="material-symbols-outlined text-primary text-[20px]">circle</span>
            </div>
          </div>
          <div class="flex flex-col items-center gap-xs">
            <span class="font-label-md text-label-md text-on-surface-variant">T</span>
            <div class="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-primary"></div>
            </div>
          </div>
          <div class="flex flex-col items-center gap-xs">
            <span class="font-label-md text-label-md text-on-surface-variant">F</span>
            <div class="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-primary"></div>
            </div>
          </div>
          <div class="flex flex-col items-center gap-xs opacity-50">
            <span class="font-label-md text-label-md text-on-surface-variant">S</span>
            <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
              <span class="material-symbols-outlined text-on-surface-variant text-[16px]">bedtime</span>
            </div>
          </div>
          <div class="flex flex-col items-center gap-xs opacity-50">
            <span class="font-label-md text-label-md text-on-surface-variant">S</span>
            <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
              <span class="material-symbols-outlined text-on-surface-variant text-[16px]">bedtime</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Habit List Header & Filters -->
      <div>
        <div class="flex items-center justify-between">
          <h3 class="font-headline-md text-headline-md text-on-surface">Today's Habits</h3>
          <button class="flex items-center gap-1 bg-secondary text-on-secondary px-sm py-xs rounded-full font-label-md text-label-md hover:bg-secondary/90 transition-colors">
            <span class="material-symbols-outlined text-[16px]">add</span>
            New Habit
          </button>
        </div>
        
        <div class="flex gap-sm overflow-x-auto hide-scrollbar pb-xs mt-sm -mx-margin-mobile px-margin-mobile">
          <button class="shrink-0 px-md py-1.5 rounded-full bg-surface-container border border-outline-variant font-label-md text-label-md text-on-surface-variant">All</button>
          <button class="shrink-0 px-md py-1.5 rounded-full bg-secondary-container/20 border border-secondary/30 font-label-md text-label-md text-secondary">Today</button>
          <button class="shrink-0 px-md py-1.5 rounded-full bg-surface-container border border-outline-variant font-label-md text-label-md text-on-surface-variant">Done</button>
          <button class="shrink-0 px-md py-1.5 rounded-full bg-surface-container border border-outline-variant font-label-md text-label-md text-on-surface-variant">Rest</button>
        </div>
      </div>

      <!-- Habit Cards -->
      <div class="space-y-sm">
        <!-- Habit 1 -->
        <div class="bg-surface-container border border-outline-variant rounded-3xl p-md flex items-center justify-between active:scale-[0.98] transition-transform">
          <div class="flex items-center gap-md">
            <div class="w-6 h-6 rounded-full border-2 border-outline-variant flex items-center justify-center"></div>
            <div>
              <h4 class="font-body-lg text-body-lg text-on-surface m-0 leading-tight">Reading</h4>
              <div class="flex items-center gap-sm mt-1">
                <span class="font-label-md text-label-md text-on-surface-variant">30 min</span>
                <span class="w-1 h-1 rounded-full bg-outline-variant"></span>
                <div class="flex items-center gap-1 text-tertiary-fixed-dim">
                  <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
                  <span class="font-label-md text-label-md leading-none">5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Habit 2 (Done) -->
        <div class="bg-secondary-container/10 border border-secondary/20 rounded-3xl p-md flex items-center justify-between opacity-80">
          <div class="flex items-center gap-md">
            <div class="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px] font-bold" style="font-variation-settings: 'FILL' 1;">check</span>
            </div>
            <div>
              <h4 class="font-body-lg text-body-lg text-on-surface line-through decoration-on-surface-variant/50 m-0 leading-tight">Workout</h4>
              <div class="flex items-center gap-sm mt-1">
                <span class="font-label-md text-label-md text-on-surface-variant">Completed</span>
                <span class="w-1 h-1 rounded-full bg-outline-variant"></span>
                <div class="flex items-center gap-1 text-tertiary-fixed-dim">
                  <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
                  <span class="font-label-md text-label-md leading-none">8</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Habit 3 (Progress) -->
        <div class="bg-surface-container border border-outline-variant rounded-3xl p-md flex items-center justify-between">
          <div class="flex items-center gap-md w-full">
            <div class="w-6 h-6 rounded-full border-2 border-outline-variant flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[16px] text-primary">add</span>
            </div>
            <div class="flex-grow">
              <div class="flex justify-between items-end mb-2">
                <h4 class="font-body-lg text-body-lg text-on-surface m-0 leading-tight">Drink Water</h4>
                <span class="font-label-md text-label-md text-primary leading-tight">4/8</span>
              </div>
              <div class="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Habit 4 (Rest) -->
        <div class="bg-surface-container border border-outline-variant rounded-3xl p-md flex items-center justify-between opacity-50">
          <div class="flex items-center gap-md">
            <div class="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center">
              <span class="material-symbols-outlined text-[14px] text-on-surface-variant">bedtime</span>
            </div>
            <div>
              <h4 class="font-body-lg text-body-lg text-on-surface-variant m-0 leading-tight">Meditation</h4>
              <span class="font-label-md text-label-md text-on-surface-variant mt-1 block leading-tight">Rest Day</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Card -->
      <div class="bg-secondary-container/10 border border-secondary/20 rounded-3xl p-md flex items-start gap-md mt-lg mb-md">
        <span class="material-symbols-outlined text-secondary shrink-0" style="font-variation-settings: 'FILL' 1;">shield</span>
        <div>
          <h4 class="font-body-md text-body-md text-on-surface font-semibold m-0 leading-tight">Rest days don't break streaks</h4>
          <p class="font-label-md text-label-md text-on-surface-variant mt-1 m-0">Taking planned breaks helps maintain long-term consistency.</p>
        </div>
      </div>
    </div>
  `
})
export class HabitsComponent {}
