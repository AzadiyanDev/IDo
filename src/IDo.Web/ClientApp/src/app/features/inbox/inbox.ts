import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskRequestsService } from '../../core/task-requests.service';
import { I18nService } from '../../core/i18n.service';
import type { TaskRequestDto } from '../../core/today.service';

type HoldAction = 'accept' | 'reject';

@Component({
  selector: 'app-inbox',
  imports: [RouterLink],
  template: `
    <header class="flex justify-between items-center px-margin-mobile py-md w-full sticky top-0 bg-theme-bg/95 backdrop-blur-md z-40">
      <button (click)="goBack()" class="icon-button">
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>
      <div class="flex flex-col items-center min-w-0">
        <h1 class="font-headline-md text-headline-md m-0 leading-tight text-on-surface">{{ selectedRequest() ? i18n.text('Request') : i18n.text('Inbox') }}</h1>
        <span class="font-label-md text-label-md text-on-surface-variant">{{ headerSubtitle() }}</span>
      </div>
      <button (click)="reload()" class="icon-button">
        <span class="material-symbols-outlined text-[20px]">refresh</span>
      </button>
    </header>

    <div class="px-margin-mobile flex flex-col gap-md pb-10 mt-2">
      @if (isLoading()) {
        @for (item of [1, 2, 3]; track item) {
          <div class="h-[124px] bg-theme-surface border border-theme-border rounded-[20px] animate-pulse"></div>
        }
      } @else if (error()) {
        <section class="rounded-2xl border border-error/40 bg-error-container/30 text-on-error-container px-md py-sm text-body-md font-body-md">
          {{ error() }}
        </section>
      } @else if (selectedRequest(); as request) {
        <section class="request-detail">
          <div class="flex items-start gap-md">
            <div class="request-icon detail-icon" [class.project-icon]="typeName(request.type) === 'ProjectInvite'" [class.section-icon]="typeName(request.type) === 'SectionAssignment'">
              <span class="material-symbols-outlined text-[24px]">{{ iconFor(request) }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <span class="detail-pill">{{ typeLabel(request.type) }}</span>
              <h2 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-sm mb-xs leading-tight">{{ request.title }}</h2>
              <p class="font-body-md text-body-md text-on-surface-variant m-0">{{ relativeTime(request.createdAtUtc) }}</p>
            </div>
          </div>

          @if (request.message) {
            <div class="detail-box">
              <span class="font-label-md text-label-md text-on-surface-variant uppercase">{{ i18n.text('Message') }}</span>
              <p class="font-body-lg text-body-lg text-on-surface m-0 mt-xs">{{ request.message }}</p>
            </div>
          }

          <div class="detail-grid">
            <div>
              <span class="font-label-md text-label-md text-on-surface-variant uppercase">{{ i18n.text('Status') }}</span>
              <p class="font-body-md text-body-md text-on-surface m-0 mt-xs">{{ statusLabel(request.status) }}</p>
            </div>
            <div>
              <span class="font-label-md text-label-md text-on-surface-variant uppercase">{{ i18n.text('Created') }}</span>
              <p class="font-body-md text-body-md text-on-surface m-0 mt-xs">{{ dateLabel(request.createdAtUtc) }}</p>
            </div>
            @if (request.projectId) {
              <a [routerLink]="['/project', request.projectId]" class="detail-link">
                <span class="material-symbols-outlined text-[18px]">assignment</span>
                {{ i18n.text('Open project') }}
              </a>
            }
            @if (request.taskId) {
              <a [routerLink]="['/task', request.taskId]" class="detail-link">
                <span class="material-symbols-outlined text-[18px]">task_alt</span>
                {{ i18n.text('Open task') }}
              </a>
            }
          </div>
        </section>

        @if (isPending(request)) {
          <section class="hold-panel">
            <p class="font-label-md text-label-md text-on-surface-variant m-0 text-center">{{ i18n.text('Hold for 2 seconds') }}</p>
            <div class="hold-actions" [class.holding]="isHolding(request.id)">
              @if (!isHolding(request.id) || activeAction() === 'accept') {
                <button
                  type="button"
                  class="hold-button accept-button"
                  [class.hold-expanded]="activeAction() === 'accept'"
                  [disabled]="respondingId() !== null"
                  (pointerdown)="startHold(request, 'accept')"
                  (pointerup)="cancelHold()"
                  (pointerleave)="cancelHold()"
                  (pointercancel)="cancelHold()">
                  <span class="hold-fill"></span>
                  <span class="material-symbols-outlined text-[20px]">check</span>
                  <span>{{ i18n.text('Accept') }}</span>
                </button>
              }
              @if (!isHolding(request.id) || activeAction() === 'reject') {
                <button
                  type="button"
                  class="hold-button reject-button"
                  [class.hold-expanded]="activeAction() === 'reject'"
                  [disabled]="respondingId() !== null"
                  (pointerdown)="startHold(request, 'reject')"
                  (pointerup)="cancelHold()"
                  (pointerleave)="cancelHold()"
                  (pointercancel)="cancelHold()">
                  <span class="hold-fill"></span>
                  <span class="material-symbols-outlined text-[20px]">close</span>
                  <span>{{ i18n.text('Reject') }}</span>
                </button>
              }
            </div>
          </section>
        }
      } @else {
        <section class="bg-theme-surface border border-theme-border rounded-2xl p-md flex items-center justify-between gap-md">
          <div>
            <h2 class="font-headline-md text-headline-md text-on-surface m-0">{{ pendingLabel() }}</h2>
            <p class="font-body-md text-body-md text-on-surface-variant m-0 mt-1">{{ i18n.text('Invites and assignment requests sent to you.') }}</p>
          </div>
          <span class="material-symbols-outlined text-theme-blue text-[28px]">notifications</span>
        </section>

        @for (request of pendingRequests(); track request.id) {
          <button type="button" (click)="openRequest(request)" class="request-card">
            <div class="request-icon" [class.project-icon]="typeName(request.type) === 'ProjectInvite'" [class.section-icon]="typeName(request.type) === 'SectionAssignment'">
              <span class="material-symbols-outlined text-[20px]">{{ iconFor(request) }}</span>
            </div>
            <div class="flex-1 min-w-0 text-start">
              <p class="font-body-lg text-body-lg text-on-surface m-0 leading-tight truncate">{{ request.title }}</p>
              <p class="font-label-md text-label-md text-on-surface-variant m-0 mt-1">{{ typeLabel(request.type) }} · {{ relativeTime(request.createdAtUtc) }}</p>
              @if (request.message) {
                <p class="font-body-md text-body-md text-on-surface-variant mt-xs mb-0 line-clamp-2">{{ request.message }}</p>
              }
            </div>
            <span class="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">chevron_right</span>
          </button>
        } @empty {
          <section class="bg-theme-surface border border-theme-border rounded-[24px] p-lg text-center">
            <span class="material-symbols-outlined text-theme-blue text-[34px]">inbox</span>
            <h2 class="font-headline-md text-on-surface mt-sm mb-xs">{{ i18n.text('Inbox is clear') }}</h2>
            <p class="font-body-md text-on-surface-variant m-0">{{ i18n.text('Project invitations and assignment requests will appear here.') }}</p>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .icon-button { width: 40px; height: 40px; display: flex; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid var(--color-theme-border); background: var(--color-theme-surface); color: var(--color-on-surface); transition: transform 140ms ease, opacity 140ms ease; }
    .icon-button:active { transform: scale(.95); }
    .request-card { width: 100%; background: var(--color-theme-surface); border: 1px solid var(--color-theme-border); border-radius: 20px; padding: 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 22px rgba(0,0,0,.18); text-align: left; }
    .request-icon { width: 42px; height: 42px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: rgba(62, 174, 255, .12); color: var(--color-theme-blue); flex-shrink: 0; }
    .project-icon { background: rgba(176, 114, 255, .13); color: var(--color-theme-purple); }
    .section-icon { background: rgba(255, 192, 0, .13); color: var(--color-theme-orange); }
    .request-detail { background: var(--color-theme-surface); border: 1px solid var(--color-theme-border); border-radius: 24px; padding: 18px; display: flex; flex-direction: column; gap: 18px; }
    .detail-icon { width: 54px; height: 54px; }
    .detail-pill { display: inline-flex; width: fit-content; border-radius: 999px; padding: 5px 10px; background: var(--color-surface-container-high); color: var(--color-on-surface-variant); font: 700 11px/14px var(--font-app); }
    .detail-box { border: 1px solid var(--color-theme-border); background: var(--color-surface-container-lowest); border-radius: 18px; padding: 14px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .detail-link { min-height: 46px; border-radius: 16px; background: var(--color-surface-container-high); color: var(--color-on-surface); display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; font: 700 12px/14px var(--font-app); }
    .hold-panel { position: sticky; bottom: 12px; background: color-mix(in srgb, var(--color-theme-surface) 92%, transparent); border: 1px solid var(--color-theme-border); border-radius: 24px; padding: 14px; display: flex; flex-direction: column; gap: 10px; backdrop-filter: blur(16px); }
    .hold-actions { display: flex; gap: 10px; min-height: 56px; }
    .hold-button { flex: 1; min-width: 0; border: none; border-radius: 999px; color: var(--color-theme-bg); font: 800 14px/18px var(--font-app); display: flex; align-items: center; justify-content: center; gap: 8px; position: relative; overflow: hidden; transition: flex 220ms ease, transform 180ms ease; touch-action: none; }
    .hold-button > span:not(.hold-fill) { position: relative; z-index: 2; }
    .hold-expanded { flex: 1 0 100%; transform: scale(1.01); }
    .accept-button { background: color-mix(in srgb, var(--color-theme-green) 28%, var(--color-surface-container-high)); }
    .reject-button { background: color-mix(in srgb, var(--color-theme-rose) 28%, var(--color-surface-container-high)); color: #fff; }
    .hold-fill { position: absolute; inset: 0 auto 0 0; width: 0%; z-index: 1; opacity: .95; }
    .accept-button .hold-fill { background: var(--color-theme-green); }
    .reject-button .hold-fill { background: var(--color-theme-rose); }
    .hold-expanded .hold-fill { animation: hold-fill 2s linear forwards; }
    @keyframes hold-fill {
      from { width: 0%; }
      to { width: 100%; }
    }
  `]
})
export class InboxComponent {
  private readonly requests = inject(TaskRequestsService);
  readonly i18n = inject(I18nService);
  readonly location = inject(Location);

