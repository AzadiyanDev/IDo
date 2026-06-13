import { ChangeDetectionStrategy, Component, effect, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BottomNavComponent } from './shared/bottom-nav/bottom-nav';
import { CreateNewModalComponent, CreateNewMode } from './shared/create-new-modal/create-new-modal';
import { AppUpdateModalComponent } from './shared/app-update-modal/app-update-modal';
import { TaskRolloverModalComponent } from './shared/task-rollover-modal/task-rollover-modal';
import { AuthService } from './core/auth.service';
import { CalendarService } from './core/calendar.service';
import { I18nService } from './core/i18n.service';
import { PwaInstallService } from './core/pwa-install.service';
import { AppUpdateService } from './core/app-update.service';
import { TasksService } from './core/tasks.service';
import type { TaskDto } from './core/today.service';
import { TodayService } from './core/today.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, BottomNavComponent, CreateNewModalComponent, AppUpdateModalComponent, TaskRolloverModalComponent],
  template: `
    <div class="h-screen w-full flex flex-col relative overflow-hidden bg-theme-bg text-on-surface font-body-md antialiased" [attr.dir]="i18n.dir()" [attr.lang]="i18n.language()">
      <main class="flex-1 overflow-y-auto w-full max-w-[448px] mx-auto relative z-10 pb-bottom-nav hide-scrollbar">
        <router-outlet></router-outlet>
      </main>
      
      @if (showBottomNav()) {
        <app-bottom-nav (addClicked)="openCreateModal()"></app-bottom-nav>
      }

      @if (isCreateModalOpen()) {
        <app-create-new-modal [mode]="createMode()" [taskEdit]="createTaskEdit()" (closeClicked)="closeCreateModal()"></app-create-new-modal>
      }

      <app-update-modal [open]="appUpdate.updateAvailable()" (updateClicked)="applyUpdate()"></app-update-modal>
      <app-task-rollover-modal
        [open]="rolloverModalOpen()"
        [count]="rolloverTaskCount()"
        [loading]="isRollingOverTasks()"
        [error]="rolloverError()"
        (confirmClicked)="confirmTaskRollover()"
        (dismissClicked)="dismissTaskRollover()"
      ></app-task-rollover-modal>
    </div>
  `
})
export class App {
  isCreateModalOpen = signal(false);
  createMode = signal<CreateNewMode>('task');
  createTaskEdit = signal<TaskDto | null>(null);
  showBottomNav = signal(true);
  rolloverModalOpen = signal(false);
  rolloverTaskCount = signal(0);
  isRollingOverTasks = signal(false);
  rolloverError = signal<string | null>(null);
  router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);
  readonly appUpdate = inject(AppUpdateService);
  private readonly tasks = inject(TasksService);
  private readonly todayService = inject(TodayService);
  private readonly pwaInstall = inject(PwaInstallService);
  private readonly rolloverStoragePrefix = 'ido.task-rollover.prompted';
  private rolloverCheckKey: string | null = null;
  private rolloverSourceDate: string | null = null;

  constructor() {
    window.addEventListener('ido:open-create-modal', this.openCreateModalFromEvent);

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      // Hide bottom nav on detail screens
      const hideNav = event.urlAfterRedirects.includes('/project/') || 
                      event.urlAfterRedirects.includes('/task/') ||
                      event.urlAfterRedirects.includes('/habit/') ||
                      event.urlAfterRedirects.includes('/inbox') ||
                      event.urlAfterRedirects.includes('/profile') ||
                      event.urlAfterRedirects.includes('/login') ||
                      event.urlAfterRedirects.includes('/register');
      this.showBottomNav.set(!hideNav);
    });

    this.appUpdate.start();

    effect(() => {
      const user = this.auth.currentUser();
      if (!user) {
        this.rolloverCheckKey = null;
        this.rolloverModalOpen.set(false);
        return;
      }

      const today = this.calendar.todayKey();
      const checkKey = `${user.userId}:${today}`;
      if (this.rolloverCheckKey === checkKey) return;
      this.rolloverCheckKey = checkKey;
      void this.checkYesterdayTasks(user.userId, today);
    });
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
    this.createTaskEdit.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.createTaskEdit.set(null);
  }

  private readonly openCreateModalFromEvent = (event: Event): void => {
    const mode = event instanceof CustomEvent && this.isCreateMode(event.detail?.mode)
      ? event.detail.mode
      : 'task';
    this.createMode.set(mode);
    this.createTaskEdit.set(event instanceof CustomEvent && mode === 'task' ? this.taskFromEvent(event.detail?.task) : null);
    this.isCreateModalOpen.set(true);
  };

  private isCreateMode(value: unknown): value is CreateNewMode {
    return value === 'task' || value === 'habit' || value === 'project';
  }

  private taskFromEvent(value: unknown): TaskDto | null {
    if (!value || typeof value !== 'object') return null;
    return typeof (value as TaskDto).id === 'string' ? value as TaskDto : null;
  }

  applyUpdate(): void {
    void this.appUpdate.applyUpdate();
  }

  async confirmTaskRollover(): Promise<void> {
    const sourceDate = this.rolloverSourceDate;
    const user = this.auth.currentUser();
    if (!sourceDate || !user || this.isRollingOverTasks()) return;

    const targetDate = this.calendar.todayKey();
    this.isRollingOverTasks.set(true);
    this.rolloverError.set(null);
    try {
      const result = await this.tasks.rolloverTasks({ sourceDate, targetDate });
      this.markRolloverPrompted(user.userId, targetDate);
      this.rolloverModalOpen.set(false);
      this.rolloverTaskCount.set(0);
      this.rolloverSourceDate = null;
      window.dispatchEvent(new CustomEvent('ido:tasks-rolled-over', { detail: result }));
    } catch {
      this.rolloverError.set(this.i18n.text('Could not move tasks.'));
    } finally {
      this.isRollingOverTasks.set(false);
    }
  }

  dismissTaskRollover(): void {
    const user = this.auth.currentUser();
    if (user) this.markRolloverPrompted(user.userId, this.calendar.todayKey());
    this.rolloverModalOpen.set(false);
    this.rolloverError.set(null);
    this.rolloverTaskCount.set(0);
    this.rolloverSourceDate = null;
  }

  private async checkYesterdayTasks(userId: string, today: string): Promise<void> {
    if (this.wasRolloverPrompted(userId, today)) return;

    const todayDate = this.calendar.dateFromKey(today);
    if (!todayDate) return;

    const yesterday = this.calendar.formatDateKey(this.calendar.addDays(todayDate, -1));
    try {
      const dashboard = await this.todayService.getToday(yesterday);
      if (this.auth.currentUser()?.userId !== userId || this.calendar.todayKey() !== today) return;

      const unfinishedCount = [...dashboard.personalTasks, ...dashboard.projectTasks]
        .filter(task => !this.isTaskDone(task) && !this.isTaskArchived(task))
        .length;
      if (unfinishedCount === 0) {
        this.markRolloverPrompted(userId, today);
        return;
      }

      this.rolloverSourceDate = yesterday;
      this.rolloverTaskCount.set(unfinishedCount);
      this.rolloverError.set(null);
      this.rolloverModalOpen.set(true);
    } catch {
      // This check should never block normal app startup.
    }
  }

  private wasRolloverPrompted(userId: string, date: string): boolean {
    try {
      return localStorage.getItem(this.rolloverStorageKey(userId, date)) === '1';
    } catch {
      return false;
    }
  }

  private markRolloverPrompted(userId: string, date: string): void {
    try {
      localStorage.setItem(this.rolloverStorageKey(userId, date), '1');
    } catch {
      // Local storage can be unavailable in restricted browser contexts.
    }
  }

  private rolloverStorageKey(userId: string, date: string): string {
    return `${this.rolloverStoragePrefix}.${userId}.${date}`;
  }

  private isTaskDone(task: TaskDto): boolean {
    return task.status === 'Done' || task.status === 3;
  }

  private isTaskArchived(task: TaskDto): boolean {
    return task.status === 'Archived' || task.status === 5;
  }
}
