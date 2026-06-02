import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type TaskStatus = 'Todo' | 'InProgress' | 'Review' | 'Done' | 'Overdue' | 'Archived' | 0 | 1 | 2 | 3 | 4 | 5;
export type TaskType = 'Personal' | 'Project' | 0 | 1 | 2;
export type ProjectTaskAssignmentStatus = 'None' | 'Pending' | 'Accepted' | 'Rejected' | 0 | 1 | 2 | 3;
export type CollaborationRequestType = 'ProjectInvite' | 'SectionAssignment' | 'TaskAssignment' | 0 | 1 | 2;
export type TaskRequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | 0 | 1 | 2 | 3;

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  dueDate: string | null;
  dueTime: string | null;
  reminderAtUtc: string | null;
  status: TaskStatus;
  type: TaskType;
  creatorUserId: string;
  assigneeUserId: string | null;
  pendingAssigneeUserId: string | null;
  assignedUserIds: string[];
  pendingAssigneeUserIds: string[];
  projectId: string | null;
  sectionId: string | null;
  habitId: string | null;
  assignmentStatus: ProjectTaskAssignmentStatus;
  priority: number | null;
  isCountableInProgress: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  completedAtUtc: string | null;
}

export interface TodayHabitDto {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  currentStreak: number;
  bestStreak: number;
  isCompletedToday: boolean;
}

export interface ProjectDto {
  id: string;
  ownerUserId: string;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  status: string | number;
  archivedAtUtc: string | null;
}

export interface TodayProjectDto {
  project: ProjectDto;
  taskCount: number;
  doneCount: number;
}

export interface TaskRequestDto {
  id: string;
  type: CollaborationRequestType;
  projectId: string | null;
  sectionId: string | null;
  taskId: string | null;
  senderUserId: string;
  receiverUserId: string;
  status: TaskRequestStatus;
  title: string;
  message: string | null;
  createdAtUtc: string;
  respondedAtUtc: string | null;
  responseNote: string | null;
}

export interface TodaySummaryDto {
  personalTaskCount: number;
  personalTaskDoneCount: number;
  habitCount: number;
  habitDoneCount: number;
  projectTaskCount: number;
  projectTaskDoneCount: number;
  pendingRequestCount: number;
  doneCount: number;
  overdueCount: number;
  donePercentage: number;
}

export interface TodayDashboardDto {
  date: string;
  personalTasks: TaskDto[];
  todayHabits: TodayHabitDto[];
  projectTasks: TaskDto[];
  activeProjects: TodayProjectDto[];
  pendingTaskRequests: TaskRequestDto[];
  summary: TodaySummaryDto;
}

@Injectable({ providedIn: 'root' })
export class TodayService {
  constructor(private readonly http: HttpClient) {}

  getToday(date?: string): Promise<TodayDashboardDto> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return firstValueFrom(this.http.get<TodayDashboardDto>(`/api/today${query}`, { withCredentials: true }));
  }
}
