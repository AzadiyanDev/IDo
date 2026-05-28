import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-projects',
  imports: [RouterLink],
  template: `
    <!-- Header -->
    <header class="flex justify-between items-center px-margin-mobile py-md w-full sticky top-0 bg-theme-bg/90 backdrop-blur-md z-40">
      <div>
        <h1 class="font-headline-lg-mobile text-headline-lg-mobile m-0 leading-tight text-on-surface">Projects</h1>
        <p class="font-body-md text-body-md text-on-surface-variant m-0 mt-0.5">Manage your active projects</p>
      </div>
      <div class="flex gap-sm">
        <button class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:opacity-80 transition-opacity active:scale-95 transition-transform border-none outline-none">
          <span class="material-symbols-outlined text-on-surface-variant">search</span>
        </button>
        <a routerLink="/inbox" class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:opacity-80 transition-opacity active:scale-95 transition-transform no-underline">
          <span class="material-symbols-outlined text-on-surface-variant relative">
            inbox
            <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-theme-rose rounded-full border-2 border-theme-bg"></span>
          </span>
        </a>
      </div>
    </header>

    <div class="px-margin-mobile flex flex-col gap-lg pb-md">
      <!-- Summary Card -->
      <section class="bg-card-bg border border-card-border rounded-2xl p-lg shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
        <div class="flex justify-between items-start mb-md">
          <div>
            <h2 class="font-headline-md text-headline-md m-0 text-on-surface">Active Projects</h2>
            <p class="font-body-md text-body-md text-on-surface-variant m-0 mt-1">4 in progress</p>
          </div>
          <div class="relative w-16 h-16 flex items-center justify-center">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path class="text-surface-container-high stroke-current" stroke-width="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
              <path class="text-theme-purple stroke-current" stroke-width="4" stroke-dasharray="62, 100" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
            </svg>
            <span class="absolute font-label-md text-label-md font-bold text-on-surface">62%</span>
          </div>
        </div>
        
        <div class="flex justify-between border-t border-card-border pt-md">
          <div class="text-center">
            <p class="font-headline-md text-headline-md m-0 text-on-surface">4</p>
            <p class="font-label-md text-label-md text-on-surface-variant m-0">Projects</p>
          </div>
          <div class="text-center">
            <p class="font-headline-md text-headline-md m-0 text-on-surface">28</p>
            <p class="font-label-md text-label-md text-on-surface-variant m-0">Tasks</p>
          </div>
          <div class="text-center">
            <p class="font-headline-md text-headline-md m-0 text-on-surface">6</p>
            <p class="font-label-md text-label-md text-on-surface-variant m-0">Members</p>
          </div>
        </div>
      </section>

      <!-- Quick Stats -->
      <section class="flex gap-sm overflow-x-auto hide-scrollbar pb-xs -mx-margin-mobile px-margin-mobile">
        <div class="min-w-[120px] bg-card-bg border border-card-border rounded-xl p-md flex flex-col gap-xs shrink-0">
          <span class="w-2 h-2 rounded-full bg-status-blue"></span>
          <p class="font-headline-md text-headline-md m-0 text-on-surface">3</p>
          <p class="font-label-md text-label-md text-on-surface-variant m-0">In Progress</p>
        </div>
        <div class="min-w-[120px] bg-card-bg border border-card-border rounded-xl p-md flex flex-col gap-xs shrink-0">
          <span class="w-2 h-2 rounded-full bg-status-green"></span>
          <p class="font-headline-md text-headline-md m-0 text-on-surface">2</p>
          <p class="font-label-md text-label-md text-on-surface-variant m-0">On Track</p>
        </div>
        <div class="min-w-[120px] bg-card-bg border border-card-border rounded-xl p-md flex flex-col gap-xs shrink-0">
          <span class="w-2 h-2 rounded-full bg-status-orange"></span>
          <p class="font-headline-md text-headline-md m-0 text-on-surface">1</p>
          <p class="font-label-md text-label-md text-on-surface-variant m-0">Needs Review</p>
        </div>
        <div class="min-w-[120px] bg-card-bg border border-card-border rounded-xl p-md flex flex-col gap-xs shrink-0">
          <span class="w-2 h-2 rounded-full bg-theme-purple"></span>
          <p class="font-headline-md text-headline-md m-0 text-on-surface">6</p>
          <p class="font-label-md text-label-md text-on-surface-variant m-0">Members</p>
        </div>
      </section>

      <!-- Filter -->
      <section class="flex bg-surface-container-high rounded-full p-1 border border-outline-variant/30">
        <button class="flex-1 font-label-md text-label-md py-2 px-3 rounded-full bg-theme-project-bg text-theme-purple transition-colors">All</button>
        <button class="flex-1 font-label-md text-label-md py-2 px-3 rounded-full text-on-surface-variant transition-colors hover:text-on-surface">Owned</button>
        <button class="flex-1 font-label-md text-label-md py-2 px-3 rounded-full text-on-surface-variant transition-colors hover:text-on-surface">Shared</button>
        <button class="flex-1 font-label-md text-label-md py-2 px-3 rounded-full text-on-surface-variant transition-colors hover:text-on-surface">Archived</button>
      </section>

      <!-- Project List Section -->
      <section class="flex flex-col gap-md">
        <div class="flex justify-between items-center">
          <h3 class="font-headline-md text-headline-md m-0 text-on-surface">My Projects</h3>
          <button class="bg-theme-purple-bright/20 text-theme-purple-bright font-label-md text-label-md px-sm py-1 rounded-full flex items-center gap-1 hover:bg-theme-purple-bright/30 transition-colors">
            <span class="material-symbols-outlined text-[16px]">add</span> New Project
          </button>
        </div>

        <!-- Card 1: Featured -->
        <a routerLink="/project/1" class="block bg-theme-project-bg border border-theme-project-accent/30 rounded-2xl p-lg shadow-[0_4px_20px_rgba(196,181,253,0.1)] flex flex-col gap-md relative overflow-hidden active:scale-[0.98] transition-transform no-underline">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-headline-lg-mobile text-headline-lg-mobile text-theme-purple mb-1 mt-0">IDo App Design</h4>
              <p class="font-body-md text-body-md text-on-surface-variant m-0">Finalize mobile dashboard screens</p>
            </div>
            <span class="material-symbols-outlined text-theme-purple">chevron_right</span>
          </div>
          
          <div>
            <div class="flex justify-between items-center mb-xs">
              <span class="font-label-md text-label-md text-status-blue">In Progress</span>
              <span class="font-label-md text-label-md text-on-surface-variant">68%</span>
            </div>
            <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div class="bg-status-blue h-full rounded-full" style="width: 68%"></div>
            </div>
          </div>
          
          <div class="flex justify-between items-center pt-xs">
            <div class="flex -space-x-2">
              <div class="w-8 h-8 rounded-full bg-surface-variant border-2 border-theme-project-bg flex items-center justify-center text-xs font-bold text-on-surface">U1</div>
              <div class="w-8 h-8 rounded-full bg-surface-container-high border-2 border-theme-project-bg flex items-center justify-center text-xs font-bold text-on-surface">U2</div>
              <div class="w-8 h-8 rounded-full bg-surface-variant border-2 border-theme-project-bg flex items-center justify-center text-xs font-bold text-on-surface">+1</div>
            </div>
            <div class="flex gap-sm">
              <div class="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md">
                <span class="material-symbols-outlined text-[16px]">task_alt</span> 12/20
              </div>
              <div class="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md">
                <span class="material-symbols-outlined text-[16px]">layers</span> 5
              </div>
            </div>
          </div>
        </a>

        <!-- Card 2: Web Dev -->
        <a routerLink="/project/2" class="block bg-card-bg border border-card-border rounded-2xl p-lg flex flex-col gap-md active:scale-[0.98] transition-transform no-underline">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-headline-md text-headline-md mb-1 mt-0 text-on-surface">Web Dev</h4>
              <p class="font-body-md text-body-md text-on-surface-variant m-0">API integration and testing</p>
            </div>
            <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </div>
          <div>
            <div class="flex justify-between items-center mb-xs">
              <span class="font-label-md text-label-md text-on-surface-variant">To Do</span>
              <span class="font-label-md text-label-md text-on-surface-variant">42%</span>
            </div>
            <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div class="bg-primary h-full rounded-full" style="width: 42%"></div>
            </div>
          </div>
          <div class="flex justify-between items-center pt-xs">
            <div class="flex -space-x-2">
              <div class="w-8 h-8 rounded-full bg-surface-variant border-2 border-card-bg flex items-center justify-center text-xs font-bold text-on-surface">D1</div>
              <div class="w-8 h-8 rounded-full bg-surface-variant border-2 border-card-bg flex items-center justify-center text-xs font-bold text-on-surface">D2</div>
            </div>
          </div>
        </a>

        <!-- Card 3: Content Campaign -->
        <div class="bg-card-bg border border-card-border rounded-2xl p-lg flex flex-col gap-md active:scale-[0.98] transition-transform">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-headline-md text-headline-md mb-1 mt-0 text-on-surface">Content Campaign</h4>
            </div>
            <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </div>
          <div>
            <div class="flex justify-between items-center mb-xs">
              <span class="font-label-md text-label-md text-status-green">On Track</span>
              <span class="font-label-md text-label-md text-on-surface-variant">84%</span>
            </div>
            <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div class="bg-status-green h-full rounded-full" style="width: 84%"></div>
            </div>
          </div>
          <div class="flex justify-between items-center pt-xs">
            <div class="flex -space-x-2">
              <div class="w-8 h-8 rounded-full bg-surface-variant border-2 border-card-bg flex items-center justify-center text-xs font-bold text-on-surface">C1</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Invitation Card -->
      <section class="bg-surface-container-high border border-outline-variant/50 rounded-2xl p-md flex items-center justify-between mt-sm">
        <div class="flex items-center gap-sm">
          <div class="w-10 h-10 rounded-full bg-theme-project-bg flex items-center justify-center text-theme-purple shrink-0">
            <span class="material-symbols-outlined text-[20px]">mail</span>
          </div>
          <div>
            <p class="font-label-md text-label-md text-on-surface-variant mb-0.5 mt-0">1 project invite waiting</p>
            <p class="font-body-md text-body-md text-on-surface m-0 leading-tight"><span class="font-bold">Alex</span> invited you to <span class="font-bold">Website Redesign</span></p>
          </div>
        </div>
        <button class="bg-theme-purple/20 text-theme-purple font-label-md text-label-md px-md py-2 rounded-full hover:bg-theme-purple/30 transition-colors ml-2 shrink-0 border-none outline-none">Review</button>
      </section>
    </div>
  `
})
export class ProjectsComponent {}