  readonly inbox = signal<TaskRequestDto[]>([]);
  readonly selectedRequest = signal<TaskRequestDto | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly respondingId = signal<string | null>(null);
  readonly activeHoldRequestId = signal<string | null>(null);
  readonly activeAction = signal<HoldAction | null>(null);
  readonly pendingRequests = computed(() => this.inbox().filter(request => this.isPending(request)));
  private holdTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.load();
  }

  reload(): void {
    void this.load();
  }

  goBack(): void {
    if (this.selectedRequest()) {
      this.selectedRequest.set(null);
      this.cancelHold();
      return;
    }

    this.location.back();
  }

  openRequest(request: TaskRequestDto): void {
    this.selectedRequest.set(request);
    this.cancelHold();
  }

  startHold(request: TaskRequestDto, action: HoldAction): void {
    if (this.respondingId() || !this.isPending(request)) return;
    this.cancelHold();
    this.activeHoldRequestId.set(request.id);
    this.activeAction.set(action);
    this.holdTimer = setTimeout(() => {
      void this.respond(request, action === 'accept');
    }, 2000);
  }

  cancelHold(): void {
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = null;
    this.activeHoldRequestId.set(null);
    this.activeAction.set(null);
  }

  async respond(request: TaskRequestDto, accept: boolean): Promise<void> {
    if (this.respondingId()) return;
    this.respondingId.set(request.id);
    this.error.set(null);
    try {
      const updated = accept ? await this.requests.accept(request.id) : await this.requests.reject(request.id);
      this.inbox.update(items => items.map(item => item.id === request.id ? updated : item).filter(item => this.isPending(item)));
      this.selectedRequest.set(null);
      window.dispatchEvent(new CustomEvent('ido:project-created'));
      window.dispatchEvent(new CustomEvent('ido:task-created'));
    } catch (error) {
      this.error.set(this.messageFromError(error, this.i18n.text('Could not respond to request.')));
    } finally {
      this.respondingId.set(null);
      this.cancelHold();
    }
  }

  isHolding(id: string): boolean {
    return this.activeHoldRequestId() === id;
  }

  isPending(request: TaskRequestDto): boolean {
    return request.status === 'Pending' || request.status === 0;
  }

  headerSubtitle(): string {
    if (this.selectedRequest()) return this.typeLabel(this.selectedRequest()!.type);
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.pendingRequests().length)} درخواست در انتظار`
      : `${this.pendingRequests().length} pending requests`;
  }

  pendingLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.pendingRequests().length)} در انتظار`
      : `${this.pendingRequests().length} pending`;
  }

  typeName(type: TaskRequestDto['type']): 'ProjectInvite' | 'SectionAssignment' | 'TaskAssignment' {
    if (type === 0 || type === 'ProjectInvite') return 'ProjectInvite';
    if (type === 1 || type === 'SectionAssignment') return 'SectionAssignment';
    return 'TaskAssignment';
  }

  typeLabel(type: TaskRequestDto['type']): string {
    const name = this.typeName(type);
    if (name === 'ProjectInvite') return this.i18n.text('Project Invitation');
    if (name === 'SectionAssignment') return this.i18n.text('Section Assignment');
    return this.i18n.text('Task Assignment');
  }

  statusLabel(status: TaskRequestDto['status']): string {
    if (status === 1 || status === 'Accepted') return this.i18n.text('Accepted');
    if (status === 2 || status === 'Rejected') return this.i18n.text('Rejected');
    if (status === 3 || status === 'Cancelled') return this.i18n.text('Cancelled');
    return this.i18n.text('Pending');
  }

  iconFor(request: TaskRequestDto): string {
    const name = this.typeName(request.type);
    if (name === 'ProjectInvite') return 'group_add';
    if (name === 'SectionAssignment') return 'view_column';
    return 'assignment_turned_in';
  }

  relativeTime(value: string): string {
    return this.i18n.relativeTime(value);
  }

  dateLabel(value: string): string {
    return this.i18n.dateTime(value);
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const requests = await this.requests.getInbox();
      this.inbox.set(requests);
      const selected = this.selectedRequest();
      if (selected && !requests.some(request => request.id === selected.id && this.isPending(request))) this.selectedRequest.set(null);
    } catch (error) {
      this.error.set(this.messageFromError(error, this.i18n.text('Could not load inbox.')));
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
