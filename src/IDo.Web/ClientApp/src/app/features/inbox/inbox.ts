import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskRequestsService } from '../../core/task-requests.service';
import type { TaskRequestDto } from '../../core/today.service';

@Component({
  selector: 'app-inbox',
  imports: [RouterLink],
  template: `
    <header class="flex justify-between items-center px-margin-mobile py-md w-full sticky top-0 bg-theme-bg/90 backdrop-blur-md z-40">
      <button (click)="location.back()" class="w-10 h-10 flex shrink-0 items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 border-none bg-transparent text-on-surface">
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>
      <div class="flex flex-col items-center min-w-0">
        <h1 class="font-headline-md text-headline-md m-0 leading-tight text-on-surface">Inbox</h1>
        <span class="font-label-md text-label-md text-on-surface-variant">{{ pendingRequests().length }} pending requests</span>
      </div>
      <button (click)="reload()" class="w-10 h-10 flex shrink-0 items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 border-none bg-transparent text-on-surface">
        <span class="material-symbols-outlined text-[20px]">refresh</span>
      </button>
    </header>

    <div class="px-margin-mobile flex flex-col gap-sm pb-10 mt-2">
      @if (isLoading()) {
        @for (item of [1, 2, 3]; track item) {
          <div class="h-[124px] bg-theme-surface border border-theme-border rounded-[20px] animate-pulse"></div>
        }
      } @else if (error()) {
        <section class="rounded-2xl border border-error/40 bg-error-container/30 text-on-error-container px-md py-sm text-body-md font-body-md">
          {{ error() }}
        </section>
      } @else {
        @for (request of pendingRequests(); track request.id) {
          <article class="request-card">
            <a [routerLink]="detailLink(request)" class="flex items-center gap-sm no-underline active:opacity-70 transition-opacity text-inherit">
              <div class="request-icon" [class.project-icon]="typeName(request.type) === 'ProjectInvite'" [class.section-icon]="typeName(request.type) === 'SectionAssignment'">
                <span class="material-symbols-outlined text-[20px]">{{ iconFor(request) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-body-md text-on-surface m-0 leading-tight">{{ request.title }}</p>
                <p class="font-label-md text-on-surface-variant m-0 mt-1">{{ typeLabel(request.type) }} · {{ relativeTime(request.createdAtUtc) }}</p>
              </div>
              <span class="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">chevron_right</span>
            </a>
            @if (request.message) {
              <p class="font-body-md text-on-surface-variant m-0 bg-surface-container-low rounded-xl px-sm py-xs">{{ request.message }}</p>
            }
            <div class="flex gap-2">
              <button (click)="respond(request, true)" [disabled]="isResponding(request.id)" class="flex-1 bg-theme-blue text-theme-bg font-label-md py-2 rounded-full border-none font-semibold">Accept</button>
              <button (click)="respond(request, false)" [disabled]="isResponding(request.id)" class="flex-1 bg-surface-container-high text-on-surface-variant font-label-md py-2 rounded-full border-none font-semibold">Decline</button>
            </div>
          </article>
        } @empty {
          <section class="bg-theme-surface border border-theme-border rounded-[24px] p-lg text-center">
            <span class="material-symbols-outlined text-theme-blue text-[34px]">inbox</span>
            <h2 class="font-headline-md text-on-surface mt-sm mb-xs">Inbox is clear</h2>
            <p class="font-body-md text-on-surface-variant m-0">Project invitations and assignment requests will appear here.</p>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .request-card { background: var(--color-theme-surface); border: 1px solid var(--color-theme-border); border-radius: 20px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 8px 22px rgba(0,0,0,.18); }
    .request-icon { width: 40px; height: 40px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: rgba(62, 174, 255, .12); color: var(--color-theme-blue); flex-shrink: 0; }
    .project-icon { background: rgba(176, 114, 255, .13); color: var(--color-theme-purple); }
    .section-icon { background: rgba(255, 192, 0, .13); color: var(--color-theme-orange); }
  `]
})
export class InboxComponent {
  private readonly requests = inject(TaskRequestsService);
  readonly location = inject(Location);

  readonly inbox = signal<TaskRequestDto[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly respondingId = signal<string | null>(null);
  readonly pendingRequests = computed(() => this.inbox().filter(request => request.status === 'Pending' || request.status === 0));

  constructor() {
    void this.load();
  }

  reload(): void {
    void this.load();
  }

  async respond(request: TaskRequestDto, accept: boolean): Promise<void> {
    if (this.respondingId()) return;
    this.respondingId.set(request.id);
    this.error.set(null);
    try {
      const updated = accept ? await this.requests.accept(request.id) : await this.requests.reject(request.id);
      this.inbox.update(items => items.map(item => item.id === request.id ? updated : item).filter(item => item.status === 'Pending' || item.status === 0));
    } catch (error) {
      this.error.set(this.messageFromError(error, 'Could not respond to request.'));
    } finally {
      this.respondingId.set(null);
    }
  }

  isResponding(id: string): boolean {
    return this.respondingId() === id;
  }

  detailLink(request: TaskRequestDto): string[] {
    if (this.typeName(request.type) === 'TaskAssignment' && request.taskId) return ['/task', request.taskId];
    if (request.projectId) return ['/project', request.projectId];
    return ['/inbox'];
  }

  typeName(type: TaskRequestDto['type']): 'ProjectInvite' | 'SectionAssignment' | 'TaskAssignment' {
    if (type === 0 || type === 'ProjectInvite') return 'ProjectInvite';
    if (type === 1 || type === 'SectionAssignment') return 'SectionAssignment';
    return 'TaskAssignment';
  }

  typeLabel(type: TaskRequestDto['type']): string {
    const name = this.typeName(type);
    if (name === 'ProjectInvite') return 'Project Invitation';
    if (name === 'SectionAssignment') return 'Section Assignment';
    return 'Task Assignment';
  }

  iconFor(request: TaskRequestDto): string {
    const name = this.typeName(request.type);
    if (name === 'ProjectInvite') return 'group_add';
    if (name === 'SectionAssignment') return 'view_column';
    return 'assignment_turned_in';
  }

  relativeTime(value: string): string {
    const date = new Date(value);
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const ranges: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, amount] of ranges) {
      if (Math.abs(seconds) >= amount) return formatter.format(Math.round(seconds / amount), unit);
    }
    return 'just now';
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      this.inbox.set(await this.requests.getInbox());
    } catch (error) {
      this.error.set(this.messageFromError(error, 'Could not load inbox.'));
    } finally {
      this.isLoading.set(false);
    }
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
