import { Location } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import {
  ProjectDetailsDto,
  ProjectMemberDto,
  ProjectMemberStatus,
  ProjectSectionDto,
  ProjectsService,
  UserSearchResultDto
} from '../../core/projects.service';
import { CreateTaskRequest, TasksService } from '../../core/tasks.service';
import { TaskDto, TaskStatus } from '../../core/today.service';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal';
import { PROJECT_COLOR_OPTIONS, PROJECT_ICON_OPTIONS } from '../../shared/project-icon-options';

type SheetMode = 'member' | 'section' | 'task' | 'assign-section' | 'assign-task';

interface AssignmentUserOption {
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  isActiveProjectMember: boolean;
  hasPendingProjectInvite: boolean;
}

@Component({
  selector: 'app-project-details',
  imports: [RouterLink, LoadingModalComponent],
  template: `
    <header class="bg-theme-bg text-on-surface sticky top-0 z-40 bg-theme-bg/90 backdrop-blur-md">
      <div class="flex justify-between items-center w-full px-gutter-mobile py-sm">
        <button (click)="location.back()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 shrink-0 border-none bg-transparent text-on-surface">
          <span class="material-symbols-outlined text-on-surface-variant text-[24px]">arrow_back</span>
        </button>
        <div class="flex flex-col items-center min-w-0 px-sm">
          <h1 class="font-headline-md text-headline-md text-on-surface m-0 leading-tight truncate max-w-[240px]">{{ details()?.project?.title || 'Project' }}</h1>
          <span class="font-label-md text-label-md text-on-surface-variant mt-0.5">{{ roleLabel() }}</span>
        </div>
        <button (click)="reload()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 shrink-0 border-none bg-transparent text-on-surface">
          <span class="material-symbols-outlined text-on-surface-variant text-[22px]">refresh</span>
        </button>
      </div>
    </header>

    @if (isLoading()) {
      <div class="px-gutter-mobile py-lg flex flex-col gap-md">
        <div class="h-40 rounded-[24px] bg-theme-surface border border-theme-border animate-pulse"></div>
        <div class="h-20 rounded-[20px] bg-theme-surface border border-theme-border animate-pulse"></div>
        <div class="h-60 rounded-[24px] bg-theme-surface border border-theme-border animate-pulse"></div>
      </div>
    } @else if (error()) {
      <div class="px-gutter-mobile py-lg">
        <section class="bg-theme-surface border border-theme-border rounded-[24px] p-lg text-center">
          <span class="material-symbols-outlined text-error text-[32px]">error</span>
          <h2 class="font-headline-md text-on-surface mt-sm mb-xs">Project unavailable</h2>
          <p class="font-body-md text-on-surface-variant m-0">{{ error() }}</p>
        </section>
      </div>
    } @else if (details(); as detail) {
      <div class="px-gutter-mobile py-md flex flex-col gap-lg pb-10">
        <section
          class="project-hero rounded-[24px] p-lg flex flex-col gap-md relative overflow-hidden border"
          [style.--project-color]="projectColor()">
          <div class="flex justify-between items-start gap-md z-10">
            <div class="flex flex-col gap-2 min-w-0">
              <div class="project-status-pill inline-flex px-3 py-1 rounded-full font-label-md w-max">
                {{ statusLabel(detail.project.status) }}
              </div>
              <h2 class="font-headline-lg-mobile text-white m-0 mt-1 truncate">{{ detail.project.title }}</h2>
              <p class="project-description font-body-md opacity-90 m-0 mt-1 line-clamp-2">{{ detail.project.description || 'No project description yet.' }}</p>
            </div>
            <div class="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path class="project-ring-bg stroke-current" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                <path class="project-ring stroke-current" stroke-width="3" [attr.stroke-dasharray]="projectProgress() + ', 100'" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
              </svg>
              <span class="absolute font-headline-md text-white font-bold">{{ projectProgress() }}%</span>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-sm z-10">
            <div class="stat-box"><span>Tasks</span><strong>{{ detail.progress.totalCount }}</strong></div>
            <div class="stat-box"><span>Sections</span><strong>{{ detail.sections.length }}</strong></div>
            <div class="stat-box"><span>Members</span><strong>{{ activeMembers().length }}</strong></div>
          </div>
        </section>

        <section class="flex flex-col gap-3">
          <div class="flex justify-between items-center">
            <h3 class="section-label">Team</h3>
            @if (detail.permissions.canManageMembers) {
              <button (click)="openSheet('member')" class="icon-pill text-theme-project-accent">
                <span class="material-symbols-outlined text-[18px]">person_add</span>
                Add
              </button>
            }
          </div>
          <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-gutter-mobile px-gutter-mobile">
            @for (member of activeMembers(); track member.id) {
              <div class="member-pill">
                <div class="avatar">
                  @if (member.userAvatarUrl) {
                    <img [src]="member.userAvatarUrl" [alt]="memberName(member)" class="w-full h-full object-cover"/>
                  } @else {
                    <span>{{ initials(memberName(member)) }}</span>
                  }
                </div>
                <span class="font-label-md text-on-surface text-center truncate max-w-[72px]">{{ memberName(member) }}</span>
                <span class="font-label-md text-on-surface-variant text-[10px]">{{ roleName(member.role) }}</span>
              </div>
            }
          </div>
        </section>

        <section class="grid grid-cols-1 gap-sm">
          @if (detail.permissions.canCreateSection) {
            <button (click)="openSheet('section')" class="action-button">
              <span class="material-symbols-outlined">view_column</span>
              Section
            </button>
          }
        </section>

        <section class="flex flex-col gap-md">
          <div class="flex justify-between items-center">
            <h3 class="section-label">Sections</h3>
            <span class="font-label-md text-on-surface-variant">{{ pendingCount() }} pending</span>
          </div>

          @for (section of detail.sections; track section.id) {
            <article class="section-card" [style.--section-color]="sectionColorValue(section)">
              <div class="flex justify-between items-start gap-sm">
                <div class="flex items-start gap-sm min-w-0">
                  <div class="section-icon">
                    <span class="material-symbols-outlined text-[18px]">{{ section.icon || 'view_column' }}</span>
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-headline-md text-on-surface m-0 truncate">{{ section.title }}</h4>
                    <p class="font-body-md text-on-surface-variant m-0 line-clamp-2">{{ section.description || sectionOwnerLabel(section) }}</p>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-xs shrink-0">
                  <div class="flex items-center justify-end gap-xs">
                    @if (sectionAssignedMembers(section).length > 0) {
                      <button type="button" (click)="openAssignSectionSheet(section.id)" class="avatar-stack" aria-label="Add section owner">
                        @for (member of sectionAssignedMembers(section); track member.userId) {
                          <span class="mini-avatar" [title]="memberName(member)">
                            @if (member.userAvatarUrl) { <img [src]="member.userAvatarUrl" [alt]="memberName(member)" class="w-full h-full object-cover"/> }
                            @else { {{ initials(memberName(member)) }} }
                          </span>
                        }
                      </button>
                    } @else if (detail.permissions.canAssignMembers) {
                      <button type="button" (click)="openAssignSectionSheet(section.id)" class="avatar-add" aria-label="Assign section owner">
                        <span class="material-symbols-outlined text-[17px]">person_add</span>
                      </button>
                    }
                    @if (detail.permissions.canCreateTask) {
                      <button type="button" (click)="openTaskSheet(section.id)" class="avatar-add" aria-label="Add task">
                        <span class="material-symbols-outlined text-[17px]">add</span>
                      </button>
                    }
                  </div>
                  <span class="font-label-md" [style.color]="sectionColorValue(section)">{{ round(section.progressPercentage) }}%</span>
                </div>
              </div>

              <div class="section-progress-track">
                <div class="section-progress-fill" [style.width.%]="section.progressPercentage"></div>
              </div>

              <div class="flex flex-col gap-xs">
                @for (task of sectionTasks(section.id); track task.id) {
                  <a [routerLink]="['/task', task.id]" class="task-row">
                    <span class="material-symbols-outlined text-[18px]" [class.text-theme-green]="taskStatusName(task.status) === 'Done'">{{ taskStatusName(task.status) === 'Done' ? 'check_circle' : 'radio_button_unchecked' }}</span>
                    <span class="flex-1 truncate" [class.line-through]="taskStatusName(task.status) === 'Done'">{{ task.title }}</span>
                    <div class="flex items-center gap-[6px] shrink-0">
                      @if (pendingTaskAssigneeCount(task) > 0) {
                        <span class="badge badge-pending">Pending</span>
                      }
                      @if (taskAssignedMembers(task).length > 0) {
                        <button type="button" (click)="openAssignTaskSheet(task.id, $event)" class="avatar-stack" aria-label="Add task assignee">
                          @for (member of taskAssignedMembers(task); track member.userId) {
                            <span class="mini-avatar" [title]="memberName(member)">
                              @if (member.userAvatarUrl) { <img [src]="member.userAvatarUrl" [alt]="memberName(member)" class="w-full h-full object-cover"/> }
                              @else { {{ initials(memberName(member)) }} }
                            </span>
                          }
                        </button>
                      } @else if (detail.permissions.canAssignMembers && taskStatusName(task.status) !== 'Done') {
                        <button type="button" (click)="openAssignTaskSheet(task.id, $event)" class="avatar-add" aria-label="Assign task">
                          <span class="material-symbols-outlined text-[16px]">person_add</span>
                        </button>
                      }
                    </div>
                  </a>
                } @empty {
                  <div class="empty-row">No tasks in this section.</div>
                }
              </div>
            </article>
          } @empty {
            <div class="empty-row p-lg">Create the first section to start planning tasks.</div>
          }
        </section>
      </div>
    }

    @if (activeSheet(); as sheet) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-end justify-center" (click)="closeSheetOnBackdrop($event)">
        <div class="project-sheet w-[calc(100%-32px)] max-w-[560px] max-h-[88dvh] bg-surface-container rounded-t-[28px] border border-theme-border overflow-hidden flex flex-col"
          [style.--sheet-accent]="sheetAccentColor(sheet)">
          <button class="w-full flex justify-center pt-sm pb-xs border-none bg-transparent" (click)="closeSheet()">
            <span class="w-[56px] h-1.5 bg-outline-variant rounded-full"></span>
          </button>
          <div class="px-lg pb-md flex justify-between items-start gap-md">
            <div>
              <h2 class="text-[24px] leading-[30px] font-semibold text-on-surface m-0">{{ sheetTitle(sheet) }}</h2>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ sheetSubtitle(sheet) }}</p>
            </div>
            <button (click)="closeSheet()" class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant border-none">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="px-lg pb-lg overflow-y-auto hide-scrollbar flex flex-col gap-md">
            @if (sheet === 'member') {
              <input [value]="memberQuery()" (input)="onMemberQuery($event)" placeholder="Search username" class="field" />
              @if (sheetError()) { <div class="error-box">{{ sheetError() }}</div> }
              <div class="flex flex-col gap-sm">
                @for (user of userResults(); track user.userId) {
                  <div class="result-row">
                    <div class="avatar">
                      @if (user.avatarUrl) { <img [src]="user.avatarUrl" [alt]="user.displayName || user.username" class="w-full h-full object-cover"/> }
                      @else { <span>{{ initials(user.displayName || user.username) }}</span> }
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-body-md text-on-surface m-0 truncate">{{ user.displayName || user.username }}</p>
                      <p class="font-label-md text-on-surface-variant m-0">&#64;{{ user.username }}</p>
                    </div>
                    <button (click)="inviteUser(user)" [disabled]="user.isActiveProjectMember || user.hasPendingProjectInvite || isSubmittingSheet()" class="mini-button">
                      {{ user.isActiveProjectMember ? 'Member' : user.hasPendingProjectInvite ? 'Pending' : 'Invite' }}
                    </button>
                  </div>
                } @empty {
                  <div class="empty-row">Search by username to invite a member.</div>
                }
              </div>
            } @else if (sheet === 'section') {
              <input [value]="sectionTitle()" (input)="sectionTitle.set(inputValue($event))" placeholder="Section title" class="field" />
              <input [value]="sectionDescription()" (input)="sectionDescription.set(inputValue($event))" placeholder="Description" class="field" />
              <div class="flex flex-col gap-sm">
                <span class="section-label">Section icon</span>
                <div class="grid grid-cols-6 gap-xs max-h-[156px] overflow-y-auto hide-scrollbar pr-1">
                  @for (icon of projectIcons; track icon) {
                    <button
                      type="button"
                      (click)="sectionIcon.set(icon)"
                      class="icon-choice"
                      [class.icon-choice-active]="sectionIcon() === icon"
                      [style.color]="sectionIcon() === icon ? sectionColor() : null">
                      <span class="material-symbols-outlined text-[22px]">{{ icon }}</span>
                    </button>
                  }
                </div>
              </div>
              <div class="flex flex-col gap-sm">
                <span class="section-label">Section color</span>
                <div class="grid grid-cols-5 gap-xs">
                  @for (color of colors; track color.value) {
                    <button
                      type="button"
                      (click)="sectionColor.set(color.value)"
                      class="h-11 rounded-full border flex items-center justify-center transition-all"
                      [class.border-white]="sectionColor() === color.value"
                      [class.border-outline-variant]="sectionColor() !== color.value"
                      [style.background]="color.value"
                      [attr.aria-label]="color.label">
                      @if (sectionColor() === color.value) {
                        <span class="material-symbols-outlined text-[18px] text-white" style="font-variation-settings: 'FILL' 1;">check</span>
                      }
                    </button>
                  }
                </div>
              </div>
              @if (sheetError()) { <div class="error-box">{{ sheetError() }}</div> }
              <button (click)="submitSection()" [disabled]="isSubmittingSheet()" class="primary-button">Create Section</button>
            } @else if (sheet === 'task') {
              <div class="selected-section-strip">
                <div class="section-icon" [style.color]="selectedSectionColor()">
                  <span class="material-symbols-outlined text-[18px]">{{ selectedSectionIcon() }}</span>
                </div>
                <div class="min-w-0">
                  <p class="font-label-md text-label-md text-on-surface-variant m-0">Section</p>
                  <p class="font-body-md text-body-md text-on-surface m-0 truncate">{{ selectedSectionTitle() }}</p>
                </div>
              </div>

              <input [value]="taskTitle()" (input)="taskTitle.set(inputValue($event))" placeholder="What task belongs here?" class="task-field" />
              <div class="relative">
                <span class="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[25px]">notes</span>
                <input [value]="taskDescription()" (input)="taskDescription.set(inputValue($event))" placeholder="Task brief (optional)" class="task-field pl-[54px]" />
              </div>

              <div class="flex flex-col gap-sm">
                <span class="section-label">Date</span>
                <div class="flex flex-wrap gap-xs">
                  <button type="button" (click)="setTaskDueToday()" class="choice-chip" [class.choice-active]="isTaskDueToday()">Today</button>
                  <button type="button" (click)="setTaskDueTomorrow()" class="choice-chip" [class.choice-active]="isTaskDueTomorrow()">Tomorrow</button>
                  <input [value]="taskDueDate()" (input)="setTaskDueDate(inputValue($event))" type="date" class="date-pill" />
                </div>
              </div>

              <div class="flex flex-col gap-sm">
                <span class="section-label">Reminder</span>
                <div class="flex flex-wrap gap-xs">
                  <button type="button" (click)="taskDueTime.set('')" class="choice-chip" [class.choice-active]="!taskDueTime()">No reminder</button>
                  <button type="button" (click)="taskDueTime.set('10:00')" class="choice-chip" [class.choice-active]="taskDueTime() === '10:00'">10:00 AM</button>
                  <button type="button" (click)="taskDueTime.set('14:00')" class="choice-chip" [class.choice-active]="taskDueTime() === '14:00'">2:00 PM</button>
                  <input [value]="taskDueTime()" (input)="taskDueTime.set(inputValue($event))" type="time" class="time-pill" />
                </div>
              </div>

              <div class="flex flex-col gap-sm">
                <span class="section-label">Owner</span>
                <div class="flex gap-xs overflow-x-auto hide-scrollbar pb-1">
                  <button type="button" (click)="taskAssigneeId.set(null)" class="choice-chip" [class.choice-active]="taskAssigneeId() === null">No owner</button>
                  @for (member of taskAssigneeOptions(); track member.id) {
                    <button type="button" (click)="taskAssigneeId.set(member.userId)" class="choice-chip" [class.choice-active]="taskAssigneeId() === member.userId">{{ memberName(member) }}</button>
                  }
                </div>
              </div>

              <div class="flex flex-col gap-sm">
                <span class="section-label">Priority</span>
                <input [value]="taskPriority()" (input)="taskPriority.set(numberValue($event))" type="number" min="0" max="5" placeholder="0 to 5" class="task-field" />
              </div>
              @if (sheetError()) { <div class="error-box">{{ sheetError() }}</div> }
              <button (click)="submitTask()" [disabled]="isSubmittingSheet()" class="primary-button">Create Task</button>
            } @else {
              @if (sheet === 'assign-section') {
                <div class="selected-section-strip">
                  <div class="section-icon" [style.color]="selectedSectionColor()">
                    <span class="material-symbols-outlined text-[18px]">{{ selectedSectionIcon() }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-label-md text-label-md text-on-surface-variant m-0">Assign section</p>
                    <p class="font-body-md text-body-md text-on-surface m-0 truncate">{{ selectedSectionTitle() }}</p>
                  </div>
                </div>
              }
              <div class="relative">
                <span class="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[22px]">search</span>
                <input [value]="assignmentQuery()" (input)="onAssignmentQuery($event)" placeholder="Search project people or username" class="field pl-[48px]" />
              </div>
              <div class="flex flex-col gap-sm">
                @for (option of assignmentOptions(); track option.userId) {
                  <button (click)="submitAssignment(option)" [disabled]="isSubmittingSheet()" class="result-row text-left">
                    <div class="avatar">
                      @if (option.avatarUrl) { <img [src]="option.avatarUrl" [alt]="option.displayName" class="w-full h-full object-cover"/> }
                      @else { <span>{{ initials(option.displayName) }}</span> }
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-body-md text-on-surface m-0 truncate">{{ option.displayName }}</p>
                      <p class="font-label-md text-on-surface-variant m-0">{{ assignmentOptionSubtitle(option) }}</p>
                    </div>
                    <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                  </button>
                } @empty {
                  <div class="empty-row">{{ assignmentEmptyText() }}</div>
                }
              </div>
              @if (sheetError()) { <div class="error-box">{{ sheetError() }}</div> }
            }
          </div>
        </div>
      </div>
    }

    <app-loading-modal [open]="isSubmittingSheet()" [title]="sheetLoadingTitle()" [message]="sheetLoadingMessage()" />

    @if (assignmentSuccessOpen()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center px-margin-mobile bg-black/45 backdrop-blur-md">
        <div class="w-full max-w-[300px] rounded-[30px] border border-white/10 bg-surface-container/70 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl px-xl py-xl flex flex-col items-center gap-lg">
          <div class="h-20 w-20 rounded-full border border-theme-green/30 bg-theme-green/15 text-theme-green flex items-center justify-center">
            <span class="material-symbols-outlined text-[42px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          </div>
          <div class="text-center flex flex-col gap-xs">
            <h2 class="m-0 text-headline-md font-headline-md text-on-surface">{{ assignmentSuccessTitle() }}</h2>
            <p class="m-0 text-body-md font-body-md text-on-surface-variant">{{ assignmentSuccessMessage() }}</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .section-label { margin: 0; font: 700 11px/14px Inter, sans-serif; color: var(--color-on-surface-variant); text-transform: uppercase; letter-spacing: 0; }
    .project-hero { --project-color: var(--color-theme-project-accent); background: color-mix(in srgb, var(--project-color) 20%, var(--color-theme-bg)); border-color: color-mix(in srgb, var(--project-color) 36%, transparent); }
    .project-hero::after { content: ""; position: absolute; right: -28px; bottom: -32px; width: 132px; height: 132px; border-radius: 999px; background: color-mix(in srgb, var(--project-color) 18%, transparent); filter: blur(28px); pointer-events: none; }
    .project-status-pill { background: color-mix(in srgb, var(--project-color) 22%, transparent); color: var(--project-color); }
    .project-description { color: var(--project-color); }
    .project-ring-bg { color: color-mix(in srgb, var(--project-color) 14%, transparent); }
    .project-ring { color: var(--project-color); }
    .stat-box { display: flex; flex-direction: column; gap: 2px; padding: 10px; border-radius: 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); }
    .stat-box span { color: var(--project-color); opacity: .78; font: 600 11px/14px Inter, sans-serif; }
    .stat-box strong { color: #fff; font: 700 18px/22px Inter, sans-serif; }
    .member-pill { min-width: 76px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .avatar { width: 44px; height: 44px; border-radius: 999px; overflow: hidden; border: 1px solid var(--color-theme-border); background: var(--color-theme-elevated); display: flex; align-items: center; justify-content: center; color: var(--color-primary); font: 700 12px/1 Inter, sans-serif; }
    .action-button { height: 50px; border-radius: 18px; border: 1px solid var(--color-theme-border); background: var(--color-theme-surface); color: var(--color-on-surface); display: flex; align-items: center; justify-content: center; gap: 8px; font: 700 13px/18px Inter, sans-serif; }
    .section-card { --section-color: var(--color-theme-project-accent); border: 1px solid color-mix(in srgb, var(--section-color) 28%, var(--color-theme-border)); background: var(--color-theme-surface); border-radius: 22px; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
    .section-icon { width: 36px; height: 36px; border-radius: 14px; background: color-mix(in srgb, var(--section-color) 14%, var(--color-theme-elevated)); border: 1px solid color-mix(in srgb, var(--section-color) 30%, var(--color-theme-border)); display: flex; align-items: center; justify-content: center; color: var(--section-color); flex-shrink: 0; }
    .section-progress-track { width: 100%; height: 8px; border-radius: 999px; overflow: hidden; background: color-mix(in srgb, var(--section-color) 13%, var(--color-surface-container-high)); }
    .section-progress-fill { height: 100%; border-radius: 999px; background: var(--section-color); transition: width 280ms ease; }
    .badge { padding: 4px 8px; border-radius: 999px; background: var(--color-surface-container-high); color: var(--color-on-surface-variant); font: 700 10px/12px Inter, sans-serif; white-space: nowrap; }
    .badge-pending { background: rgba(255, 192, 0, .14); color: var(--color-theme-orange); }
    .mini-button, .icon-pill { border: none; background: var(--color-surface-container-high); color: var(--color-on-surface); border-radius: 999px; padding: 8px 12px; display: inline-flex; align-items: center; gap: 5px; font: 700 12px/14px Inter, sans-serif; }
    .task-row { display: flex; align-items: center; gap: 8px; min-height: 42px; padding: 8px 10px; border-radius: 12px; background: var(--color-surface-container-low); color: var(--color-on-surface); text-decoration: none; }
    .avatar-stack { border: none; background: transparent; padding: 0; display: flex; align-items: center; flex-direction: row-reverse; justify-content: flex-end; min-width: 28px; min-height: 28px; }
    .mini-avatar { width: 28px; height: 28px; border-radius: 999px; overflow: hidden; border: 2px solid var(--color-surface-container-low); background: var(--color-theme-elevated); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font: 800 10px/1 Inter, sans-serif; margin-left: -8px; }
    .avatar-stack .mini-avatar:first-child { margin-left: 0; }
    .avatar-add { width: 30px; height: 30px; border-radius: 999px; border: none; background: var(--color-surface-container-high); color: var(--color-on-surface-variant); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .empty-row { border-radius: 16px; background: var(--color-surface-container-low); color: var(--color-on-surface-variant); padding: 12px; text-align: center; font: 500 13px/18px Inter, sans-serif; }
    .field { width: 100%; min-height: 48px; border: 1px solid var(--color-theme-border); background: var(--color-surface-container-lowest); border-radius: 18px; color: var(--color-on-surface); padding: 0 14px; outline: none; font: 500 14px/18px Inter, sans-serif; }
    .result-row { width: 100%; border: 1px solid var(--color-theme-border); background: var(--color-theme-surface); color: inherit; border-radius: 18px; padding: 10px; display: flex; align-items: center; gap: 10px; }
    .choice-chip { border: 1px solid var(--color-theme-border); background: var(--color-surface-container-high); color: var(--color-on-surface); border-radius: 999px; padding: 10px 14px; white-space: nowrap; font: 700 12px/14px Inter, sans-serif; }
    .error-box { border: 1px solid rgba(255, 51, 102, .36); background: rgba(255, 51, 102, .12); color: var(--color-on-error-container); border-radius: 14px; padding: 10px 12px; font: 500 13px/18px Inter, sans-serif; }
  `]
})
export class ProjectDetailsComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly projects = inject(ProjectsService);
  private readonly tasks = inject(TasksService);
  private readonly auth = inject(AuthService);
  readonly location = inject(Location);

  private readonly projectId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly details = signal<ProjectDetailsDto | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeSheet = signal<SheetMode | null>(null);
  readonly isSubmittingSheet = signal(false);
  readonly sheetError = signal<string | null>(null);
  readonly assignmentSuccessOpen = signal(false);
  readonly assignmentSuccessTitle = signal('Sent');
  readonly assignmentSuccessMessage = signal('Assignment request sent.');

  readonly memberQuery = signal('');
  readonly userResults = signal<UserSearchResultDto[]>([]);
  readonly assignmentQuery = signal('');
  readonly assignmentSearchResults = signal<UserSearchResultDto[]>([]);
  readonly sectionTitle = signal('');
  readonly sectionDescription = signal('');
  readonly sectionColor = signal('#B072FF');
  readonly sectionIcon = signal('view_column');
  readonly taskTitle = signal('');
  readonly taskDescription = signal('');
  readonly taskDueDate = signal(new Date().toISOString().slice(0, 10));
  readonly taskDueTime = signal('');
  readonly taskPriority = signal<number | null>(null);
  readonly taskAssigneeId = signal<string | null>(null);
  readonly selectedSectionId = signal<string | null>(null);
  readonly selectedTaskId = signal<string | null>(null);
  readonly colors = PROJECT_COLOR_OPTIONS;
  readonly projectIcons = PROJECT_ICON_OPTIONS;
  private assignmentSuccessTimer: ReturnType<typeof setTimeout> | null = null;

  readonly activeMembers = computed(() => (this.details()?.members ?? []).filter(member => this.memberStatusLabel(member.status) === 'Active'));
  readonly selectedSection = computed(() => (this.details()?.sections ?? []).find(section => section.id === this.selectedSectionId()) ?? null);
  readonly selectedTask = computed(() => (this.details()?.tasks ?? []).find(task => task.id === this.selectedTaskId()) ?? null);
  readonly selectedSectionColor = computed(() => this.selectedSection()?.color || this.sectionColor());
  readonly taskAssigneeOptions = computed(() => this.activeMembers());
  readonly assignmentTargetUserIds = computed(() => {
    if (this.activeSheet() === 'assign-section') return this.assignedSectionUserIds(this.selectedSection());
    if (this.activeSheet() === 'assign-task') return this.assignedTaskUserIds(this.selectedTask());
    return [];
  });
  readonly assignmentOptions = computed(() => {
    const query = this.normalized(this.assignmentQuery());
    const assignedUserIds = new Set(this.assignmentTargetUserIds());
    const options = new Map<string, AssignmentUserOption>();

    for (const member of this.activeMembers()) {
      if (assignedUserIds.has(member.userId)) continue;
      const displayName = this.memberName(member);
      if (query && !this.normalized(`${displayName} ${member.userId}`).includes(query)) continue;
      options.set(member.userId, {
        userId: member.userId,
        displayName,
        username: null,
        avatarUrl: member.userAvatarUrl,
        isActiveProjectMember: true,
        hasPendingProjectInvite: false
      });
    }

    for (const user of this.assignmentSearchResults()) {
      if (user.userId === this.currentUserId()) continue;
      if (assignedUserIds.has(user.userId)) continue;
      const displayName = user.displayName || user.username;
      options.set(user.userId, {
        userId: user.userId,
        displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        isActiveProjectMember: user.isActiveProjectMember,
        hasPendingProjectInvite: user.hasPendingProjectInvite
      });
    }

    return [...options.values()];
  });
  readonly pendingCount = computed(() => {
    const detail = this.details();
    if (!detail) return 0;
    return detail.sections.reduce((sum, section) => sum + (section.pendingAssignedUserIds ?? (section.pendingAssignedUserId ? [section.pendingAssignedUserId] : [])).length, 0)
      + detail.tasks.reduce((sum, task) => sum + this.pendingTaskAssigneeCount(task), 0);
  });

  constructor() {
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.assignmentSuccessTimer) clearTimeout(this.assignmentSuccessTimer);
  }

  reload(): void {
    void this.load();
  }

  openSheet(sheet: SheetMode): void {
    this.sheetError.set(null);
    if (sheet === 'section') this.resetSectionForm();
    if (sheet === 'assign-section' || sheet === 'assign-task') this.resetAssignmentSearch();
    this.activeSheet.set(sheet);
  }

  openTaskSheet(sectionId: string): void {
    this.selectedSectionId.set(sectionId);
    this.taskTitle.set('');
    this.taskDescription.set('');
    this.taskDueDate.set(new Date().toISOString().slice(0, 10));
    this.taskDueTime.set('');
    this.taskAssigneeId.set(this.currentUserId());
    this.taskPriority.set(null);
    this.openSheet('task');
  }

  openAssignSectionSheet(sectionId: string): void {
    this.selectedSectionId.set(sectionId);
    this.openSheet('assign-section');
  }

  openAssignTaskSheet(taskId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedTaskId.set(taskId);
    this.openSheet('assign-task');
  }

  closeSheet(): void {
    this.activeSheet.set(null);
    this.sheetError.set(null);
  }

  closeSheetOnBackdrop(event: Event): void {
    if (event.target === event.currentTarget) this.closeSheet();
  }

  async onMemberQuery(event: Event): Promise<void> {
    this.memberQuery.set(this.inputValue(event));
    const query = this.memberQuery().trim();
    if (query.length < 2 || !this.projectId) {
      this.userResults.set([]);
      return;
    }

    this.userResults.set(await this.projects.searchUsers(this.projectId, query));
  }

  async onAssignmentQuery(event: Event): Promise<void> {
    this.assignmentQuery.set(this.inputValue(event));
    const query = this.assignmentQuery().trim();
    if (query.length < 2 || !this.projectId) {
      this.assignmentSearchResults.set([]);
      return;
    }

    try {
      this.assignmentSearchResults.set(await this.projects.searchUsers(this.projectId, query));
    } catch (error) {
      this.sheetError.set(this.messageFromError(error, 'Could not search users.'));
    }
  }

  async inviteUser(user: UserSearchResultDto): Promise<void> {
    if (this.isSubmittingSheet()) return;
    this.isSubmittingSheet.set(true);
    this.sheetError.set(null);
    try {
      await this.projects.inviteUser(this.projectId, user.userId);
      this.userResults.update(items => items.map(item => item.userId === user.userId ? { ...item, hasPendingProjectInvite: true } : item));
    } catch (error) {
      this.sheetError.set(this.messageFromError(error, 'Could not send invite.'));
    } finally {
      this.isSubmittingSheet.set(false);
    }
  }

  async submitSection(): Promise<void> {
    if (!this.sectionTitle().trim() || this.isSubmittingSheet()) {
      this.sheetError.set('Section title is required.');
      return;
    }

    this.isSubmittingSheet.set(true);
    this.sheetError.set(null);
    try {
      await this.projects.createSection(this.projectId, {
        title: this.sectionTitle().trim(),
        description: this.sectionDescription().trim() || null,
        color: this.sectionColor(),
        icon: this.sectionIcon(),
        order: (this.details()?.sections.length ?? 0) + 1,
        visibility: 'Public',
        assignedUserId: this.currentUserId()
      });
      this.closeSheet();
      await this.load();
    } catch (error) {
      this.sheetError.set(this.messageFromError(error, 'Could not create section.'));
    } finally {
      this.isSubmittingSheet.set(false);
    }
  }

  async submitTask(): Promise<void> {
    if (!this.taskTitle().trim() || !this.selectedSectionId() || this.isSubmittingSheet()) {
      this.sheetError.set('Task title and section are required.');
      return;
    }

    this.isSubmittingSheet.set(true);
    this.sheetError.set(null);
    try {
      const request: CreateTaskRequest = {
        title: this.taskTitle().trim(),
        description: this.taskDescription().trim() || null,
        color: this.selectedSectionColor(),
        icon: this.selectedSection()?.icon ?? null,
        dueDate: this.taskDueDate() || null,
        dueTime: this.taskDueTime() || null,
        reminderAtUtc: null,
        assigneeUserId: this.taskAssigneeId(),
        projectId: this.projectId,
        sectionId: this.selectedSectionId(),
        habitId: null,
        priority: this.taskPriority(),
        isCountableInProgress: true
      };
      await this.tasks.createPersonalTask(request);
      this.closeSheet();
      await this.load();
    } catch (error) {
      this.sheetError.set(this.messageFromError(error, 'Could not create task.'));
    } finally {
      this.isSubmittingSheet.set(false);
    }
  }

  async submitAssignment(option: AssignmentUserOption): Promise<void> {
    if (this.isSubmittingSheet()) return;
    this.isSubmittingSheet.set(true);
    this.sheetError.set(null);
    let sentInvite = false;
    try {
      if (!option.isActiveProjectMember && !option.hasPendingProjectInvite) {
        await this.projects.inviteUser(this.projectId, option.userId, 'Please join this project for the assignment.');
        sentInvite = true;
      }

      if (this.activeSheet() === 'assign-section' && this.selectedSectionId()) {
        await this.projects.assignSection(this.projectId, this.selectedSectionId()!, option.userId);
      } else if (this.activeSheet() === 'assign-task' && this.selectedTaskId()) {
        await this.tasks.assignTask(this.selectedTaskId()!, option.userId);
      }
      this.isSubmittingSheet.set(false);
      this.closeSheet();
      await this.load();
      this.showAssignmentSuccess(option, sentInvite);
    } catch (error) {
      this.sheetError.set(this.messageFromError(error, 'Could not send assignment request.'));
    } finally {
      this.isSubmittingSheet.set(false);
    }
  }

  sectionTasks(sectionId: string): TaskDto[] {
    return (this.details()?.tasks ?? []).filter(task => task.sectionId === sectionId);
  }

  sectionAssignedMembers(section: ProjectSectionDto): ProjectMemberDto[] {
    return this.membersByUserIds(this.assignedSectionUserIds(section));
  }

  taskAssignedMembers(task: TaskDto): ProjectMemberDto[] {
    return this.membersByUserIds(this.assignedTaskUserIds(task));
  }

  pendingTaskAssigneeCount(task: TaskDto): number {
    return (task.pendingAssigneeUserIds ?? (task.pendingAssigneeUserId ? [task.pendingAssigneeUserId] : [])).length;
  }

  projectProgress(): number {
    return Math.round(this.details()?.progress.percentage ?? 0);
  }

  projectColor(): string {
    return this.details()?.project.color || '#B072FF';
  }

  sectionColorValue(section: ProjectSectionDto): string {
    return section.color || this.projectColor();
  }

  round(value: number): number {
    return Math.round(value);
  }

  roleLabel(): string {
    const role = this.details()?.currentUserRole;
    if (role === 'Owner' || role === 0) return 'Owner';
    if (role === 'Member' || role === 1) return 'Member';
    return 'Project details';
  }

  statusLabel(status: string | number): string {
    if (status === 1 || status === 'Completed') return 'Completed';
    if (status === 2 || status === 'Archived') return 'Archived';
    return 'Active';
  }

  roleName(role: string | number): string {
    return role === 'Owner' || role === 0 ? 'Owner' : 'Member';
  }

  memberName(member: ProjectMemberDto): string {
    if (member.userId === this.auth.currentUser()?.userId) return 'You';
    return member.userDisplayName || member.userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.auth.currentUser()?.userId;
  }

  assignmentOptionSubtitle(option: AssignmentUserOption): string {
    if (this.isCurrentUser(option.userId)) return 'Assign immediately';
    if (option.isActiveProjectMember) return 'Project member - requires inbox approval';
    if (option.hasPendingProjectInvite) return 'Invite pending - assignment request will be sent';
    return 'Not in project - invite and assignment request will be sent';
  }

  assignmentEmptyText(): string {
    return this.assignmentQuery().trim().length >= 2
      ? 'No matching users found.'
      : 'Search or choose a project member.';
  }

  sectionOwnerLabel(section: ProjectSectionDto): string {
    const assignedCount = this.assignedSectionUserIds(section).length;
    const pendingCount = (section.pendingAssignedUserIds ?? (section.pendingAssignedUserId ? [section.pendingAssignedUserId] : [])).length;
    if (pendingCount > 0) return 'Waiting for assignment approval';
    if (assignedCount === 0) return 'No assigned owner';
    if (assignedCount === 1) return `Assigned to ${this.memberByUserId(this.assignedSectionUserIds(section)[0])}`;
    return `Assigned to ${assignedCount} people`;
  }

  assignmentLabel(status: string | number): string {
    if (status === 1 || status === 'Pending') return 'Pending';
    if (status === 2 || status === 'Accepted') return 'Accepted';
    if (status === 3 || status === 'Rejected') return 'Rejected';
    return 'Open';
  }

  taskStatusName(status: TaskStatus | number): string {
    if (status === 1 || status === 'InProgress') return 'In Progress';
    if (status === 2 || status === 'Review') return 'Review';
    if (status === 3 || status === 'Done') return 'Done';
    if (status === 4 || status === 'Overdue') return 'Overdue';
    if (status === 5 || status === 'Archived') return 'Archived';
    return 'Todo';
  }

  sheetTitle(sheet: SheetMode): string {
    if (sheet === 'member') return 'Add Member';
    if (sheet === 'section') return 'Add Section';
    if (sheet === 'task') return 'Add Task';
    return 'Assign Owner';
  }

  sheetSubtitle(sheet: SheetMode): string {
    if (sheet === 'member') return 'Invite by username. Membership starts only after accept.';
    if (sheet === 'section') return 'Create a project section.';
    if (sheet === 'task') return `Create task in ${this.selectedSectionTitle()}.`;
    return 'Choose a project member or search username.';
  }

  sheetLoadingTitle(): string {
    const sheet = this.activeSheet();
    if (sheet === 'assign-section' || sheet === 'assign-task') return 'Sending request';
    if (sheet === 'member') return 'Sending invite';
    if (sheet === 'section') return 'Creating section';
    if (sheet === 'task') return 'Creating task';
    return 'Please wait';
  }

  sheetLoadingMessage(): string {
    const sheet = this.activeSheet();
    if (sheet === 'assign-section' || sheet === 'assign-task') return 'Preparing the inbox request';
    if (sheet === 'member') return 'Inviting this user to the project';
    if (sheet === 'section') return 'Adding it to the project';
    if (sheet === 'task') return 'Adding it to the section';
    return 'Working on your request';
  }

  sheetAccentColor(sheet: SheetMode): string {
    if (sheet === 'task' || sheet === 'assign-section') return this.selectedSectionColor();
    if (sheet === 'section') return this.sectionColor();
    return this.details()?.project.color || '#B072FF';
  }

  initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'U';
  }

  inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  numberValue(event: Event): number | null {
    const value = this.inputValue(event);
    return value ? Number(value) : null;
  }

  setTaskDueDate(value: string): void {
    this.taskDueDate.set(value);
  }

  setTaskDueToday(): void {
    this.taskDueDate.set(this.formatDate(new Date()));
  }

  setTaskDueTomorrow(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.taskDueDate.set(this.formatDate(tomorrow));
  }

  isTaskDueToday(): boolean {
    return this.taskDueDate() === this.formatDate(new Date());
  }

  isTaskDueTomorrow(): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.taskDueDate() === this.formatDate(tomorrow);
  }

  selectedSectionTitle(): string {
    return this.selectedSection()?.title ?? 'Selected section';
  }

  selectedSectionIcon(): string {
    return this.selectedSection()?.icon || 'view_column';
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      this.details.set(await this.projects.getProjectDetails(this.projectId));
    } catch (error) {
      this.error.set(this.messageFromError(error, 'The project could not be loaded.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private resetSectionForm(): void {
    this.sectionTitle.set('');
    this.sectionDescription.set('');
    this.sectionColor.set('#B072FF');
    this.sectionIcon.set('view_column');
  }

  private resetAssignmentSearch(): void {
    this.assignmentQuery.set('');
    this.assignmentSearchResults.set([]);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private memberByUserId(userId: string): string {
    const member = this.activeMembers().find(item => item.userId === userId);
    return member ? this.memberName(member) : 'member';
  }

  private membersByUserIds(userIds: string[]): ProjectMemberDto[] {
    const members = new Map(this.activeMembers().map(member => [member.userId, member]));
    return userIds.map(userId => members.get(userId)).filter((member): member is ProjectMemberDto => Boolean(member));
  }

  private assignedSectionUserIds(section: ProjectSectionDto | null): string[] {
    if (!section) return [];
    return this.uniqueIds(section.assignedUserIds ?? (section.assignedUserId ? [section.assignedUserId] : []));
  }

  private assignedTaskUserIds(task: TaskDto | null): string[] {
    if (!task) return [];
    return this.uniqueIds(task.assignedUserIds ?? (task.assigneeUserId ? [task.assigneeUserId] : []));
  }

  private currentUserId(): string | null {
    return this.auth.currentUser()?.userId ?? null;
  }

  private uniqueIds(userIds: Array<string | null | undefined>): string[] {
    return [...new Set(userIds.filter((userId): userId is string => Boolean(userId)))];
  }

  private normalized(value: string): string {
    return value.trim().toLowerCase();
  }

  private showAssignmentSuccess(option: AssignmentUserOption, sentInvite: boolean): void {
    if (this.assignmentSuccessTimer) clearTimeout(this.assignmentSuccessTimer);
    const isSelf = this.isCurrentUser(option.userId);
    this.assignmentSuccessTitle.set(isSelf ? 'Assigned' : 'Sent');
    this.assignmentSuccessMessage.set(
      isSelf
        ? 'Assigned to you.'
        : sentInvite
          ? 'Project invite and assignment request sent.'
          : 'Assignment request sent.'
    );
    this.assignmentSuccessOpen.set(true);
    this.assignmentSuccessTimer = setTimeout(() => this.assignmentSuccessOpen.set(false), 1400);
  }

  private memberStatusLabel(status: ProjectMemberStatus): 'Active' | 'Pending' | 'Rejected' | 'Removed' {
    if (status === 1 || status === 'Pending') return 'Pending';
    if (status === 2 || status === 'Rejected') return 'Rejected';
    if (status === 3 || status === 'Removed') return 'Removed';
    return 'Active';
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
