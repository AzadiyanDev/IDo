import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { CollaborationRequestType, ProjectTaskAssignmentStatus, TaskDto, TaskRequestDto } from './today.service';

export type ProjectStatus = 'Active' | 'Completed' | 'Archived' | 0 | 1 | 2;
export type ProjectMemberRole = 'Owner' | 'Member' | 0 | 1;
export type ProjectMemberStatus = 'Active' | 'Pending' | 'Rejected' | 'Removed' | 0 | 1 | 2 | 3;
export type SectionVisibility = 'Public' | 'AssignedToMember' | 0 | 1;
export type ProjectSectionAssignmentStatus = 'None' | 'Pending' | 'Accepted' | 'Rejected' | 0 | 1 | 2 | 3;

export interface ProjectDto {
  id: string;
  ownerUserId: string;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  status: ProjectStatus;
  archivedAtUtc: string | null;
}

export interface ProjectProgressDto {
  projectId: string;
  doneCount: number;
  totalCount: number;
  percentage: number;
}

export interface ProjectMemberDto {
  id: string;
  projectId: string;
  userId: string;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  role: ProjectMemberRole;
  status: ProjectMemberStatus;
  invitedByUserId: string | null;
  joinedAtUtc: string;
  removedAtUtc: string | null;
}

export interface ProjectSectionDto {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  order: number;
  visibility: SectionVisibility;
  assignedUserId: string | null;
  pendingAssignedUserId: string | null;
  assignedUserIds: string[];
  pendingAssignedUserIds: string[];
  assignmentStatus: ProjectSectionAssignmentStatus;
  isArchived: boolean;
  doneCount: number;
  totalCount: number;
  progressPercentage: number;
}

export interface ProjectPermissionsDto {
  canManageProject: boolean;
  canManageMembers: boolean;
  canCreateSection: boolean;
  canCreateTask: boolean;
  canAssignMembers: boolean;
}

export interface ProjectDetailsDto {
  project: ProjectDto;
  sections: ProjectSectionDto[];
  members: ProjectMemberDto[];
  tasks: TaskDto[];
  progress: ProjectProgressDto;
  currentUserRole: ProjectMemberRole | null;
  permissions: ProjectPermissionsDto;
}

export interface CreateProjectRequest {
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
}

export interface UpdateProjectRequest extends CreateProjectRequest {
  status: ProjectStatus;
}

export interface CreateProjectSectionRequest {
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  order: number;
  visibility: SectionVisibility;
  assignedUserId: string | null;
}

export interface UserSearchResultDto {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isActiveProjectMember: boolean;
  hasPendingProjectInvite: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  constructor(private readonly http: HttpClient) {}

  getProjects(): Promise<ProjectDto[]> {
    return firstValueFrom(this.http.get<ProjectDto[]>('/api/projects', { withCredentials: true }));
  }

  getProjectDetails(id: string): Promise<ProjectDetailsDto> {
    return firstValueFrom(this.http.get<ProjectDetailsDto>(`/api/projects/${id}`, { withCredentials: true }));
  }

  createProject(request: CreateProjectRequest): Promise<ProjectDto> {
    return firstValueFrom(this.http.post<ProjectDto>('/api/projects', request, { withCredentials: true }));
  }

  updateProject(id: string, request: UpdateProjectRequest): Promise<ProjectDto> {
    return firstValueFrom(this.http.put<ProjectDto>(`/api/projects/${id}`, request, { withCredentials: true }));
  }

  archiveProject(id: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`/api/projects/${id}/archive`, {}, { withCredentials: true }));
  }

  searchUsers(projectId: string, query: string): Promise<UserSearchResultDto[]> {
    return firstValueFrom(this.http.get<UserSearchResultDto[]>(`/api/projects/${projectId}/users?query=${encodeURIComponent(query)}`, { withCredentials: true }));
  }

  inviteUser(projectId: string, userId: string, message: string | null = null): Promise<TaskRequestDto> {
    return firstValueFrom(this.http.post<TaskRequestDto>(`/api/projects/${projectId}/invite`, { userId, username: null, message }, { withCredentials: true }));
  }

  createSection(projectId: string, request: CreateProjectSectionRequest): Promise<ProjectSectionDto> {
    return firstValueFrom(this.http.post<ProjectSectionDto>(`/api/projects/${projectId}/sections`, request, { withCredentials: true }));
  }

  assignSection(projectId: string, sectionId: string, receiverUserId: string, message: string | null = null): Promise<TaskRequestDto> {
    return firstValueFrom(this.http.post<TaskRequestDto>(`/api/projects/${projectId}/sections/${sectionId}/assign`, { receiverUserId, message }, { withCredentials: true }));
  }
}

export type { CollaborationRequestType, ProjectTaskAssignmentStatus, TaskRequestDto };
