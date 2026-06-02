import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ProjectDetailsDto, ProjectDto, ProjectMemberStatus, ProjectsService, ProjectStatus } from '../../core/projects.service';
import { TaskDto } from '../../core/today.service';
import { CreateNewModalComponent } from '../../shared/create-new-modal/create-new-modal';

type ProjectFilter = 'all' | 'owned' | 'shared' | 'archived';

interface ProjectListItem {
  project: ProjectDto;
  details: ProjectDetailsDto | null;
}

@Component({
  selector: 'app-projects',
  imports: [RouterLink, CreateNewModalComponent],
  template: `
    <header class="flex justify-between items-center px-margin-mobile py-md w-full sticky top-0 bg-theme-bg/95 backdrop-blur-md z-40">
      <div class="min-w-0">
        <h1 class="font-headline-lg-mobile text-headline-lg-mobile m-0 leading-tight text-on-surface">Projects</h1>
        <p class="font-body-md text-body-md text-on-surface-variant m-0 mt-0.5">{{ headerSubtitle() }}</p>
      </div>
      <div class="flex gap-sm shrink-0">
        <button type="button" (click)="toggleSearch()" class="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-on-surface hover:opacity-80 active:scale-95 transition-all">
          <span class="material-symbols-outlined">{{ isSearchOpen() ? 'close' : 'search' }}</span>
        </button>
        <button type="button" (click)="openCreateProject()" class="w-10 h-10 rounded-full bg-theme-project-bg border border-theme-project-accent/40 flex items-center justify-center text-theme-project-accent hover:opacity-80 active:scale-95 transition-all">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
    </header>

    <div class="px-margin-mobile flex flex-col gap-lg pb-md">
      @if (isSearchOpen()) {
        <section class="relative">
          <span class="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[22px]">search</span>
          <input
            [value]="searchTerm()"
            (input)="searchTerm.set(inputValue($event))"
            type="search"
            placeholder="Search projects"
            class="w-full h-[48px] bg-theme-surface border border-theme-border rounded-full pl-[48px] pr-md text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-theme-project-accent focus:outline-none" />
        </section>
      }

      <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-36 h-36 bg-theme-project-accent/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="flex justify-between items-start gap-lg relative z-10">
          <div class="min-w-0">
            <h2 class="font-headline-md text-headline-md m-0 text-on-surface">Project Portfolio</h2>
            <p class="font-body-md text-body-md text-on-surface-variant m-0 mt-1">{{ doneTasks() }} of {{ totalTasks() }} tasks completed</p>

            <div class="flex gap-sm mt-md pt-xs items-center">
              <div class="flex flex-col">
                <span class="font-headline-lg-mobile text-headline-lg-mobile text-theme-project-accent">{{ activeCount() }}</span>
                <span class="font-label-md text-label-md text-on-surface-variant">Active</span>
              </div>
              <div class="w-px h-8 bg-theme-border"></div>
              <div class="flex flex-col">
                <span class="font-headline-lg-mobile text-headline-lg-mobile text-theme-green">{{ completedCount() }}</span>
                <span class="font-label-md text-label-md text-on-surface-variant">Done</span>
              </div>
              <div class="w-px h-8 bg-theme-border"></div>
              <div class="flex flex-col">
                <span class="font-headline-lg-mobile text-headline-lg-mobile text-theme-blue">{{ memberCount() }}</span>
                <span class="font-label-md text-label-md text-on-surface-variant">Members</span>
              </div>
            </div>
          </div>

          <div class="relative w-[88px] h-[88px] flex items-center justify-center shrink-0">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
              <circle class="fill-none stroke-theme-border" cx="21" cy="21" r="16" stroke-width="4" pathLength="100"></circle>
              <circle
                class="fill-none stroke-theme-project-accent transition-all duration-500"
                cx="21"
                cy="21"
                r="16"
                stroke-width="4"
                pathLength="100"
                stroke-linecap="round"
                [attr.stroke-dasharray]="averageProgress() + ' ' + (100 - averageProgress())">
              </circle>
            </svg>
            <span class="absolute font-headline-md text-headline-md text-on-surface">{{ averageProgress() }}%</span>
          </div>
        </div>
      </section>

      <section class="flex gap-sm overflow-x-auto hide-scrollbar pb-xs -mx-margin-mobile px-margin-mobile">
        @for (stat of quickStats(); track stat.label) {
          <div class="min-w-[132px] bg-theme-surface border border-theme-border rounded-2xl p-md flex flex-col gap-xs shrink-0">
            <div class="flex items-center gap-xs">
              <span class="material-symbols-outlined text-[18px]" [style.color]="stat.color">{{ stat.icon }}</span>
              <span class="font-label-md text-label-md text-on-surface-variant">{{ stat.label }}</span>
            </div>
            <p class="font-headline-md text-headline-md m-0 text-on-surface">{{ stat.value }}</p>
          </div>
        }
      </section>

      <section class="flex bg-theme-surface rounded-full p-1 border border-theme-border">
        @for (item of filters; track item.value) {
          <button
            type="button"
            (click)="filter.set(item.value)"
            class="flex-1 font-label-md text-label-md py-2 px-2 rounded-full transition-colors"
            [class.bg-theme-project-bg]="filter() === item.value"
            [class.text-theme-project-accent]="filter() === item.value"
            [class.text-on-surface-variant]="filter() !== item.value">
            {{ item.label }} {{ filterCount(item.value) }}
          </button>
        }
      </section>

      @if (error()) {
        <section class="rounded-2xl border border-error/40 bg-error-container/30 text-on-error-container px-md py-sm text-body-md font-body-md">
          {{ error() }}
        </section>
      }

      <section class="flex flex-col gap-md">
        <div class="flex justify-between items-center gap-md">
          <h3 class="font-headline-md text-headline-md m-0 text-on-surface">{{ listTitle() }}</h3>
          <span class="font-label-md text-label-md text-on-surface-variant">{{ filteredProjects().length }} shown</span>
        </div>

        <div class="flex flex-col gap-sm">
          @if (isLoading()) {
            @for (item of [1, 2, 3]; track item) {
              <div class="h-[164px] rounded-2xl bg-theme-surface border border-theme-border animate-pulse"></div>
            }
          } @else {
            @for (item of filteredProjects(); track item.project.id) {
              <a [routerLink]="['/project', item.project.id]" class="bg-theme-surface border border-theme-border rounded-2xl p-lg flex flex-col gap-md active:scale-[0.98] hover:bg-surface-container-high transition-all no-underline text-inherit"
                [class.bg-theme-project-bg]="isFeatured(item)"
                [class.border-theme-project-accent]="isFeatured(item)">
                <div class="flex justify-between items-start gap-md">
                  <div class="flex items-start gap-md min-w-0">
                    <div class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      [class.bg-theme-project-accent\/20]="isFeatured(item)"
                      [class.text-theme-project-accent]="isFeatured(item)"
                      [class.bg-surface-container-highest]="!isFeatured(item)"
                      [style.color]="!isFeatured(item) ? item.project.color || null : null">
                      <span class="material-symbols-outlined">{{ item.project.icon || 'assignment' }}</span>
                    </div>
                    <div class="min-w-0">
                      <h4 class="font-headline-md text-headline-md mb-1 mt-0 text-on-surface truncate">{{ item.project.title }}</h4>
                      <p class="font-body-md text-body-md text-on-surface-variant m-0 line-clamp-2">{{ item.project.description || projectFallback(item) }}</p>
                    </div>
                  </div>
                  <span class="material-symbols-outlined text-on-surface-variant shrink-0">chevron_right</span>
                </div>

                <div>
                  <div class="flex justify-between items-center mb-xs">
                    <span class="font-label-md text-label-md" [style.color]="statusColor(item)">{{ statusLabel(item.project.status) }}</span>
                    <span class="font-label-md text-label-md text-on-surface-variant">{{ projectProgress(item) }}%</span>
                  </div>
                  <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" [style.width.%]="projectProgress(item)" [style.background]="progressColor(item)"></div>
                  </div>
                </div>

                <div class="flex justify-between items-center gap-md pt-xs">
                  <div class="flex -space-x-2 min-w-0">
                    @for (member of visibleMembers(item); track member.id) {
                      <div class="w-8 h-8 rounded-full bg-surface-container-highest border-2 border-theme-surface flex items-center justify-center text-[10px] font-bold text-on-surface shrink-0">
                        {{ memberInitial(member.userId) }}
                      </div>
                    }
                    @if (hiddenMemberCount(item) > 0) {
                      <div class="w-8 h-8 rounded-full bg-surface-container-high border-2 border-theme-surface flex items-center justify-center text-[10px] font-bold text-on-surface shrink-0">
                        +{{ hiddenMemberCount(item) }}
                      </div>
                    }
                  </div>
                  <div class="flex gap-sm shrink-0">
                    <div class="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md">
                      <span class="material-symbols-outlined text-[16px]">task_alt</span> {{ doneTaskCount(item) }}/{{ taskCount(item) }}
                    </div>
                    <div class="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md">
                      <span class="material-symbols-outlined text-[16px]">layers</span> {{ sectionCount(item) }}
                    </div>
                  </div>
                </div>
              </a>
            } @empty {
              <div class="bg-theme-surface rounded-2xl border border-theme-border p-lg text-center text-on-surface-variant">
                {{ emptyMessage() }}
              </div>
            }
          }
        </div>
      </section>

      <section class="bg-theme-project-bg/70 border border-theme-project-accent/20 rounded-2xl p-md flex items-center justify-between gap-md">
        <div class="flex items-center gap-sm min-w-0">
          <div class="w-10 h-10 rounded-full bg-theme-project-accent/20 flex items-center justify-center text-theme-project-accent shrink-0">
            <span class="material-symbols-outlined text-[20px]">add_task</span>
          </div>
          <div class="min-w-0">
            <p class="font-label-md text-label-md text-theme-project-accent mb-0.5 mt-0">New workspace</p>
            <p class="font-body-md text-body-md text-on-surface m-0 leading-tight">Use the bottom plus button here to add a project.</p>
          </div>
        </div>
        <button type="button" (click)="openCreateProject()" class="bg-theme-project-accent/20 text-theme-project-accent font-label-md text-label-md px-md py-2 rounded-full hover:bg-theme-project-accent/30 transition-colors shrink-0 border-none outline-none">Create</button>
      </section>
    </div>

    @if (isCreateProjectOpen()) {
      <app-create-new-modal mode="project" (closeClicked)="isCreateProjectOpen.set(false)"></app-create-new-modal>
    }
  `
})
export class ProjectsComponent implements OnDestroy {
  private readonly projectsService = inject(ProjectsService);
  private readonly auth = inject(AuthService);
  private readonly projectCreatedHandler = () => void this.load();

