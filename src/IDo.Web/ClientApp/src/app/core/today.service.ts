import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type TaskStatus = 'Todo' | 'InProgress' | 'Done' | 'Archived';
export type TaskType = 'Personal' | 'Project';

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
  projectId: string | null;
  sectionId: string | null;
  habitId: string | null;
  isCountableInProgress: boolean;
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
  status: string;
  archivedAtUtc: string | null;
}

export interface TodayProjectDto {
  project: ProjectDto;
  taskCount: number;
  doneCount: number;
}

export interface TaskRequestDto {
  id: string;
  taskId: string;
  senderUserId: string;
  receiverUserId: string;
  status: string;
  message: string | null;
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
