import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-inbox',
  imports: [RouterLink],
  template: `
    <header class="flex justify-between items-center px-margin-mobile py-md w-full sticky top-0 bg-theme-bg/90 backdrop-blur-md z-40">
      <button (click)="location.back()" class="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 border-none outline-none bg-transparent text-on-surface cursor-pointer">
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>
      <h1 class="font-headline-md text-headline-md m-0 leading-tight text-on-surface text-center flex-1">Inbox</h1>
      <div class="w-10 h-10 flex-shrink-0"></div> <!-- Spacer for centering -->
    </header>

    <div class="px-margin-mobile flex flex-col gap-sm pb-10 mt-2">
      
      <!-- Project Invite -->
      <div class="bg-theme-surface border border-theme-border rounded-[20px] p-md flex flex-col gap-sm relative overflow-hidden shadow-sm">
        <a routerLink="/project/3" class="flex items-center gap-sm no-underline active:opacity-70 transition-opacity">
          <div class="w-10 h-10 rounded-full bg-theme-purple/10 flex items-center justify-center text-theme-purple shrink-0">
            <span class="material-symbols-outlined text-[20px]">group_add</span>
          </div>
          <div class="flex-1">
            <p class="font-body-md text-on-surface m-0 leading-tight"><span class="font-bold">Alex</span> invited you to join <span class="font-bold">Website Redesign</span></p>
            <p class="font-label-md text-on-surface-variant m-0 mt-1">Project Invitation &bull; 2h ago</p>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">chevron_right</span>
        </a>
        <div class="flex gap-2 mt-2">
            <button class="flex-1 bg-theme-purple text-theme-bg font-label-md py-2 rounded-full border-none font-semibold hover:opacity-90 transition-opacity cursor-pointer">Accept</button>
            <button class="flex-1 bg-surface-container-high text-on-surface-variant font-label-md py-2 rounded-full border-none font-semibold hover:opacity-90 transition-opacity cursor-pointer">Decline</button>
        </div>
      </div>

      <!-- Task Request -->
      <div class="bg-theme-surface border border-theme-border rounded-[20px] p-md flex flex-col gap-sm relative overflow-hidden shadow-sm">
        <a routerLink="/task/1" class="flex items-center gap-sm no-underline active:opacity-70 transition-opacity">
          <div class="w-10 h-10 rounded-full bg-theme-blue/10 flex items-center justify-center text-theme-blue shrink-0">
            <span class="material-symbols-outlined text-[20px]">assignment_turned_in</span>
          </div>
          <div class="flex-1">
            <p class="font-body-md text-on-surface m-0 leading-tight"><span class="font-bold">Sara</span> assigned you to <span class="font-bold">Finalize dashboard UI</span></p>
            <p class="font-label-md text-on-surface-variant m-0 mt-1">Task Assignment &bull; 5h ago</p>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">chevron_right</span>
        </a>
        <div class="flex gap-2 mt-2">
            <button class="flex-1 bg-theme-blue text-theme-bg font-label-md py-2 rounded-full border-none font-semibold hover:opacity-90 transition-opacity cursor-pointer">Accept</button>
            <button class="flex-1 bg-surface-container-high text-on-surface-variant font-label-md py-2 rounded-full border-none font-semibold hover:opacity-90 transition-opacity cursor-pointer">Decline</button>
        </div>
      </div>

    </div>
  `
})
export class InboxComponent {
  location = inject(Location);
}
