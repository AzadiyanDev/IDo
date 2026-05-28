import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-project-details',
  imports: [RouterLink],
  template: `
    <!-- TopAppBar -->
    <header class="bg-theme-bg text-on-surface font-headline-md text-headline-md sticky top-0 z-40 bg-theme-bg/90 backdrop-blur-md">
      <div class="flex justify-between items-center w-full px-gutter-mobile py-sm">
        <button (click)="location.back()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 transition-transform flex-shrink-0">
          <span class="material-symbols-outlined text-on-surface-variant text-[24px]">arrow_back</span>
        </button>
        <div class="flex flex-col items-center">
          <h1 class="font-headline-md text-headline-md text-on-surface m-0 leading-tight">Project Details</h1>
          <span class="font-label-md text-label-md text-on-surface-variant mt-0.5">Mobile app project</span>
        </div>
        <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 transition-transform flex-shrink-0">
          <span class="material-symbols-outlined text-on-surface-variant text-[24px]">more_vert</span>
        </button>
      </div>
    </header>

    <div class="px-gutter-mobile py-md flex flex-col gap-lg pb-10">
      <!-- Project Summary Card -->
      <section class="bg-theme-project-bg rounded-[24px] p-lg flex flex-col gap-md relative overflow-hidden border border-theme-border">
        <div class="flex justify-between items-start z-10">
          <div class="flex flex-col gap-2 max-w-[60%]">
            <div class="inline-flex bg-theme-project-accent/20 text-theme-project-accent px-3 py-1 rounded-full font-label-md w-max">
              In Progress
            </div>
            <h2 class="font-headline-lg-mobile text-white m-0 mt-1">IDo App Design</h2>
            <p class="font-body-md text-theme-project-accent opacity-90 m-0 mt-1">Design the core mobile experience</p>
          </div>
          <!-- Circular Progress -->
          <div class="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path class="text-theme-project-accent/10 stroke-current" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
              <path class="text-theme-project-accent stroke-current" stroke-width="3" stroke-dasharray="68, 100" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center flex-col">
              <span class="font-headline-md text-white font-bold leading-none">68<span class="text-xs">%</span></span>
            </div>
          </div>
        </div>
        <!-- Stats Row -->
        <div class="flex justify-between items-center mt-2 z-10 w-full">
          <div class="flex flex-col">
            <span class="font-label-md text-theme-project-accent opacity-70">Tasks</span>
            <span class="font-body-lg text-white font-medium">20</span>
          </div>
          <div class="w-[1px] h-8 bg-theme-border"></div>
          <div class="flex flex-col">
            <span class="font-label-md text-theme-project-accent opacity-70">Sections</span>
            <span class="font-body-lg text-white font-medium">5</span>
          </div>
          <div class="w-[1px] h-8 bg-theme-border"></div>
          <div class="flex flex-col">
            <span class="font-label-md text-theme-project-accent opacity-70">Members</span>
            <span class="font-body-lg text-white font-medium">3</span>
          </div>
        </div>
        <!-- Abstract background shape -->
        <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-theme-teal opacity-5 rounded-full blur-2xl"></div>
      </section>

      <!-- Members Strip -->
      <section class="flex flex-col gap-3">
        <h3 class="font-label-md text-on-surface-variant uppercase tracking-wider pl-1 m-0">Team</h3>
        <div class="flex gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-gutter-mobile px-gutter-mobile">
          
          <div class="flex flex-col items-center gap-2 min-w-[72px]">
            <div class="w-14 h-14 rounded-full bg-surface-container-high p-0.5 border-2 border-primary-container relative">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-YFKJKhTETIbaEO-cqnmmdRU794z2IH8Xld_NEnO_SAOu81B_1r_j00mfhOmBsQFMfU-tVVPguHbfRs_u6aRxhvpHgtuitGGtjxQgNhqDgpDbHgCI6hKsBm4YE2dPLJL67MDTQFR-lQNGHX_oS6HSmcWKfY7DNH_uVT7CNiTFShknBGb4WYaLt3qrwfIxSAb4fyzbyVsmORoT6uWtbfyFcZSmXswURt1i6dLfvjtvTamZvtqoopLcI2eqQVFB-ni93tIHbuYSY6YD" alt="You" class="w-full h-full rounded-full object-cover"/>
              <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-container rounded-full flex items-center justify-center border-2 border-theme-bg">
                <span class="material-symbols-outlined text-[10px] text-on-primary-container" style="font-variation-settings: 'FILL' 1;">star</span>
              </div>
            </div>
            <span class="font-label-md text-on-surface text-center">You</span>
          </div>

          <div class="flex flex-col items-center gap-2 min-w-[72px]">
            <div class="w-14 h-14 rounded-full bg-surface-container-high p-0.5">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTSfQ60G_GZn7wvBOsphV3MxNZSTKB80EtiH-OhTx9iUAj-Sr5X-Gkyy7AhHxIDnRa0iMKpfn-UadHVKCvGkFwquG-jZzJ7hFPyyXSMiODIawxvbu1HoExVQ7gCpCgqOzN_P55mKthXIwKbqsAUowUgSdHJ4_G6S8nxHYbmt0y4nEY-MJuxYuDWOukr1SqFP5rME_hHJRcN0H_ATdP-MgEe1mB11MbQ6PoF0KcrVjwVSGKHUrcwNs6uRJmruU2GrToIr6ejnDooGW4" alt="Alex" class="w-full h-full rounded-full object-cover"/>
            </div>
            <span class="font-label-md text-on-surface-variant text-center">Alex</span>
          </div>

          <div class="flex flex-col items-center gap-2 min-w-[72px]">
            <div class="w-14 h-14 rounded-full bg-surface-container-high p-0.5">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTT1p4ufGhDHsE0NP4uiWESgRXO8YljJqwC4oPzF8BHI-2kH7Z0QJfFPOpTNs7uFNQjHnaqvpjkmOKvlbiBSwAO2CUhOB21VGoP0Am7FVOTiAUeBq8gfF_7OxQ1ugqiwFzJ0C46bBBV2rLnwY7271vyFMDlEF4PxabLvxQT0vqnrQLbYlqZdU74PJUHsPSYoal_oQyJIw8ZjV8CgXRypYDlQ2iy9SNN0v4yqXIsZj5CxaSJveUYzxZIk1qpBxdAzQHXtxEPJK9Tk2C" alt="Sara" class="w-full h-full rounded-full object-cover"/>
            </div>
            <span class="font-label-md text-on-surface-variant text-center">Sara</span>
          </div>

          <div class="flex flex-col items-center gap-2 min-w-[72px] justify-center">
            <button class="w-14 h-14 rounded-full flex items-center justify-center border border-dashed border-outline-variant text-on-surface-variant hover:text-primary transition-colors">
              <span class="material-symbols-outlined">add</span>
            </button>
            <span class="font-label-md text-on-surface-variant text-center">Add</span>
          </div>
          
        </div>
      </section>

      <!-- View Switch -->
      <section class="bg-surface-container-high rounded-[16px] p-1 flex">
        <button class="flex-1 py-2 rounded-[12px] bg-theme-bg text-primary-fixed-dim font-label-md shadow-sm transition-all text-center">
            Sections
        </button>
        <button class="flex-1 py-2 rounded-[12px] text-on-surface-variant font-label-md hover:text-on-surface transition-all text-center">
            My Tasks
        </button>
        <button class="flex-1 py-2 rounded-[12px] text-on-surface-variant font-label-md hover:text-on-surface transition-all text-center">
            Timeline
        </button>
      </section>

      <!-- Sections List -->
      <div class="flex flex-col gap-6">
        <!-- Section 1 -->
        <div class="bg-theme-surface rounded-[24px] p-5 border border-theme-border flex flex-col gap-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-theme-elevated flex items-center justify-center border border-theme-border">
                <span class="material-symbols-outlined text-primary-container text-[16px]">design_services</span>
              </div>
              <h3 class="font-headline-md text-on-surface m-0">Design</h3>
            </div>
            <div class="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full">
              <span class="w-2 h-2 rounded-full bg-secondary-fixed"></span>
              <span class="font-label-md text-on-surface-variant">80%</span>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <!-- Task Item Done -->
            <div class="flex items-start gap-3 bg-surface-container-low p-3 rounded-lg">
              <div class="mt-0.5 w-5 h-5 rounded-full border-2 border-secondary-fixed bg-secondary-fixed flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[14px] text-on-secondary-fixed" style="font-variation-settings: 'FILL' 1;">check</span>
              </div>
              <span class="font-body-md text-on-surface-variant line-through">Review design system</span>
            </div>
            
            <!-- Task Item In Progress -->
            <a routerLink="/task/1" class="flex items-start gap-3 bg-surface-container-low p-3 rounded-lg border-l-2 border-primary-container no-underline hover:bg-surface-container-highest transition-colors">
              <div class="mt-0.5 w-5 h-5 rounded-full border-2 border-outline-variant flex items-center justify-center shrink-0"></div>
              <span class="font-body-md text-on-surface">Finalize dashboard UI</span>
            </a>
          </div>
        </div>

        <!-- Section 2 -->
        <div class="bg-theme-surface rounded-[24px] p-5 border border-theme-border flex flex-col gap-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-theme-elevated flex items-center justify-center border border-theme-border">
                <span class="material-symbols-outlined text-theme-orange text-[16px]">code</span>
              </div>
              <h3 class="font-headline-md text-on-surface m-0">Frontend</h3>
            </div>
            <div class="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full">
              <span class="w-2 h-2 rounded-full bg-theme-orange"></span>
              <span class="font-label-md text-on-surface-variant">45%</span>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-start gap-3 bg-surface-container-low p-3 rounded-lg">
              <div class="mt-0.5 w-5 h-5 rounded-full border-2 border-secondary-fixed bg-secondary-fixed flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[14px] text-on-secondary-fixed" style="font-variation-settings: 'FILL' 1;">check</span>
              </div>
              <span class="font-body-md text-on-surface-variant line-through">Build Today screen</span>
            </div>
            
            <a routerLink="/task/2" class="flex items-start gap-3 bg-surface-container-low p-3 rounded-lg border-l-2 border-theme-orange no-underline hover:bg-surface-container-highest transition-colors">
              <div class="mt-0.5 w-5 h-5 rounded-full border-2 border-outline-variant flex items-center justify-center shrink-0"></div>
              <span class="font-body-md text-on-surface">Connect project API</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProjectDetailsComponent {
  location = inject(Location);
}
