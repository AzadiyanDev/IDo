import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  template: `
    <header class="bg-theme-bg w-full top-0 flex justify-between items-center px-margin-mobile py-md sticky z-40">
      <div class="w-10 h-10 flex-shrink-0"></div> <!-- Spacer for centering -->
      <div class="text-center flex-1 mx-4">
        <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight m-0">Progress</h1>
        <p class="font-label-md text-label-md text-on-surface-variant opacity-80 mt-1 mb-0">Your performance at a glance</p>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button class="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity active:scale-95 transition-transform">
          <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 0;">calendar_today</span>
        </button>
      </div>
    </header>

    <div class="px-margin-mobile space-y-md pb-md">
      <!-- Time Range Selector -->
      <div class="flex bg-theme-surface p-1 rounded-full border border-theme-border">
        <button class="flex-1 py-2 px-4 rounded-full font-label-md text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-none outline-none bg-transparent">Day</button>
        <button class="flex-1 py-2 px-4 rounded-full font-label-md bg-theme-elevated text-theme-teal transition-colors shadow-sm cursor-pointer border-none outline-none">Week</button>
        <button class="flex-1 py-2 px-4 rounded-full font-label-md text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border-none outline-none bg-transparent">Month</button>
      </div>

      <!-- Weekly Progress Card -->
      <div class="bg-theme-surface rounded-[24px] p-lg border border-theme-border flex flex-col items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--color-theme-teal),_transparent)]"></div>
        
        <div class="relative w-40 h-40 flex items-center justify-center mb-6">
          <svg class="w-full h-full absolute top-0 left-0" viewBox="0 0 100 100">
            <!-- Background Ring -->
            <circle cx="50" cy="50" fill="none" r="45" stroke="#26324A" stroke-linecap="round" stroke-width="8"></circle>
            <!-- Progress Ring -->
            <circle cx="50" cy="50" fill="none" r="45" stroke="#5EEAD4" stroke-dasharray="282.7" stroke-dashoffset="67.8" stroke-linecap="round" stroke-width="8" class="transform -rotate-90 origin-center"></circle>
          </svg>
          <div class="flex flex-col items-center text-center">
            <span class="font-display text-theme-teal">76%</span>
            <span class="font-label-md text-on-surface-variant mt-1">Completion</span>
          </div>
        </div>
        
        <h3 class="font-headline-md text-on-surface mb-md z-10 text-center m-0 mt-2">42 items completed this week</h3>
        
        <div class="flex w-full justify-between gap-2 z-10 mt-4">
          <div class="flex flex-col items-center bg-theme-elevated rounded-xl p-3 flex-1 border border-theme-border/50">
            <span class="font-headline-md text-theme-blue">28</span>
            <span class="font-label-md text-on-surface-variant">Tasks</span>
          </div>
          <div class="flex flex-col items-center bg-theme-elevated rounded-xl p-3 flex-1 border border-theme-border/50">
            <span class="font-headline-md text-theme-green">12</span>
            <span class="font-label-md text-on-surface-variant">Habits</span>
          </div>
          <div class="flex flex-col items-center bg-theme-elevated rounded-xl p-3 flex-1 border border-theme-border/50">
            <span class="font-headline-md text-theme-purple-bright">2</span>
            <span class="font-label-md text-on-surface-variant">Projects</span>
          </div>
        </div>
      </div>

      <!-- Insight Card -->
      <div class="bg-theme-surface rounded-[24px] p-md flex gap-4 items-start border border-theme-border shadow-sm">
        <div class="w-10 h-10 rounded-full bg-theme-teal/20 flex-shrink-0 flex items-center justify-center">
          <span class="material-symbols-outlined text-theme-teal" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
        </div>
        <div>
          <h4 class="font-body-md font-semibold text-theme-teal mb-1 m-0">Weekly Insight</h4>
          <p class="font-body-md text-on-surface/90 leading-relaxed m-0 mt-1">You were most productive on Wednesday. Small consistent progress is better than a perfect day.</p>
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div class="grid grid-cols-2 gap-sm">
        <div class="bg-theme-surface rounded-[24px] p-md border border-theme-border flex flex-col relative overflow-hidden">
          <div class="w-8 h-8 rounded-full bg-theme-blue/10 flex items-center justify-center mb-3">
            <span class="material-symbols-outlined text-theme-blue text-sm">task_alt</span>
          </div>
          <span class="font-label-md text-on-surface-variant mb-1">Done Tasks</span>
          <div class="flex items-end gap-2 text-on-surface">
            <span class="font-headline-lg-mobile leading-none">28</span>
            <span class="font-label-md text-theme-blue mb-1 flex items-center leading-none"><span class="material-symbols-outlined text-[10px] mr-1">trending_up</span>12%</span>
          </div>
        </div>

        <div class="bg-theme-surface rounded-[24px] p-md border border-theme-border flex flex-col">
          <div class="w-8 h-8 rounded-full bg-theme-green/10 flex items-center justify-center mb-3">
            <span class="material-symbols-outlined text-theme-green text-sm">cycle</span>
          </div>
          <span class="font-label-md text-on-surface-variant mb-1">Habit Success</span>
          <div class="flex items-end gap-2 text-on-surface">
            <span class="font-headline-lg-mobile leading-none">84%</span>
            <span class="font-label-md text-theme-green mb-1 flex items-center leading-none"><span class="material-symbols-outlined text-[10px] mr-1">trending_up</span>6%</span>
          </div>
        </div>

        <div class="bg-theme-surface rounded-[24px] p-md border border-theme-border flex flex-col">
          <div class="w-8 h-8 rounded-full bg-theme-orange/10 flex items-center justify-center mb-3">
            <span class="material-symbols-outlined text-theme-orange text-sm">local_fire_department</span>
          </div>
          <span class="font-label-md text-on-surface-variant mb-1">Best Streak</span>
          <div class="flex items-end gap-2 text-on-surface">
            <span class="font-headline-lg-mobile leading-none">12</span>
            <span class="font-label-md text-theme-orange mb-1 leading-none">Days</span>
          </div>
        </div>

        <div class="bg-theme-surface rounded-[24px] p-md border border-theme-border flex flex-col">
          <div class="w-8 h-8 rounded-full bg-theme-rose/10 flex items-center justify-center mb-3">
            <span class="material-symbols-outlined text-theme-rose text-sm">error</span>
          </div>
          <span class="font-label-md text-on-surface-variant mb-1">Overdue</span>
          <div class="flex items-end gap-2 text-on-surface">
            <span class="font-headline-lg-mobile leading-none">3</span>
            <span class="font-label-md text-theme-rose mb-1 leading-none">Items</span>
          </div>
        </div>
      </div>

      <!-- Weekly Activity Chart -->
      <div class="bg-theme-surface rounded-[24px] p-lg border border-theme-border mt-md">
        <h3 class="font-headline-md text-on-surface mb-6 m-0">Activity</h3>
        <div class="flex justify-between items-end h-40 px-2 mt-4">
          
          <div class="flex flex-col items-center gap-2 group">
            <div class="w-8 md:w-10 h-24 bg-theme-elevated rounded-full flex flex-col-reverse overflow-hidden relative">
              <div class="w-full bg-theme-blue rounded-b-full transition-all duration-500 ease-out" style="height: 40%"></div>
              <div class="w-full bg-theme-green transition-all duration-500 ease-out" style="height: 20%"></div>
            </div>
            <span class="font-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">M</span>
          </div>
          
          <div class="flex flex-col items-center gap-2 group">
            <div class="w-8 md:w-10 h-24 bg-theme-elevated rounded-full flex flex-col-reverse overflow-hidden relative">
              <div class="w-full bg-theme-blue rounded-b-full transition-all duration-500 ease-out" style="height: 60%"></div>
              <div class="w-full bg-theme-green transition-all duration-500 ease-out" style="height: 30%"></div>
            </div>
            <span class="font-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">T</span>
          </div>
          
          <!-- Highlighted -->
          <div class="flex flex-col items-center gap-2 group">
            <div class="w-8 md:w-10 h-32 bg-theme-elevated rounded-full flex flex-col-reverse overflow-hidden relative shadow-[0_0_15px_rgba(125,211,252,0.2)] border border-theme-blue/30">
              <div class="w-full bg-theme-blue rounded-b-full transition-all duration-500 ease-out" style="height: 70%"></div>
              <div class="w-full bg-theme-green transition-all duration-500 ease-out" style="height: 30%"></div>
            </div>
            <span class="font-label-md text-theme-teal font-bold">W</span>
          </div>

          <div class="flex flex-col items-center gap-2 group">
            <div class="w-8 md:w-10 h-24 bg-theme-elevated rounded-full flex flex-col-reverse overflow-hidden relative">
              <div class="w-full bg-theme-blue rounded-b-full transition-all duration-500 ease-out" style="height: 50%"></div>
              <div class="w-full bg-theme-green transition-all duration-500 ease-out" style="height: 25%"></div>
            </div>
            <span class="font-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">T</span>
          </div>

          <div class="flex flex-col items-center gap-2 group">
            <div class="w-8 md:w-10 h-24 bg-theme-elevated rounded-full flex flex-col-reverse overflow-hidden relative">
              <div class="w-full bg-theme-blue rounded-b-full transition-all duration-500 ease-out" style="height: 45%"></div>
              <div class="w-full bg-theme-green transition-all duration-500 ease-out" style="height: 40%"></div>
            </div>
            <span class="font-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">F</span>
          </div>

          <div class="flex flex-col items-center gap-2 group">
            <div class="w-8 md:w-10 h-24 bg-theme-elevated rounded-full flex flex-col-reverse overflow-hidden relative">
              <div class="w-full bg-theme-blue rounded-b-full transition-all duration-500 ease-out" style="height: 20%"></div>
              <div class="w-full bg-theme-green transition-all duration-500 ease-out" style="height: 20%"></div>
            </div>
            <span class="font-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">S</span>
          </div>

          <div class="flex flex-col items-center gap-2 group">
            <div class="w-8 md:w-10 h-24 bg-theme-elevated rounded-full flex flex-col-reverse overflow-hidden relative">
              <div class="w-full bg-theme-blue rounded-b-full transition-all duration-500 ease-out" style="height: 10%"></div>
              <div class="w-full bg-theme-green transition-all duration-500 ease-out" style="height: 10%"></div>
            </div>
            <span class="font-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">S</span>
          </div>

        </div>
        <div class="flex justify-center gap-4 mt-6">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-theme-blue"></div>
            <span class="font-label-md text-on-surface-variant">Tasks</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-theme-green"></div>
            <span class="font-label-md text-on-surface-variant">Habits</span>
          </div>
        </div>
      </div>

    </div>
  `
})
export class ProgressComponent {}
