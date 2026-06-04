import { Location } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../../core/auth.service';
import { CalendarService } from '../../core/calendar.service';
import { I18nService } from '../../core/i18n.service';
import { TaskDto, TaskStatus } from '../../core/today.service';
import { TaskCommentDto, TaskDetailsDto, TasksService } from '../../core/tasks.service';

type VisibleStatus = 'Todo' | 'InProgress' | 'Review' | 'Done';
type HoldAction = 'next' | 'previous';

@Component({
  selector: 'app-task-details',
  template: `
    <header class="w-full top-0 sticky z-40 bg-theme-bg/90 backdrop-blur-md flex items-center justify-between px-margin-mobile py-md">
      <button (click)="location.back()" class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors active:scale-95 border-none outline-none">
        <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">arrow_back</span>
      </button>
      <div class="flex flex-col items-center min-w-0 px-sm">
        <h1 class="font-headline-md text-headline-md text-on-surface m-0 leading-tight">{{ i18n.text('Task Details') }}</h1>
        <span class="font-label-md text-label-md text-on-surface-variant truncate max-w-[220px]">{{ projectPathLabel() }}</span>
      </div>
      <button class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 transition-colors active:scale-95 border-none bg-transparent">
        <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">more_vert</span>
      </button>
    </header>

    @if (isLoading()) {
      <div class="px-margin-mobile py-xl flex flex-col gap-md">
        <div class="h-40 rounded-[24px] bg-theme-surface border border-theme-border animate-pulse"></div>
        <div class="h-16 rounded-full bg-theme-surface border border-theme-border animate-pulse"></div>
        <div class="h-28 rounded-[24px] bg-theme-surface border border-theme-border animate-pulse"></div>
      </div>
    } @else if (loadError()) {
      <div class="px-margin-mobile py-xl">
        <section class="bg-theme-surface border border-theme-border rounded-[24px] p-lg text-center">
          <span class="material-symbols-outlined text-error text-[32px]">error</span>
          <h2 class="font-headline-md text-on-surface mt-sm mb-xs">{{ i18n.text('Task unavailable') }}</h2>
          <p class="font-body-md text-on-surface-variant m-0">{{ loadError() }}</p>
        </section>
      </div>
    } @else if (details(); as detail) {
      <div class="flex-1 px-margin-mobile flex flex-col gap-lg mt-sm pb-36">
        <section class="bg-theme-surface border border-theme-border rounded-[24px] p-lg flex flex-col gap-md shadow-[0px_10px_30px_rgba(0,0,0,0.32)]">
          <div class="flex items-start justify-between gap-md">
            <div
              class="status-badge"
              [class.status-todo]="activeStatus() === 'Todo'"
              [class.status-progress]="activeStatus() === 'InProgress' || activeStatus() === 'Review'"
              [class.status-done]="activeStatus() === 'Done'"
              [class.status-pulse]="statusPulse()">
              <span class="material-symbols-outlined text-[15px]" style="font-variation-settings: 'FILL' 1;">{{ statusIcon() }}</span>
              {{ statusLabel(task().status) }}
            </div>
            <div class="flex items-center gap-xs text-on-surface-variant font-label-md bg-surface-container px-sm py-base rounded-full border border-outline-variant/30 min-w-0">
              <span class="material-symbols-outlined text-[14px] shrink-0">{{ isProjectTask() ? 'folder' : 'checklist' }}</span>
              <span class="truncate">{{ projectPathLabel() }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-xs">
            <h2 class="font-headline-lg-mobile text-on-surface m-0">{{ task().title }}</h2>
            <p class="font-body-md text-on-surface-variant leading-relaxed m-0">
              {{ task().description || i18n.text('No description provided.') }}
            </p>
          </div>

          <div class="flex flex-wrap gap-sm mt-xs">
            <div class="info-chip">
              <span class="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
              {{ dueLabel() }}
            </div>
            <div class="info-chip">
              <span class="material-symbols-outlined text-[16px] text-theme-orange">notifications</span>
              {{ reminderLabel() }}
            </div>
            <div class="info-chip">
              <span class="material-symbols-outlined text-[16px] text-theme-purple">person</span>
              {{ ownershipLabel() }}
            </div>
          </div>
        </section>

        <section class="flex flex-col gap-sm">
          <h3 class="section-label">{{ i18n.text('Status') }}</h3>
          <div class="relative flex bg-surface-container-lowest p-base rounded-full border border-theme-border overflow-hidden">
            <div
              class="status-pill"
              [class.status-pill-todo]="activeStatus() === 'Todo'"
              [class.status-pill-progress]="activeStatus() === 'InProgress' || activeStatus() === 'Review'"
              [class.status-pill-done]="activeStatus() === 'Done'"
              [style.width.%]="100 / statusSteps().length"
              [style.transform]="statusTransform()">
            </div>
            @for (step of statusSteps(); track step) {
              <button class="relative z-10 flex-1 py-sm rounded-full font-label-md text-center transition-colors border-none bg-transparent"
                [class.text-theme-bg]="activeStatus() === step"
                [class.font-semibold]="activeStatus() === step"
                [class.text-on-surface-variant]="activeStatus() !== step">
                {{ statusLabel(step) }}
              </button>
            }
          </div>
        </section>

        <section class="bg-theme-surface border border-theme-border rounded-[24px] p-md flex flex-col gap-sm">
          <h3 class="section-label pl-0">{{ i18n.text('Information') }}</h3>
          <div class="detail-row">
            <div class="detail-title">
              <span class="material-symbols-outlined">event</span>
              <span>{{ i18n.text('Deadline') }}</span>
            </div>
            <span class="detail-value">{{ dueLabel() }}</span>
          </div>
          <div class="divider"></div>
          <div class="detail-row">
            <div class="detail-title">
              <span class="material-symbols-outlined">schedule</span>
              <span>{{ i18n.text('Created') }}</span>
            </div>
            <span class="detail-value">{{ dateTimeLabel(task().createdAtUtc) }}</span>
          </div>
          @if (task().completedAtUtc) {
            <div class="divider"></div>
            <div class="detail-row">
              <div class="detail-title">
                <span class="material-symbols-outlined">task_alt</span>
                <span>{{ i18n.text('Completed') }}</span>
              </div>
              <span class="detail-value">{{ dateTimeLabel(task().completedAtUtc) }}</span>
            </div>
          }
          @if (detail.projectTitle) {
            <div class="divider"></div>
            <div class="detail-row">
              <div class="detail-title">
                <span class="material-symbols-outlined">folder</span>
                <span>{{ i18n.text('Project') }}</span>
              </div>
              <span class="detail-value">{{ detail.projectTitle }}</span>
            </div>
          }
          @if (detail.sectionTitle) {
            <div class="divider"></div>
            <div class="detail-row">
              <div class="detail-title">
                <span class="material-symbols-outlined">view_column</span>
                <span>{{ i18n.text('Section') }}</span>
              </div>
              <span class="detail-value">{{ detail.sectionTitle }}</span>
            </div>
          }
        </section>

        @if (commentsEnabled()) {
          <section class="flex flex-col gap-md pb-lg">
            <h3 class="section-label">{{ commentsTitle() }}</h3>
            <div class="flex flex-col gap-lg">
              @for (comment of comments(); track comment.id) {
                <div
                  class="comment-row"
                  [class.comment-creator]="isCreatorComment(comment)"
                  [class.comment-other]="!isCreatorComment(comment)"
                  [class.comment-enter]="recentCommentId() === comment.id">
                  <div class="avatar" [class.avatar-creator]="isCreatorComment(comment)">
                    @if (comment.userAvatarUrl) {
                      <img [src]="comment.userAvatarUrl" [alt]="comment.userDisplayName" class="w-full h-full object-cover"/>
                    } @else {
                      <span>{{ initials(comment.userDisplayName) }}</span>
                    }
                  </div>
                  <div class="comment-content" [class.items-end]="isCreatorComment(comment)">
                    <div class="comment-meta" [class.flex-row-reverse]="isCreatorComment(comment)">
                      <span class="font-label-md text-on-surface font-semibold">{{ isCreatorComment(comment) ? i18n.text('Creator') : comment.userDisplayName }}</span>
                      <span class="font-label-md text-on-surface-variant text-[10px]">{{ relativeTime(comment.createdAtUtc) }}</span>
                    </div>
                    <div class="comment-bubble" [class.comment-bubble-creator]="isCreatorComment(comment)">
                      {{ comment.body }}
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="bg-theme-surface border border-theme-border rounded-2xl p-lg text-center text-on-surface-variant">
                  {{ i18n.text('No comments yet.') }}
                </div>
              }
            </div>

            <form (submit)="submitComment($event)" class="flex gap-sm items-center mt-sm">
              <div class="avatar shrink-0">
                @if (currentUser()?.profile?.avatarUrl) {
                  <img [src]="currentUser()?.profile?.avatarUrl" alt="Me" class="w-full h-full object-cover"/>
                } @else {
                  <span>{{ initials(currentUser()?.profile?.fullName || currentUser()?.userName || 'Me') }}</span>
                }
              </div>
              <div class="flex-1 relative">
                <input
                  type="text"
                  [placeholder]="i18n.text('Add a comment...')"
                  [value]="commentDraft()"
                  (input)="commentDraft.set($any($event.target).value)"
                  class="w-full bg-surface-container-lowest border border-theme-border rounded-full py-sm ps-md pe-[48px] font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-theme-blue/50 focus:ring-1 focus:ring-theme-blue/50 transition-all"/>
                <button
                  type="submit"
                  [disabled]="isPostingComment() || !commentDraft().trim()"
                  class="absolute end-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-theme-blue hover:bg-theme-blue/10 transition-colors border-none bg-transparent outline-none disabled:opacity-40">
                  <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">send</span>
                </button>
              </div>
            </form>
          </section>
        }
      </div>

      <div class="fixed bottom-0 left-0 w-full z-50 p-margin-mobile bg-theme-bg/70 backdrop-blur-md border-t border-theme-border/50 rounded-t-[32px] flex justify-center items-center">
        <div class="hold-actions w-full max-w-[448px] mx-auto">
          <button
            (touchstart)="startHold($event, 'next')" (touchend)="cancelHold()" (touchcancel)="cancelHold()"
            (mousedown)="startHold($event, 'next')" (mouseup)="cancelHold()" (mouseleave)="cancelHold()"
            [disabled]="!nextStatus() || isSavingStatus()"
            class="hold-button hold-next"
            [class.hold-complete]="!nextStatus()"
            [class.hold-active]="activeHoldAction() === 'next'"
            [class.hold-suppressed]="activeHoldAction() === 'previous'">
            @if (nextStatus()) {
              <div
                class="hold-fill"
                [style.background]="holdFillColor('next')"
                [class.hold-fill-active]="activeHoldAction() === 'next'">
              </div>
            }
            <span class="material-symbols-outlined z-10" [style.font-variation-settings]="!nextStatus() ? '&quot;FILL&quot; 1' : '&quot;wght&quot; 300'">
              {{ nextStatus() ? 'fingerprint' : 'check_circle' }}
            </span>
            <span class="font-headline-md z-10 text-[16px]">{{ actionLabel() }}</span>
          </button>
          <button
            (touchstart)="startHold($event, 'previous')" (touchend)="cancelHold()" (touchcancel)="cancelHold()"
            (mousedown)="startHold($event, 'previous')" (mouseup)="cancelHold()" (mouseleave)="cancelHold()"
            [disabled]="!previousStatus() || isSavingStatus()"
            class="hold-button hold-previous"
            [class.hold-active]="activeHoldAction() === 'previous'"
            [class.hold-suppressed]="activeHoldAction() === 'next'"
            [attr.aria-label]="i18n.text('Hold to go back one status')">
            @if (previousStatus()) {
              <div
                class="hold-fill hold-fill-reverse"
                [style.background]="holdFillColor('previous')"
                [class.hold-fill-active]="activeHoldAction() === 'previous'">
              </div>
            }
            <span class="material-symbols-outlined z-10">undo</span>
            <span class="hold-previous-label font-headline-md z-10 text-[16px]">{{ previousActionLabel() }}</span>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .section-label { margin: 0; padding-left: 0.25rem; font: 600 11px/14px var(--font-app); color: var(--color-on-surface-variant); text-transform: uppercase; letter-spacing: 0.05em; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font: 600 11px/14px var(--font-app); transition: background-color 260ms ease, color 260ms ease, border-color 260ms ease, transform 260ms ease; }
    .status-todo { background: rgba(142, 155, 174, 0.12); color: var(--color-on-surface-variant); border: 1px solid rgba(142, 155, 174, 0.18); }
    .status-progress { background: rgba(62, 174, 255, 0.12); color: var(--color-theme-blue); border: 1px solid rgba(62, 174, 255, 0.2); }
    .status-done { background: rgba(0, 244, 185, 0.12); color: var(--color-theme-green); border: 1px solid rgba(0, 244, 185, 0.2); }
    .status-pulse { animation: statusPulse 420ms ease; }
    .info-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: var(--color-surface-container-lowest); border: 1px solid var(--color-theme-border); color: var(--color-on-surface); font: 500 11px/14px var(--font-app); }
    .status-pill { position: absolute; top: 4px; bottom: 4px; left: 4px; border-radius: 999px; box-shadow: 0 8px 18px rgba(0,0,0,0.22); transition: transform 420ms cubic-bezier(.2,.8,.2,1), background-color 320ms ease; }
    .status-pill-todo { background: var(--color-on-surface-variant); }
    .status-pill-progress { background: var(--color-theme-blue); }
    .status-pill-done { background: var(--color-theme-green); }
    .detail-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 6px 0; }
    .detail-title { display: flex; align-items: center; gap: 10px; min-width: 0; color: var(--color-on-surface-variant); font: 500 13px/18px var(--font-app); }
    .detail-title .material-symbols-outlined { font-size: 20px; }
    .detail-value { color: var(--color-on-surface); font: 500 13px/18px var(--font-app); text-align: right; min-width: 0; overflow-wrap: anywhere; }
    .divider { height: 1px; width: 100%; background: rgba(42, 51, 65, 0.65); }
    .comment-row { display: flex; gap: 10px; align-items: flex-start; }
    .comment-creator { flex-direction: row-reverse; }
    .comment-content { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
    .comment-meta { display: flex; align-items: baseline; gap: 6px; }
    .comment-bubble { width: fit-content; max-width: min(78vw, 420px); padding: 10px 12px; border-radius: 4px 16px 16px 16px; border: 1px solid var(--color-theme-border); background: var(--color-theme-surface); color: var(--color-on-surface); font: 400 13px/18px var(--font-app); overflow-wrap: anywhere; }
    .comment-bubble-creator { border-radius: 16px 4px 16px 16px; border-color: rgba(62, 174, 255, 0.24); background: rgba(62, 174, 255, 0.16); color: var(--color-on-primary-container); }
    .comment-enter { animation: commentEnter 360ms ease both; }
    .avatar { width: 40px; height: 40px; border-radius: 999px; overflow: hidden; border: 1px solid var(--color-theme-border); background: var(--color-theme-elevated); display: flex; align-items: center; justify-content: center; color: var(--color-primary); font: 700 12px/1 var(--font-app); }
    .avatar-creator { border-color: rgba(62, 174, 255, 0.32); }
    .hold-actions { display: flex; gap: 10px; align-items: center; justify-content: center; }
    .hold-button { height: 64px; border-radius: 999px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; gap: 10px; user-select: none; outline: none; border: 1px solid var(--color-theme-border); background: var(--color-theme-elevated); color: var(--color-on-surface); transition: flex-basis 220ms ease, flex-grow 220ms ease, transform 180ms ease, border-color 240ms ease, background-color 240ms ease, opacity 180ms ease, padding 180ms ease; }
    .hold-next { flex: 4 1 80%; min-width: 0; }
    .hold-previous { flex: 1 1 20%; min-width: 64px; padding-inline: 0; color: var(--color-theme-orange); }
    .hold-previous-label { display: none; white-space: nowrap; }
    .hold-previous.hold-active .hold-previous-label { display: inline; }
    .hold-active { flex: 1 0 100%; padding-inline: 18px; }
    .hold-suppressed { flex: 0 1 0; min-width: 0; opacity: 0; padding: 0; border-width: 0; pointer-events: none; }
    .hold-button:active, .hold-active { transform: scale(0.985); }
    .hold-button:disabled { cursor: default; }
    .hold-previous:disabled { color: var(--color-on-surface-variant); opacity: 0.45; }
    .hold-complete { background: rgba(0, 244, 185, 0.16); border-color: rgba(0, 244, 185, 0.32); color: var(--color-theme-green); }
    .hold-fill { position: absolute; inset: 0 auto 0 0; width: 0%; opacity: 0.28; transition: width 220ms ease-out; }
    .hold-fill-reverse { inset: 0 0 0 auto; }
    .hold-fill-active { width: 100%; transition: width 2000ms linear; }
    @keyframes statusPulse { 0% { transform: scale(1); } 45% { transform: scale(1.06); } 100% { transform: scale(1); } }
    @keyframes commentEnter { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `]
})
export class TaskDetailsComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly tasksService = inject(TasksService);
  private readonly auth = inject(AuthService);
  private readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);
  readonly location = inject(Location);

  private readonly taskId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly holdDuration = 2000;
  private holdTimer?: ReturnType<typeof setTimeout>;
  private hubConnection: signalR.HubConnection | null = null;
  private recentCommentTimer?: ReturnType<typeof setTimeout>;
  private statusPulseTimer?: ReturnType<typeof setTimeout>;

  readonly currentUser = this.auth.currentUser;
  readonly details = signal<TaskDetailsDto | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isHolding = signal(false);
  readonly activeHoldAction = signal<HoldAction | null>(null);
  readonly isSavingStatus = signal(false);
  readonly isPostingComment = signal(false);
  readonly commentDraft = signal('');
  readonly recentCommentId = signal<string | null>(null);
  readonly statusPulse = signal(false);

  readonly task = computed(() => this.details()!.task);
  readonly comments = computed(() => this.details()?.comments ?? []);
  readonly commentsEnabled = computed(() => this.isProjectTask());
  readonly statusSteps = computed<VisibleStatus[]>(() => this.isProjectTask() ? ['Todo', 'InProgress', 'Review', 'Done'] : ['Todo', 'Done']);
  readonly activeStatus = computed<VisibleStatus>(() => this.toVisibleStatus(this.details()?.task.status ?? 'Todo'));
  readonly nextStatus = computed<TaskStatus | null>(() => {
    const task = this.details()?.task;
    const status = this.taskStatusName(task?.status ?? 'Todo');
    if (!task || status === 'Done' || status === 'Archived') return null;
    if (!this.isProjectTask()) return 'Done';
    if (status === 'Todo') return 'InProgress';
    if (status === 'InProgress') return 'Review';
    return 'Done';
  });
  readonly previousStatus = computed<TaskStatus | null>(() => {
    const currentIndex = this.statusSteps().indexOf(this.activeStatus());
    if (currentIndex <= 0) return null;
    return this.statusSteps()[currentIndex - 1];
  });

  constructor() {
    void this.loadTask();
  }

  ngOnDestroy(): void {
    this.cancelHold();
    if (this.recentCommentTimer) clearTimeout(this.recentCommentTimer);
    if (this.statusPulseTimer) clearTimeout(this.statusPulseTimer);
    if (this.hubConnection && this.taskId) {
      void this.hubConnection.invoke('LeaveTask', this.taskId).catch(() => undefined);
      void this.hubConnection.stop().catch(() => undefined);
    }
  }

  startHold(event: Event, action: HoldAction): void {
    event.preventDefault();
    const targetStatus = this.targetStatus(action);
    if (!targetStatus || this.isSavingStatus() || this.isHolding()) return;
    window.navigator.vibrate?.(50);
    this.isHolding.set(true);
    this.activeHoldAction.set(action);
    this.holdTimer = setTimeout(() => void this.changeHeldStatus(action), this.holdDuration);
  }

  cancelHold(): void {
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = undefined;
    this.isHolding.set(false);
    this.activeHoldAction.set(null);
  }

  async submitComment(event: Event): Promise<void> {
    event.preventDefault();
    const body = this.commentDraft().trim();
    if (!body || !this.commentsEnabled() || this.isPostingComment()) return;
    this.isPostingComment.set(true);
    try {
      const comment = await this.tasksService.addComment(this.taskId, body);
      this.commentDraft.set('');
      this.mergeComment(comment);
    } finally {
      this.isPostingComment.set(false);
    }
  }

  isCreatorComment(comment: TaskCommentDto): boolean {
    return comment.userId === this.task().creatorUserId;
  }

  statusLabel(status: TaskStatus | VisibleStatus | number): string {
    const name = this.taskStatusName(status);
    return this.i18n.text(name === 'InProgress' ? 'In Progress' : name);
  }

  statusIcon(): string {
    if (this.activeStatus() === 'Done') return 'check_circle';
    if (this.activeStatus() === 'Review') return 'rate_review';
    if (this.activeStatus() === 'InProgress') return 'play_circle';
    return 'radio_button_unchecked';
  }

  statusTransform(): string {
    const index = this.statusSteps().indexOf(this.activeStatus());
    return `translateX(${Math.max(index, 0) * 100}%)`;
  }

  actionLabel(): string {
    const next = this.nextStatus();
    if (!next) return this.taskStatusName(this.task().status) === 'Archived' ? this.i18n.text('Task Archived') : this.i18n.text('Task Completed');
    if (next === 'InProgress') return this.i18n.text('Hold 2s to start');
    if (next === 'Review') return this.i18n.text('Hold 2s for review');
    return this.i18n.text('Hold 2s to mark done');
  }

  previousActionLabel(): string {
    const previous = this.previousStatus();
    if (!previous) return this.i18n.text('Back');
    return this.i18n.language() === 'fa' ? `برگشت به ${this.statusLabel(previous)}` : `Back to ${this.statusLabel(previous)}`;
  }

  holdFillColor(action: HoldAction): string {
    if (action === 'previous') return 'var(--color-theme-orange)';
    return this.nextStatus() === 'InProgress' ? 'var(--color-theme-blue)' : 'var(--color-theme-green)';
  }

  projectPathLabel(): string {
    const detail = this.details();
    if (!detail) return this.i18n.text('Loading');
    if (detail.projectTitle && detail.sectionTitle) return `${detail.projectTitle} / ${detail.sectionTitle}`;
    return detail.projectTitle || (this.isProjectTask() ? this.i18n.text('Project task') : this.i18n.text('Personal todo'));
  }

  ownershipLabel(): string {
    const userId = this.currentUser()?.userId;
    if (this.task().creatorUserId === userId) return this.i18n.text('Created by you');
    if (this.task().assigneeUserId === userId) return this.i18n.text('Assigned to you');
    return this.isProjectTask() ? this.i18n.text('Project member') : this.i18n.text('Personal');
  }

  dueLabel(): string {
    const task = this.task();
    if (!task.dueDate && !task.dueTime) return this.i18n.text('No deadline');
    const date = task.dueDate ? this.dateOnlyLabel(task.dueDate) : this.i18n.text('No date');
    return task.dueTime ? `${date}, ${task.dueTime.slice(0, 5)}` : date;
  }

  reminderLabel(): string {
    return this.task().reminderAtUtc ? this.dateTimeLabel(this.task().reminderAtUtc) : this.i18n.text('No reminder');
  }

  dateTimeLabel(value: string | null | undefined): string {
    if (!value) return this.i18n.text('Unknown');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return this.i18n.text('Unknown');
    return this.calendar.formatDateTime(date);
  }

  relativeTime(value: string): string {
    return this.i18n.relativeTime(value);
  }

  commentsTitle(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.comments().length)} نظر`
      : `${this.comments().length} Comment${this.comments().length === 1 ? '' : 's'}`;
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'U';
  }

  private async loadTask(): Promise<void> {
    if (!this.taskId) {
      this.loadError.set(this.i18n.text('Task id is missing.'));
      this.isLoading.set(false);
      return;
    }
    try {
      this.details.set(await this.tasksService.getTaskDetails(this.taskId));
      await this.setupRealtime();
    } catch {
      this.loadError.set(this.i18n.text('The task could not be loaded.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async setupRealtime(): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/tasks', { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('taskStatusChanged', (task: TaskDto) => this.mergeTask(task));
    this.hubConnection.on('taskCommentAdded', (comment: TaskCommentDto) => this.mergeComment(comment));
    this.hubConnection.onreconnected(() => void this.joinTaskGroup());

    try {
      await this.hubConnection.start();
      await this.joinTaskGroup();
    } catch {
      this.hubConnection = null;
    }
  }

  private joinTaskGroup(): Promise<void> {
    return this.hubConnection?.invoke('JoinTask', this.taskId).catch(() => undefined) ?? Promise.resolve();
  }

  private async changeHeldStatus(action: HoldAction): Promise<void> {
    const targetStatus = this.targetStatus(action);
    if (!targetStatus) return;
    this.isSavingStatus.set(true);
    try {
      const task = await this.tasksService.changeStatus(this.taskId, targetStatus);
      this.mergeTask(task);
      window.navigator.vibrate?.([50, 50, 50]);
    } finally {
      this.isSavingStatus.set(false);
      this.cancelHold();
    }
  }

  private mergeTask(task: TaskDto): void {
    const detail = this.details();
    if (!detail || detail.task.id !== task.id) return;
    const statusChanged = detail.task.status !== task.status;
    this.details.set({ ...detail, task });
    if (statusChanged) this.animateStatus();
  }

  private mergeComment(comment: TaskCommentDto): void {
    const detail = this.details();
    if (!detail || detail.task.id !== comment.taskId) return;
    const comments = detail.comments.some(item => item.id === comment.id)
      ? detail.comments.map(item => item.id === comment.id ? comment : item)
      : [...detail.comments, comment];
    comments.sort((left, right) => new Date(left.createdAtUtc).getTime() - new Date(right.createdAtUtc).getTime());
    this.details.set({ ...detail, comments });
    this.recentCommentId.set(comment.id);
    if (this.recentCommentTimer) clearTimeout(this.recentCommentTimer);
    this.recentCommentTimer = setTimeout(() => this.recentCommentId.set(null), 600);
  }

  private animateStatus(): void {
    this.statusPulse.set(false);
    if (this.statusPulseTimer) clearTimeout(this.statusPulseTimer);
    requestAnimationFrame(() => this.statusPulse.set(true));
    this.statusPulseTimer = setTimeout(() => this.statusPulse.set(false), 500);
  }

  private targetStatus(action: HoldAction): TaskStatus | null {
    return action === 'next' ? this.nextStatus() : this.previousStatus();
  }

  isProjectTask(): boolean {
    const type = this.details()?.task.type;
    return type === 'Project' || type === 1;
  }

  private toVisibleStatus(status: TaskStatus): VisibleStatus {
    const name = this.taskStatusName(status);
    if (name === 'Done') return 'Done';
    if (name === 'Review' && this.isProjectTask()) return 'Review';
    if (name === 'InProgress' && this.isProjectTask()) return 'InProgress';
    return 'Todo';
  }

  private taskStatusName(status: TaskStatus | VisibleStatus | number): VisibleStatus | 'Overdue' | 'Archived' {
    if (status === 1 || status === 'InProgress') return 'InProgress';
    if (status === 2 || status === 'Review') return 'Review';
    if (status === 3 || status === 'Done') return 'Done';
    if (status === 4 || status === 'Overdue') return 'Overdue';
    if (status === 5 || status === 'Archived') return 'Archived';
    return 'Todo';
  }

  private dateOnlyLabel(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return this.calendar.formatLongDate(date);
  }
}
