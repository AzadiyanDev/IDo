import { Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="fixed bottom-0 left-0 w-full z-50 flex justify-center pointer-events-none">
      <div class="w-full max-w-[448px] mx-auto relative flex flex-col items-center justify-end">
        
        <!-- FAB Add Button -->
        <button aria-label="Create new item" (click)="addClicked.emit()" class="w-14 h-14 bg-theme-purple-bright rounded-full flex items-center justify-center text-theme-bg shadow-[0_8px_16px_rgba(167,139,250,0.4)] pointer-events-auto transform translate-y-6 hover:scale-105 active:scale-95 transition-all z-50 border-4 border-surface-container border-solid">
          <span class="material-symbols-outlined text-[32px]" style="font-variation-settings: 'FILL' 0;">add</span>
        </button>
        
        <!-- Navbar Background -->
        <nav class="bg-surface-container rounded-t-xl shadow-md flex justify-around items-center px-gutter-mobile py-xs w-full pointer-events-auto pb-4 pt-1 border-t border-outline-variant">
          
          <a routerLink="/today" routerLinkActive="text-primary-container active-nav-link" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center justify-center w-16 text-on-surface-variant hover:text-primary transition-colors py-1 group relative">
            <span class="material-symbols-outlined text-[24px] mb-1 z-10">calendar_today</span>
            <span class="text-[10px] font-label-md z-10 transition-all font-medium">Today</span>
            <div class="absolute inset-0 bg-primary-container opacity-0 rounded-xl scale-90 transition-all duration-150 group-[.active-nav-link]:opacity-10 py-1"></div>
          </a>
          
          <a routerLink="/habits" routerLinkActive="text-primary-container active-nav-link" class="flex flex-col items-center justify-center w-16 text-on-surface-variant hover:text-primary transition-colors py-1 group relative">
            <span class="material-symbols-outlined text-[24px] mb-1 z-10">cached</span>
            <span class="text-[10px] font-label-md z-10 transition-all font-medium">Habits</span>
            <div class="absolute inset-0 bg-primary-container opacity-0 rounded-xl scale-90 transition-all duration-150 group-[.active-nav-link]:opacity-10 py-1"></div>
          </a>

          <!-- Spacer for FAB -->
          <div class="w-16"></div>

          <a routerLink="/projects" routerLinkActive="text-primary-container active-nav-link" class="flex flex-col items-center justify-center w-16 text-on-surface-variant hover:text-primary transition-colors py-1 group relative">
            <span class="material-symbols-outlined text-[24px] mb-1 z-10">assignment</span>
            <span class="text-[10px] font-label-md z-10 transition-all font-medium">Projects</span>
            <div class="absolute inset-0 bg-primary-container opacity-0 rounded-xl scale-90 transition-all duration-150 group-[.active-nav-link]:opacity-10 py-1"></div>
          </a>
          
          <a routerLink="/progress" routerLinkActive="text-primary-container active-nav-link" class="flex flex-col items-center justify-center w-16 text-on-surface-variant hover:text-primary transition-colors py-1 group relative">
            <span class="material-symbols-outlined text-[24px] mb-1 z-10">insert_chart</span>
            <span class="text-[10px] font-label-md z-10 transition-all font-medium">Progress</span>
            <div class="absolute inset-0 bg-primary-container opacity-0 rounded-xl scale-90 transition-all duration-150 group-[.active-nav-link]:opacity-10 py-1"></div>
          </a>
          
        </nav>
      </div>
    </div>
  `
})
export class BottomNavComponent {
  addClicked = output<void>();
}
