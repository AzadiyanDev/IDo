import { Component, signal, OnDestroy, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-task-details',
  template: `
    <!-- Header -->
    <header class="w-full top-0 sticky z-40 bg-theme-bg/90 backdrop-blur-md flex items-center justify-between px-margin-mobile py-md">
      <button (click)="location.back()" class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors active:scale-95 border-none outline-none">
        <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">arrow_back</span>
      </button>
      <h1 class="font-headline-md text-headline-md text-on-surface m-0">Task Details</h1>
      <div class="flex items-center gap-xs">
        <button class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 transition-colors active:scale-95 border-none bg-transparent">
          <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">edit</span>
        </button>
        <button class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 transition-colors active:scale-95 border-none bg-transparent">
          <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">more_vert</span>
        </button>
      </div>
    </header>

    <div class="flex-1 px-margin-mobile flex flex-col gap-lg mt-sm pb-32">
      <!-- Main Task Card -->
      <section class="bg-theme-surface border border-theme-border rounded-[24px] p-lg flex flex-col gap-md shadow-[0px_10px_30px_rgba(0,0,0,0.4)]">
        <div class="flex items-start justify-between">
          <div class="inline-flex items-center px-sm py-base rounded-full bg-theme-blue/10 text-theme-blue font-label-md gap-base">
            <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">play_circle</span>
            In Progress
          </div>
          <div class="flex items-center gap-xs text-on-surface-variant font-label-md bg-surface-container px-sm py-base rounded-full border border-outline-variant/30">
            <span class="material-symbols-outlined text-[14px]">folder</span>
            <span>IDo App Design</span>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Design</span>
          </div>
        </div>
        
        <div>
          <h2 class="font-headline-lg-mobile text-on-surface m-0">Finalize project detail screen</h2>
          <p class="font-body-md text-on-surface-variant leading-relaxed mt-2 m-0">Complete the layout and interaction states for the project detail page. Ensure all components align with the new dark minimal aesthetic.</p>
        </div>
        
        <div class="flex flex-wrap gap-sm mt-xs">
          <div class="inline-flex items-center gap-xs px-sm py-base rounded-full bg-surface-container-lowest border border-theme-border text-on-surface font-label-md">
            <span class="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
            Today, 6:00 PM
          </div>
          <div class="inline-flex items-center gap-xs px-sm py-base rounded-full bg-surface-container-lowest border border-theme-border text-on-surface font-label-md">
            <span class="material-symbols-outlined text-[16px] text-theme-orange">notifications</span>
            30 min before
          </div>
          <div class="inline-flex items-center gap-xs px-sm py-base rounded-full bg-surface-container-lowest border border-theme-border text-on-surface font-label-md">
            <span class="material-symbols-outlined text-[16px] text-error">flag</span>
            Priority: Medium
          </div>
        </div>
      </section>

      <!-- Status Section -->
      <section class="flex flex-col gap-sm">
        <h3 class="font-label-md text-on-surface-variant uppercase tracking-wider pl-xs m-0">Status</h3>
        <div class="flex bg-surface-container-lowest p-base rounded-full border border-theme-border">
          <button class="flex-1 py-sm rounded-full font-label-md text-on-surface-variant text-center transition-colors border-none bg-transparent">Todo</button>
          <button class="flex-1 py-sm rounded-full font-label-md text-theme-bg bg-theme-blue font-semibold text-center shadow-sm transition-colors border-none">In Progress</button>
          <button class="flex-1 py-sm rounded-full font-label-md text-on-surface-variant text-center transition-colors border-none bg-transparent">Done</button>
        </div>
      </section>

      <!-- Details List -->
      <section class="bg-theme-surface border border-theme-border rounded-[24px] p-md flex flex-col gap-sm">
        <div class="flex items-center justify-between py-xs">
          <div class="flex items-center gap-sm text-on-surface-variant">
            <span class="material-symbols-outlined">event</span>
            <span class="font-body-md">Deadline</span>
          </div>
          <span class="font-body-md text-on-surface">Oct 24, 2023</span>
        </div>
        <div class="h-[1px] w-full bg-theme-border/50"></div>
        <div class="flex items-center justify-between py-xs">
          <div class="flex items-center gap-sm text-on-surface-variant">
            <span class="material-symbols-outlined">schedule</span>
            <span class="font-body-md">Created</span>
          </div>
          <span class="font-body-md text-on-surface">Oct 20, 2023</span>
        </div>
      </section>

      <!-- Comments Section -->
      <section class="flex flex-col gap-md pb-lg">
        <h3 class="font-label-md text-on-surface-variant uppercase tracking-wider pl-xs m-0">4 Comments</h3>
        <div class="flex flex-col gap-lg">
          
          <!-- Other Comment -->
          <div class="flex gap-sm">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbHK1mgkRdEQaysv98lAb0ki_r7ml4aPSrM49GCNZgswCwUJ4Cy9jxgii2BwhaXUt4G-Ws0A3Kh6_YySWHrMrNdxsB8ldTc_erxIfUVO4rUIGB5NT47LbkV5KItcTOa68enVqmIYFWh0_BkGFegfeJa3m9miIS5wDb3GXqIIU6xTDfvPc2iaIeOZzcNNEnCmMH259iF8ytSEoyj2qBehL0Vzidvr82ou8-fJSPALI2qGXk5CSLlmw9Hbz8mhOOKeXPvCmTKhsYgQM5" alt="David" class="w-10 h-10 rounded-full border border-theme-border object-cover"/>
            <div class="flex flex-col gap-base flex-1">
              <div class="flex items-baseline gap-xs">
                <span class="font-label-md text-on-surface font-semibold">David</span>
                <span class="font-label-md text-on-surface-variant text-[10px]">2 hours ago</span>
              </div>
              <div class="bg-theme-surface p-sm rounded-tr-xl rounded-b-xl rounded-tl-sm border border-theme-border font-body-md text-on-surface">
                Looks good, but make sure the hold animation feels snappy.
              </div>
            </div>
          </div>
          
          <!-- My Comment -->
          <div class="flex gap-sm flex-row-reverse">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJpaGVgQDyulQt_248hSKig6AAcDdYwFoAc9Fih6FnYU8uvhp0jSzMaKqiPI-8HTIVLdkWRvCuTWwE0u4co6b0txt3-5C3U9YoZnXFM9J8SA1Cp3Io1lPsMgMQo2VQNFIKqOjT8gJpdq1hiL8MgPsMktJ6WGJAvG-o0Y84qh404o8p4fCUnyzDgbJ0SOlVmGDq6d4vJKmob6saRSkGdjuzdvuNBqrkkQq_lVaYVULn4QIVkTfWcOSbGGZ6nBO_gzXWbqoNtsjGFxeB" alt="Me" class="w-10 h-10 rounded-full border border-theme-blue/30 object-cover"/>
            <div class="flex flex-col gap-base flex-1 items-end">
              <div class="flex items-baseline gap-xs flex-row-reverse">
                <span class="font-label-md text-on-surface font-semibold">Me</span>
                <span class="font-label-md text-on-surface-variant text-[10px]">1 hour ago</span>
              </div>
              <div class="bg-primary-container/20 p-sm rounded-tl-xl rounded-b-xl rounded-tr-sm border border-theme-blue/20 font-body-md text-on-primary-container">
                Will do. I'll test it on device later today.
              </div>
            </div>
          </div>
        </div>
        
        <!-- Add Comment Input -->
        <div class="flex gap-sm items-center mt-sm">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuANkQHKoY6RsiAHdm5uRVrxjAEm04yb_VZ8asPQPaGMt1XgNsj92eLoGPEzbHHXU0cbZGlJKIoP8h9M291zbJUEcYPMhFPCXzDcXJlX17UAbPJQSsQx-rBUCOmmQJ1oFl3r9PpKdKbhRsbtj5ABO2tjlrhWQq87O8L90kUsHHw7qnC2n0Fl6tNLbX-jbZvlFsckmbXO0-SY3GM8LvEF9WjIb2lWTEI6ZSAgUZy2x4G8iKpwR5_JIMZJSg_vkF_aCS90MfBB91XRhb8K" alt="Me" class="w-10 h-10 rounded-full border border-theme-border object-cover shrink-0"/>
          <div class="flex-1 relative">
            <input type="text" placeholder="Add a comment..." class="w-full bg-surface-container-lowest border border-theme-border rounded-full py-sm pl-md pr-[48px] font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-theme-blue/50 focus:ring-1 focus:ring-theme-blue/50 transition-all"/>
            <button class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-theme-blue hover:bg-theme-blue/10 transition-colors border-none bg-transparent outline-none">
              <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">send</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Sticky Bottom Action Area -->
    <div class="fixed bottom-0 left-0 w-full z-50 p-margin-mobile bg-theme-bg/60 backdrop-blur-md border-t border-theme-border/50 rounded-t-[32px] flex justify-center items-center">
      <div class="w-full max-w-[448px] mx-auto relative flex justify-center">
        <button 
          (touchstart)="startHold()" (touchend)="cancelHold()" (touchcancel)="cancelHold()"
          (mousedown)="startHold()" (mouseup)="cancelHold()" (mouseleave)="cancelHold()"
          [class]="isComplete() ? 'bg-theme-green border-theme-green text-surface-container-lowest' : 'bg-theme-elevated border-theme-border text-on-surface'"
          class="w-full max-w-[300px] h-[64px] rounded-full relative overflow-hidden group flex items-center justify-center gap-sm transition-all select-none border-solid border outline-none">
          
          <!-- Progress Fill -->
          @if (!isComplete()) {
            <div 
              class="absolute left-0 top-0 h-full bg-theme-green/20 rounded-l-full"
              [class.rounded-r-full]="isHolding()"
              [style.width]="isHolding() ? '100%' : '0%'"
              [style.transition]="isHolding() ? 'width 2000ms linear' : 'width 0.3s ease-out'">
            </div>
          }

          <span class="material-symbols-outlined z-10" [style.font-variation-settings]="isComplete() ? '&quot;FILL&quot; 1' : '&quot;wght&quot; 300'">
            {{ isComplete() ? 'check_circle' : 'fingerprint' }}
          </span>
          <span class="font-headline-md z-10 text-[16px]">
            {{ isComplete() ? 'Task Completed' : 'Hold 2s to mark as done' }}
          </span>
        </button>
      </div>
    </div>
  `
})
export class TaskDetailsComponent implements OnDestroy {
  isHolding = signal(false);
  isComplete = signal(false);
  location = inject(Location);
  
  private holdTimer?: ReturnType<typeof setTimeout>;
  private holdDuration = 2000;

  startHold() {
    if (this.isComplete()) return;
    
    // Attempt haptic
    if (window.navigator && window.navigator.vibrate) {
       window.navigator.vibrate(50);
    }
    
    this.isHolding.set(true);
    
    this.holdTimer = setTimeout(() => {
      this.isComplete.set(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([50, 50, 50]);
      }
    }, this.holdDuration);
  }

  cancelHold() {
    if (this.isComplete()) return;
    this.isHolding.set(false);
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
    }
  }

  ngOnDestroy() {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
    }
  }
}
