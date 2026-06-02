import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { TaskRequestDto } from './today.service';

@Injectable({ providedIn: 'root' })
export class TaskRequestsService {
  constructor(private readonly http: HttpClient) {}

  getInbox(): Promise<TaskRequestDto[]> {
    return firstValueFrom(this.http.get<TaskRequestDto[]>('/api/task-requests/inbox', { withCredentials: true }));
  }

  accept(id: string, responseNote: string | null = null): Promise<TaskRequestDto> {
    return firstValueFrom(this.http.post<TaskRequestDto>(`/api/task-requests/${id}/accept`, { responseNote }, { withCredentials: true }));
  }

  reject(id: string, responseNote: string | null = null): Promise<TaskRequestDto> {
    return firstValueFrom(this.http.post<TaskRequestDto>(`/api/task-requests/${id}/reject`, { responseNote }, { withCredentials: true }));
  }
}