  readonly projects = signal<ProjectListItem[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal<ProjectFilter>('all');
  readonly searchTerm = signal('');
  readonly isSearchOpen = signal(false);
  readonly isCreateProjectOpen = signal(false);
  readonly currentUser = this.auth.currentUser;
  readonly filters: { value: ProjectFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'owned', label: 'Owned' },
    { value: 'shared', label: 'Shared' },
    { value: 'archived', label: 'Archived' }
  ];

  readonly filteredProjects = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this.projects()
      .filter(item => this.matchesFilter(item, this.filter()))
      .filter(item => !term || `${item.project.title} ${item.project.description ?? ''}`.toLowerCase().includes(term))
      .sort((left, right) => Number(this.isArchived(left)) - Number(this.isArchived(right)) || left.project.title.localeCompare(right.project.title));
  });
  readonly activeCount = computed(() => this.projects().filter(item => this.statusLabel(item.project.status) === 'Active').length);
  readonly completedCount = computed(() => this.projects().filter(item => this.statusLabel(item.project.status) === 'Completed').length);
  readonly archivedCount = computed(() => this.projects().filter(item => this.isArchived(item)).length);
  readonly sharedCount = computed(() => this.projects().filter(item => !this.isOwned(item.project)).length);
  readonly totalTasks = computed(() => this.projects().reduce((sum, item) => sum + this.taskCount(item), 0));
  readonly doneTasks = computed(() => this.projects().reduce((sum, item) => sum + this.doneTaskCount(item), 0));
  readonly memberCount = computed(() => new Set(this.projects().flatMap(item => this.activeMembers(item).map(member => member.userId))).size);
  readonly averageProgress = computed(() => {
    const items = this.projects().filter(item => !this.isArchived(item));
    if (items.length === 0) return 0;
    return Math.round(items.reduce((sum, item) => sum + this.projectProgress(item), 0) / items.length);
  });
  readonly quickStats = computed(() => [
    { label: 'Owned', value: this.projects().filter(item => this.isOwned(item.project)).length, icon: 'verified_user', color: '#B072FF' },
    { label: 'Shared', value: this.sharedCount(), icon: 'group', color: '#3EAEFF' },
    { label: 'Archived', value: this.archivedCount(), icon: 'inventory_2', color: '#FFC000' },
    { label: 'Tasks', value: this.totalTasks(), icon: 'task_alt', color: '#00F4B9' }
  ]);

  constructor() {
    window.addEventListener('ido:project-created', this.projectCreatedHandler);
    void this.load();
  }

  ngOnDestroy(): void {
    window.removeEventListener('ido:project-created', this.projectCreatedHandler);
  }

  openCreateProject(): void {
    this.isCreateProjectOpen.set(true);
  }

  toggleSearch(): void {
    this.isSearchOpen.update(value => !value);
    if (!this.isSearchOpen()) this.searchTerm.set('');
  }

  inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  filterCount(filter: ProjectFilter): number {
    return this.projects().filter(item => this.matchesFilter(item, filter)).length;
  }

  listTitle(): string {
    switch (this.filter()) {
      case 'owned':
        return 'Owned Projects';
      case 'shared':
        return 'Shared Projects';
      case 'archived':
        return 'Archived Projects';
      case 'all':
        return 'My Projects';
    }
  }

  headerSubtitle(): string {
    if (this.isLoading()) return 'Loading your workspaces';
    return `${this.activeCount()} active, ${this.doneTasks()} tasks done`;
  }

  emptyMessage(): string {
    if (this.searchTerm().trim()) return 'No projects match your search.';
    if (this.filter() === 'archived') return 'No archived projects yet.';
    if (this.filter() === 'shared') return 'No shared projects yet.';
    return 'Create your first project to organize related tasks.';
  }

  isFeatured(item: ProjectListItem): boolean {
    return !this.isArchived(item) && this.projectProgress(item) >= 50;
  }

  projectFallback(item: ProjectListItem): string {
    const tasks = this.taskCount(item);
    const sections = this.sectionCount(item);
    if (tasks === 0 && sections === 0) return 'Ready for tasks and sections';
    return `${tasks} task${tasks === 1 ? '' : 's'} across ${sections} section${sections === 1 ? '' : 's'}`;
  }

  projectProgress(item: ProjectListItem): number {
    const percentage = item.details?.progress.percentage;
    if (typeof percentage === 'number') return Math.max(0, Math.min(100, Math.round(percentage)));
    const total = this.taskCount(item);
    return total === 0 ? 0 : Math.round(this.doneTaskCount(item) * 100 / total);
  }

  progressColor(item: ProjectListItem): string {
    if (this.isArchived(item)) return '#8E9BAE';
    if (this.statusLabel(item.project.status) === 'Completed') return '#00F4B9';
    return item.project.color || '#B072FF';
  }

  statusColor(item: ProjectListItem): string {
    if (this.isArchived(item)) return '#8E9BAE';
    if (this.statusLabel(item.project.status) === 'Completed') return '#00F4B9';
    return item.project.color || '#B072FF';
  }

  statusLabel(status: ProjectStatus): 'Active' | 'Completed' | 'Archived' {
    if (status === 1 || status === 'Completed') return 'Completed';
    if (status === 2 || status === 'Archived') return 'Archived';
    return 'Active';
  }

  visibleMembers(item: ProjectListItem) {
    return this.activeMembers(item).slice(0, 3);
  }

  hiddenMemberCount(item: ProjectListItem): number {
    return Math.max(0, this.activeMembers(item).length - 3);
  }

  memberInitial(userId: string): string {
    if (userId === this.currentUser()?.userId) return 'YOU';
    return userId.replace(/-/g, '').slice(0, 2).toUpperCase();
  }

  taskCount(item: ProjectListItem): number {
    return item.details?.progress.totalCount ?? item.details?.tasks.length ?? 0;
  }

  doneTaskCount(item: ProjectListItem): number {
    return item.details?.progress.doneCount ?? item.details?.tasks.filter(task => this.isTaskDone(task)).length ?? 0;
  }

  sectionCount(item: ProjectListItem): number {
    return item.details?.sections.length ?? 0;
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const projects = await this.projectsService.getProjects();
      const items = await Promise.all(projects.map(async project => ({
        project,
        details: await this.loadDetails(project)
      })));
      this.projects.set(items);
    } catch (error) {
      this.error.set(this.messageFromError(error, 'Could not load projects.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadDetails(project: ProjectDto): Promise<ProjectDetailsDto | null> {
    try {
      return await this.projectsService.getProjectDetails(project.id);
    } catch {
      return null;
    }
  }

  private matchesFilter(item: ProjectListItem, filter: ProjectFilter): boolean {
    switch (filter) {
      case 'owned':
        return this.isOwned(item.project) && !this.isArchived(item);
      case 'shared':
        return !this.isOwned(item.project) && !this.isArchived(item);
      case 'archived':
        return this.isArchived(item);
      case 'all':
        return !this.isArchived(item);
    }
  }

  private isOwned(project: ProjectDto): boolean {
    return project.ownerUserId === this.currentUser()?.userId;
  }

  private isArchived(item: ProjectListItem): boolean {
    return this.statusLabel(item.project.status) === 'Archived' || item.project.archivedAtUtc !== null;
  }

  private activeMembers(item: ProjectListItem) {
    return (item.details?.members ?? []).filter(member => this.memberStatusLabel(member.status) === 'Active');
  }

  private memberStatusLabel(status: ProjectMemberStatus): 'Active' | 'Pending' | 'Rejected' | 'Removed' {
    if (status === 1 || status === 'Pending') return 'Pending';
    if (status === 2 || status === 'Rejected') return 'Rejected';
    if (status === 3 || status === 'Removed') return 'Removed';
    return 'Active';
  }

  private isTaskDone(task: TaskDto): boolean {
    const status = task.status as TaskDto['status'] | number;
    return status === 'Done' || status === 3;
  }

  private messageFromError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { errors?: string[]; error?: string } | null;
      if (Array.isArray(body?.errors) && body.errors.length > 0) return body.errors.join(' ');
      if (body?.error) return body.error;
    }

    return fallback;
  }
}
