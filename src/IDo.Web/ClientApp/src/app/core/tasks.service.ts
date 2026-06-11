import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { ProjectTaskAssignmentStatus, TaskDto, TaskRequestDto, TaskStatus } from './today.service';

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
  priority: number | null;
  isCountableInProgress: boolean;
}

export interface UpdateTaskRequest {
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  dueDate: string | null;
  dueTime: string | null;
  reminderAtUtc: string | null;
  assigneeUserId: string | null;
  status: TaskStatus | null;
  priority: number | null;
  isCountableInProgress: boolean;
}

export interface TaskCommentDto {
  id: string;
  taskId: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  body: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface TaskDetailsDto {
  task: TaskDto;
  projectTitle: string | null;
  sectionTitle: string | null;
  assigneeDisplayName: string | null;
  creatorDisplayName: string | null;
  assignmentStatus: ProjectTaskAssignmentStatus;
  comments: TaskCommentDto[];
  pendingRequests: TaskRequestDto[];
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  constructor(private readonly http: HttpClient) {}

  createPersonalTask(request: CreateTaskRequest): Promise<TaskDto> {
    return firstValueFrom(this.http.post<TaskDto>('/api/tasks', request, { withCredentials: true }));
  }

  getTaskDetails(id: string): Promise<TaskDetailsDto> {
    return firstValueFrom(this.http.get<TaskDetailsDto>(`/api/tasks/${id}`, { withCredentials: true }));
  }

  updateTask(id: string, request: UpdateTaskRequest): Promise<TaskDto> {
    return firstValueFrom(this.http.post<TaskDto>(`/api/tasks/${id}`, request, { withCredentials: true }));
  }

  deleteTask(id: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`/api/tasks/${id}/delete`, {}, { withCredentials: true }));
  }

  changeStatus(id: string, status: TaskStatus): Promise<TaskDto> {
    return firstValueFrom(this.http.post<TaskDto>(`/api/tasks/${id}/status`, { status }, { withCredentials: true }));
  }

  addComment(id: string, body: string): Promise<TaskCommentDto> {
    return firstValueFrom(this.http.post<TaskCommentDto>(`/api/tasks/${id}/comments`, { body }, { withCredentials: true }));
  }

  assignTask(id: string, receiverUserId: string, message: string | null = null): Promise<TaskRequestDto> {
    return firstValueFrom(this.http.post<TaskRequestDto>(`/api/tasks/${id}/assign`, { receiverUserId, message }, { withCredentials: true }));
  }
}
