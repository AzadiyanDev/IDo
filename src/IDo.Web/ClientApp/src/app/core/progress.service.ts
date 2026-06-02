import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TaskDto } from './today.service';

export interface ProgressDto {
  doneCount: number;
  totalCount: number;
  percentage: number;
}

export interface WeeklyActivityDto {
  weekStartDate: string;
  completedCountByDate: Record<string, number>;
}

export interface HabitProgressDto {
  habitId: string;
  completedActiveDays: number;
  totalActiveDays: number;
  currentStreak: number;
  bestStreak: number;
  successRate: number;
}

export interface ProjectProgressDto {
  projectId: string;
  doneCount: number;
  totalCount: number;
  percentage: number;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  constructor(private readonly http: HttpClient) {}

  getTodayProgress(date?: string): Promise<ProgressDto> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return firstValueFrom(this.http.get<ProgressDto>(`/api/progress/today${query}`, { withCredentials: true }));
  }

  getWeeklyActivity(weekStartDate?: string): Promise<WeeklyActivityDto> {
    const query = weekStartDate ? `?weekStartDate=${encodeURIComponent(weekStartDate)}` : '';
    return firstValueFrom(this.http.get<WeeklyActivityDto>(`/api/progress/weekly${query}`, { withCredentials: true }));
  }

  getHabitProgress(from?: string, to?: string): Promise<HabitProgressDto[]> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const serialized = params.toString();
    const query = serialized ? `?${serialized}` : '';
    return firstValueFrom(this.http.get<HabitProgressDto[]>(`/api/progress/habits${query}`, { withCredentials: true }));
  }

  getProjectProgress(): Promise<ProjectProgressDto[]> {
    return firstValueFrom(this.http.get<ProjectProgressDto[]>('/api/progress/projects', { withCredentials: true }));
  }

  getOverdueTasks(date?: string): Promise<TaskDto[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return firstValueFrom(this.http.get<TaskDto[]>(`/api/tasks/overdue${query}`, { withCredentials: true }));
  }
}
