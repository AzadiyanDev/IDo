import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BottomNavComponent } from './shared/bottom-nav/bottom-nav';
import { CreateNewModalComponent, CreateNewMode } from './shared/create-new-modal/create-new-modal';
import { AppUpdateModalComponent } from './shared/app-update-modal/app-update-modal';
import { I18nService } from './core/i18n.service';
import { PwaInstallService } from './core/pwa-install.service';
import { AppUpdateService } from './core/app-update.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, BottomNavComponent, CreateNewModalComponent, AppUpdateModalComponent],
  template: `
    <div class="h-screen w-full flex flex-col relative overflow-hidden bg-theme-bg text-on-surface font-body-md antialiased" [attr.dir]="i18n.dir()" [attr.lang]="i18n.language()">
      <main class="flex-1 overflow-y-auto w-full max-w-[448px] mx-auto relative z-10 pb-bottom-nav hide-scrollbar">
        <router-outlet></router-outlet>
      </main>
      
      @if (showBottomNav()) {
        <app-bottom-nav (addClicked)="openCreateModal()"></app-bottom-nav>
      }

      @if (isCreateModalOpen()) {
        <app-create-new-modal [mode]="createMode()" (closeClicked)="isCreateModalOpen.set(false)"></app-create-new-modal>
      }

      <app-update-modal [open]="appUpdate.updateAvailable()" (updateClicked)="applyUpdate()"></app-update-modal>
    </div>
  `
})
export class App {
  isCreateModalOpen = signal(false);
  createMode = signal<CreateNewMode>('task');
  showBottomNav = signal(true);
  router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly appUpdate = inject(AppUpdateService);
  private readonly pwaInstall = inject(PwaInstallService);

  constructor() {
    window.addEventListener('ido:open-create-modal', this.openCreateModalFromEvent);

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      // Hide bottom nav on detail screens
      const hideNav = event.urlAfterRedirects.includes('/project/') || 
                      event.urlAfterRedirects.includes('/task/') ||
                      event.urlAfterRedirects.includes('/inbox') ||
                      event.urlAfterRedirects.includes('/profile') ||
                      event.urlAfterRedirects.includes('/login') ||
                      event.urlAfterRedirects.includes('/register');
      this.showBottomNav.set(!hideNav);
    });

    this.appUpdate.start();
  }

  ngOnDestroy(): void {
    window.removeEventListener('ido:open-create-modal', this.openCreateModalFromEvent);
  }

  openCreateModal(): void {
    const mode = this.router.url.startsWith('/habits')
      ? 'habit'
      : this.router.url.startsWith('/projects')
        ? 'project'
        : 'task';
    this.createMode.set(mode);
    this.isCreateModalOpen.set(true);
  }

  private readonly openCreateModalFromEvent = (event: Event): void => {
    const mode = event instanceof CustomEvent && this.isCreateMode(event.detail?.mode)
      ? event.detail.mode
      : 'task';
    this.createMode.set(mode);
    this.isCreateModalOpen.set(true);
  };

  private isCreateMode(value: unknown): value is CreateNewMode {
    return value === 'task' || value === 'habit' || value === 'project';
  }

  applyUpdate(): void {
    void this.appUpdate.applyUpdate();
  }
}
