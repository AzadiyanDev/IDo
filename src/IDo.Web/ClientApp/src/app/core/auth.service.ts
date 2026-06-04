import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface UserSettings {
  notificationsEnabled: boolean;
  language: string;
  theme: string;
  weekStartDay: string;
  calendarType: 'Gregorian' | 'Jalali';
  defaultReminderTime: string | null;
}

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  settings: UserSettings;
}

export interface AuthUser {
  userId: string;
  userName: string;
  email: string;
  profile: UserProfile;
}

export interface UpdateUserProfileRequest {
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  settings: UserSettings;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'ido.auth.user';
  readonly currentUser = signal<AuthUser | null>(this.readStoredUser());

  constructor(private readonly http: HttpClient) {}

  isSignedIn(): boolean {
    return this.currentUser() !== null;
  }

  async login(identifier: string, password: string): Promise<AuthUser> {
    const user = await firstValueFrom(
      this.http.post<AuthUser>('/api/auth/login', { identifier, password }, { withCredentials: true })
    );
    this.setUser(user);
    return user;
  }

  async register(userName: string, email: string, password: string): Promise<AuthUser> {
    const user = await firstValueFrom(
      this.http.post<AuthUser>('/api/auth/register', { userName, email, password }, { withCredentials: true })
    );
    this.setUser(user);
    return user;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>('/api/auth/logout', {}, { withCredentials: true }));
    this.setUser(null);
  }

  async getProfile(): Promise<UserProfile> {
    return firstValueFrom(this.http.get<UserProfile>('/api/profile', { withCredentials: true }));
  }

  async updateProfile(profile: UserProfile): Promise<UserProfile> {
    const updatedProfile = await firstValueFrom(
      this.http.put<UserProfile>('/api/profile', profile, { withCredentials: true })
    );
    this.mergeProfile(updatedProfile);
    return updatedProfile;
  }

  async uploadAvatar(file: File): Promise<UserProfile> {
    const body = new FormData();
    body.append('file', file);
    const updatedProfile = await firstValueFrom(
      this.http.post<UserProfile>('/api/profile/avatar', body, { withCredentials: true })
    );
    this.mergeProfile(updatedProfile);
    return updatedProfile;
  }

  async updateSettings(settings: UserSettings): Promise<UserProfile> {
    const updatedProfile = await firstValueFrom(
      this.http.put<UserProfile>('/api/profile/settings', settings, { withCredentials: true })
    );
    this.mergeProfile(updatedProfile);
    return updatedProfile;
  }

  async updateAccount(request: UpdateUserProfileRequest): Promise<AuthUser> {
    const user = await firstValueFrom(
      this.http.put<AuthUser>('/api/profile/account', request, { withCredentials: true })
    );
    this.setUser(user);
    return user;
  }

  private setUser(user: AuthUser | null): void {
    this.currentUser.set(user);
    if (user) {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  private readStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) as AuthUser : null;
    } catch {
      return null;
    }
  }

  private mergeProfile(profile: UserProfile): void {
    const user = this.currentUser();
    if (!user) return;
    this.setUser({ ...user, email: profile.email ?? user.email, profile });
  }
}
