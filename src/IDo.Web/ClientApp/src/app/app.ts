import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BottomNavComponent } from './shared/bottom-nav/bottom-nav';
import { CreateNewModalComponent } from './shared/create-new-modal/create-new-modal';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, BottomNavComponent, CreateNewModalComponent],
  template: `
    <div class="h-screen w-full flex flex-col relative overflow-hidden bg-theme-bg text-on-surface font-body-md antialiased">
      <main class="flex-1 overflow-y-auto w-full max-w-[448px] mx-auto relative z-10 pb-bottom-nav hide-scrollbar">
        <router-outlet></router-outlet>
      </main>
      
      @if (showBottomNav()) {
        <app-bottom-nav (addClicked)="isCreateModalOpen.set(true)"></app-bottom-nav>
      }

      @if (isCreateModalOpen()) {
        <app-create-new-modal (closeClicked)="isCreateModalOpen.set(false)"></app-create-new-modal>
      }
    </div>
  `
})
export class App {
  isCreateModalOpen = signal(false);
  showBottomNav = signal(true);
  router = inject(Router);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      // Hide bottom nav on detail screens
      const hideNav = event.urlAfterRedirects.includes('/project/') || 
                      event.urlAfterRedirects.includes('/task/') ||
                      event.urlAfterRedirects.includes('/inbox');
      this.showBottomNav.set(!hideNav);
    });
  }
}
