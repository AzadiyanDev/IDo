import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export const enum HabitScheduleType {
  SpecificDays = 0,
  TimesPerWeek = 1
}

export type HabitLogStatus = 'Done' | 'Missed' | 'Skipped' | 'RestDay' | 'OutOfSchedule' | 0 | 1 | 2 | 3 | 4;

export interface HabitDto {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  scheduleType: HabitScheduleType;
  requiredTimesPerWeek: number | null;
  reminderTime: string | null;
  isActive: boolean;
  currentStreak: number;
  bestStreak: number;
  activeDays: number[];
}

export interface HabitLogDto {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  status: HabitLogStatus;
  completedAtUtc: string | null;
  note: string | null;
}

export interface HabitAnalyticsDto {
  from: string;
  to: string;
  scheduledDays: number;
  completedDays: number;
  missedDays: number;
  openDays: number;
  restDays: number;
  outOfScheduleDays: number;
  successRate: number;
  completionDensity: number;
  averageDonePerWeek: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  longestGapDays: number;
}

export interface HabitDayAnalysisDto {
  date: string;
  dayOfWeek: number | string;
  isScheduled: boolean;
  status: HabitLogStatus | null;
  completedAtUtc: string | null;
}

export interface HabitWeekdayAnalysisDto {
  dayOfWeek: number | string;
  scheduledDays: number;
  completedDays: number;
  missedDays: number;
  successRate: number;
}

export interface HabitDetailsDto {
  habit: HabitDto;
  logs: HabitLogDto[];
  analytics: HabitAnalyticsDto;
  recentDays: HabitDayAnalysisDto[];
  weekdayStats: HabitWeekdayAnalysisDto[];
}

export interface CreateHabitRequest {
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  scheduleType: HabitScheduleType;
  requiredTimesPerWeek: number | null;
  reminderTime: string | null;
  activeDays: number[];
  restDays: number[];
}

@Injectable({ providedIn: 'root' })
export class HabitsService {
  constructor(private readonly http: HttpClient) {}

  getHabits(): Promise<HabitDto[]> {
    return firstValueFrom(this.http.get<HabitDto[]>('/api/habits', { withCredentials: true }));
  }

  getHabitDetails(id: string, from?: string, to?: string): Promise<HabitDetailsDto> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.size > 0 ? `?${params.toString()}` : '';
    return firstValueFrom(this.http.get<HabitDetailsDto>(`/api/habits/${id}${query}`, { withCredentials: true }));
  }

  createHabit(request: CreateHabitRequest): Promise<HabitDto> {
    return firstValueFrom(this.http.post<HabitDto>('/api/habits', request, { withCredentials: true }));
  }

  completeHabit(id: string, date: string): Promise<HabitLogDto> {
    return firstValueFrom(this.http.post<HabitLogDto>(`/api/habits/${id}/complete?date=${encodeURIComponent(date)}`, {}, { withCredentials: true }));
  }
}
