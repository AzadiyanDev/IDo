import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TaskDto } from './today.service';

export interface CreateTaskRequest {
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  dueDate: string | null;
  dueTime: string | null;
  reminderAtUtc: string | null;
  assigneeUserId: string | null;
  projectId: string | null;
  sectionId: string | null;
  habitId: string | null;
  isCountableInProgress: boolean;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  constructor(private readonly http: HttpClient) {}

  createPersonalTask(request: CreateTaskRequest): Promise<TaskDto> {
    return firstValueFrom(this.http.post<TaskDto>('/api/tasks', request, { withCredentials: true }));
  }
}
