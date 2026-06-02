import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export const enum HabitScheduleType {
  SpecificDays = 0,
  TimesPerWeek = 1
}

export type HabitLogStatus = 'Done' | 'Missed' | 'Skipped' | 'RestDay' | 'OutOfSchedule';

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

  createHabit(request: CreateHabitRequest): Promise<HabitDto> {
    return firstValueFrom(this.http.post<HabitDto>('/api/habits', request, { withCredentials: true }));
  }

  completeHabit(id: string, date: string): Promise<HabitLogDto> {
    return firstValueFrom(this.http.post<HabitLogDto>(`/api/habits/${id}/complete?date=${encodeURIComponent(date)}`, {}, { withCredentials: true }));
  }
}
