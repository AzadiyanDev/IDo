import { Component, output } from '@angular/core';

@Component({
  selector: 'app-create-new-modal',
  template: `
    <!-- Overlay -->
    <div 
      class="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 transition-opacity flex items-end justify-center"
      role="button"
      tabindex="0"
      (click)="closeOnBackdrop($event)"
      (keydown.enter)="closeOnBackdrop($event)"
      (keydown.space)="closeOnBackdrop($event)">
      
      <!-- Bottom Sheet Modal -->
      <div 
        role="dialog"
        aria-modal="true"
        class="w-full max-w-[448px] bg-surface-container rounded-t-[28px] shadow-[0px_-10px_40px_rgba(0,0,0,0.5)] flex flex-col transform transition-transform duration-300 translate-y-0 h-[80vh]">
        
        <!-- Drag Handle -->
        <button type="button" class="w-full flex justify-center pt-sm pb-xs cursor-grab active:cursor-grabbing border-none bg-transparent" aria-label="Close create modal" (click)="closeClicked.emit()">
          <div class="w-12 h-1.5 bg-outline-variant rounded-full opacity-60"></div>
        </button>
        
        <!-- Header -->
        <div class="px-margin-mobile pt-sm pb-md flex justify-between items-start shrink-0">
          <div>
            <h2 class="text-headline-lg-mobile font-headline-lg-mobile text-on-surface">Create New</h2>
            <p class="text-body-md font-body-md text-on-surface-variant mt-1">Choose what you want to add</p>
          </div>
          <button (click)="closeClicked.emit()" class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <!-- Scrollable Content Area -->
        <div class="flex-1 overflow-y-auto px-margin-mobile pb-xxl flex flex-col gap-lg hide-scrollbar">
          
          <!-- Type Selection Grid -->
          <div class="grid grid-cols-2 gap-sm">
            <!-- Task (Active) -->
            <button class="flex flex-col items-start p-sm bg-primary/10 border border-primary-container rounded-xl text-left transition-all relative overflow-hidden">
              <div class="absolute inset-0 bg-primary-container/5 mix-blend-overlay"></div>
              <div class="w-8 h-8 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center mb-sm">
                <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              </div>
              <span class="text-body-lg font-body-lg text-on-surface font-semibold">Task</span>
              <span class="text-label-md font-label-md text-on-surface-variant mt-1">Quick daily task</span>
            </button>
            
            <!-- Habit -->
            <button class="flex flex-col items-start p-sm bg-surface-container-highest border border-outline-variant/30 rounded-xl text-left hover:bg-surface-variant transition-colors">
              <div class="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-sm">
                <span class="material-symbols-outlined text-[18px]">repeat</span>
              </div>
              <span class="text-body-lg font-body-lg text-on-surface font-semibold">Habit</span>
              <span class="text-label-md font-label-md text-on-surface-variant mt-1">Build a routine</span>
            </button>
            
            <!-- Project -->
            <button class="flex flex-col items-start p-sm bg-surface-container-highest border border-outline-variant/30 rounded-xl text-left hover:bg-surface-variant transition-colors">
              <div class="w-8 h-8 rounded-full bg-tertiary-container/10 text-tertiary-container flex items-center justify-center mb-sm">
                <span class="material-symbols-outlined text-[18px]">folder</span>
              </div>
              <span class="text-body-lg font-body-lg text-on-surface font-semibold">Project</span>
              <span class="text-label-md font-label-md text-on-surface-variant mt-1">Organize bigger work</span>
            </button>
            
            <!-- Project Task -->
            <button class="flex flex-col items-start p-sm bg-surface-container-highest border border-outline-variant/30 rounded-xl text-left hover:bg-surface-variant transition-colors">
              <div class="w-8 h-8 rounded-full bg-theme-purple-bright/10 text-theme-purple-bright flex items-center justify-center mb-sm">
                <span class="material-symbols-outlined text-[18px]">assignment</span>
              </div>
              <span class="text-body-lg font-body-lg text-on-surface font-semibold">Project Task</span>
              <span class="text-label-md font-label-md text-on-surface-variant mt-1">Add task to a project</span>
            </button>
          </div>
          
          <div class="h-px w-full bg-outline-variant/30"></div>
          
          <!-- Active Form: Add Task -->
          <div class="flex flex-col gap-md">
            
            <!-- Inputs -->
            <div class="flex flex-col gap-sm">
              <input type="text" placeholder="What do you need to do?" 
                class="w-full bg-surface-container-lowest border-none rounded-full px-lg py-sm text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary-container focus:outline-none transition-all"/>
              
              <div class="relative">
                <span class="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">notes</span>
                <input type="text" placeholder="Description (optional)" 
                  class="w-full bg-surface-container-lowest border-none rounded-full pl-[44px] pr-lg py-sm text-body-md font-body-md text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary-container focus:outline-none transition-all"/>
              </div>
            </div>
            
            <!-- Date Selection -->
            <div class="flex flex-col gap-xs mt-sm">
              <span class="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Date</span>
              <div class="flex flex-wrap gap-xs">
                <button class="px-md py-2 rounded-full bg-primary-container text-on-primary-container text-body-md font-body-md font-medium">Today</button>
                <button class="px-md py-2 rounded-full bg-surface-container-highest text-on-surface text-body-md font-body-md hover:bg-surface-variant transition-colors">Tomorrow</button>
                <button class="px-md py-2 rounded-full bg-surface-container-highest text-on-surface text-body-md font-body-md flex items-center gap-xs hover:bg-surface-variant transition-colors">
                  <span class="material-symbols-outlined text-[18px]">calendar_month</span>
                  Pick Date
                </button>
              </div>
            </div>
            
            <!-- Reminder Selection -->
            <div class="flex flex-col gap-xs mt-sm">
              <span class="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Reminder</span>
              <div class="flex flex-wrap gap-xs">
                <button class="px-md py-2 rounded-full bg-surface-container-highest text-on-surface text-body-md font-body-md border border-outline-variant/50 hover:bg-surface-variant transition-colors">No reminder</button>
                <button class="px-md py-2 rounded-full bg-surface-container-highest text-on-surface text-body-md font-body-md hover:bg-surface-variant transition-colors">10:00 AM</button>
                <button class="px-md py-2 rounded-full bg-surface-container-highest text-on-surface text-body-md font-body-md hover:bg-surface-variant transition-colors">2:00 PM</button>
                <button class="w-9 h-9 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:bg-surface-variant transition-colors">
                  <span class="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Spacer for bottom padding -->
          <div class="h-[100px] shrink-0"></div>
          
        </div>
        
        <!-- Sticky Footer -->
        <div class="absolute bottom-0 left-0 w-full p-margin-mobile bg-gradient-to-t from-surface-container via-surface-container to-transparent pt-xl shrink-0 rounded-b-xl border-t border-outline-variant/10">
          <button (click)="closeClicked.emit()" class="w-full bg-primary-container text-on-primary-container py-md rounded-full text-headline-md font-headline-md font-bold shadow-[0_4px_14px_rgba(125,211,252,0.25)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-xs">
            Create Task
            <span class="material-symbols-outlined">arrow_upward</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class CreateNewModalComponent {
  closeClicked = output<void>();

  closeOnBackdrop(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeClicked.emit();
    }
  }
}
