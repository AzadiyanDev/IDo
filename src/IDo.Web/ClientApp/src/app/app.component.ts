import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AddHabitModalComponent } from './modals/add-habit-modal.component';
import { AddProjectModalComponent } from './modals/add-project-modal.component';
import { AddTaskModalComponent } from './modals/add-task-modal.component';

@Component({
  selector: 'ido-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AddTaskModalComponent, AddHabitModalComponent, AddProjectModalComponent],
  template: `
    <main class="app-shell">
      <router-outlet />
    </main>

    @if (activeSheet()) {
      <section class="sheet-backdrop" (click)="activeSheet.set(null)">
        <div class="sheet" (click)="$event.stopPropagation()">
          @switch (activeSheet()) {
            @case ('task') { <ido-add-task-modal /> }
            @case ('habit') { <ido-add-habit-modal /> }
            @case ('project') { <ido-add-project-modal /> }
          }
        </div>
      </section>
    }

    <nav class="bottom-nav" aria-label="Primary">
      <a routerLink="/today" routerLinkActive="active">Today</a>
      <a routerLink="/habits" routerLinkActive="active">Habits</a>
      <button class="plus" type="button" (click)="activeSheet.set('task')" aria-label="Add">+</button>
      <a routerLink="/projects" routerLinkActive="active">Projects</a>
      <a routerLink="/profile" routerLinkActive="active">Profile</a>
    </nav>
  `,
  styles: [`
    .app-shell { min-height: 100vh; }
    .bottom-nav {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      height: 72px;
      display: grid;
      grid-template-columns: 1fr 1fr 64px 1fr 1fr;
      align-items: center;
      padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
      background: rgba(255, 255, 255, 0.96);
      border-top: 1px solid #dedbd3;
      backdrop-filter: blur(12px);
      z-index: 20;
    }
    .bottom-nav a {
      color: #616161;
      text-decoration: none;
      text-align: center;
      font-size: 0.78rem;
      font-weight: 650;
    }
    .bottom-nav a.active { color: #1e6f5c; }
    .plus {
      justify-self: center;
      width: 52px;
      height: 52px;
      border: 0;
      border-radius: 50%;
      background: #1e6f5c;
      color: #fff;
      font-size: 1.8rem;
      line-height: 1;
    }
    .sheet-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.28);
      z-index: 30;
      display: grid;
      align-items: end;
    }
    .sheet {
      background: #fff;
      border-radius: 16px 16px 0 0;
      padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
      border: 1px solid #dedbd3;
    }
  `]
})
export class AppComponent {
  activeSheet = signal<'task' | 'habit' | 'project' | null>(null);
}
