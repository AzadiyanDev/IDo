import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthUser, UserProfile, UserSettings } from '../../core/auth.service';
import { CalendarService } from '../../core/calendar.service';
import { I18nService } from '../../core/i18n.service';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, LoadingModalComponent],
  template: `
    <header class="w-full top-0 sticky bg-theme-bg z-40 py-md">
      <div class="px-margin-mobile flex items-center justify-between">
        <a routerLink="/today" class="icon-button no-underline">
          <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">arrow_back</span>
        </a>
        <h1 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Profile') }}</h1>
        <button type="button" (click)="isLogoutOpen.set(true)" class="icon-button" [attr.aria-label]="i18n.text('Log out')">
          <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">logout</span>
        </button>
      </div>
    </header>

    <div class="px-margin-mobile flex flex-col gap-lg pb-xl">
      <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg flex flex-col items-center text-center gap-md">
        <button type="button" (click)="openEditProfile()" class="relative w-28 h-28 rounded-full overflow-hidden border border-theme-border bg-theme-elevated flex items-center justify-center text-primary">
          @if (avatarUrl()) {
            <img [src]="avatarUrl()" [alt]="displayName()" class="w-full h-full object-cover"/>
          } @else {
            <span class="text-display font-display font-bold">{{ initials() }}</span>
          }
          <span class="absolute end-1 bottom-1 w-9 h-9 rounded-full bg-primary text-on-primary border-4 border-theme-surface flex items-center justify-center">
            <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">edit</span>
          </span>
        </button>

        <div class="min-w-0 w-full">
          <h2 class="text-headline-lg font-headline-lg text-on-surface m-0 truncate">{{ displayName() }}</h2>
          <p class="text-body-md font-body-md text-primary mt-1 mb-0 truncate">@{{ userName() }}</p>
          <p class="text-body-md font-body-md text-on-surface-variant mt-1 mb-0 truncate">{{ profile()?.email || currentUser()?.email || i18n.text('No email set') }}</p>
          @if (profile()?.phoneNumber) {
            <p class="text-body-md font-body-md text-on-surface-variant mt-1 mb-0">{{ profile()?.phoneNumber }}</p>
          }
        </div>

        <button type="button" (click)="openEditProfile()" class="profile-save-button w-full">
          {{ i18n.text('Edit profile') }}
        </button>

        @if (statusMessage()) {
          <p class="text-body-md font-body-md m-0" [class.text-secondary]="!hasError()" [class.text-error]="hasError()">{{ statusMessage() }}</p>
        }
      </section>

      <section class="flex flex-col gap-md">
        <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Settings') }}</h3>
        <div class="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden">
          <button type="button" (click)="toggleNotifications()" class="profile-row">
            <span class="profile-row-icon bg-primary-container text-on-primary-container">
              <span class="material-symbols-outlined text-[19px]">notifications</span>
            </span>
            <span class="profile-row-text">
              <span class="profile-row-title">{{ i18n.text('Notifications') }}</span>
              <span class="profile-row-caption">{{ settings().notificationsEnabled ? i18n.text('Enabled') : i18n.text('Disabled') }}</span>
            </span>
            <span class="w-12 h-7 rounded-full p-1 transition-colors" [class.bg-secondary]="settings().notificationsEnabled" [class.bg-surface-container-highest]="!settings().notificationsEnabled">
              <span class="block w-5 h-5 rounded-full bg-white transition-transform" [class.translate-x-5]="settings().notificationsEnabled"></span>
            </span>
          </button>

          <button type="button" (click)="cycleLanguage()" class="profile-row border-t border-theme-border">
            <span class="profile-row-icon bg-secondary-container text-on-secondary-container">
              <span class="material-symbols-outlined text-[19px]">language</span>
            </span>
            <span class="profile-row-text">
              <span class="profile-row-title">{{ i18n.text('Language') }}</span>
              <span class="profile-row-caption">{{ i18n.languageLabel(settings().language) }}</span>
            </span>
            <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>

          <button type="button" (click)="toggleCalendarType()" class="profile-row border-t border-theme-border">
            <span class="profile-row-icon bg-primary-container text-on-primary-container">
              <span class="material-symbols-outlined text-[19px]">event</span>
            </span>
            <span class="profile-row-text">
              <span class="profile-row-title">{{ i18n.text('Calendar type') }}</span>
              <span class="profile-row-caption">{{ calendarTypeLabel() }}</span>
            </span>
            <span class="material-symbols-outlined text-on-surface-variant">swap_horiz</span>
          </button>
        </div>
      </section>
    </div>

    @if (isEditOpen()) {
      <div class="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center px-margin-mobile pb-md">
        <section class="w-full max-w-[448px] max-h-[88vh] overflow-y-auto hide-scrollbar bg-theme-surface border border-theme-border rounded-2xl p-lg flex flex-col gap-lg">
          <div class="flex items-center justify-between">
            <button type="button" (click)="closeEditProfile()" class="icon-button">
              <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">close</span>
            </button>
            <h2 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Edit profile') }}</h2>
            <button type="button" (click)="saveProfile()" [disabled]="isBusy()" class="icon-button text-primary disabled:opacity-60">
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check</span>
            </button>
          </div>

          <div class="flex flex-col items-center gap-sm">
            <button type="button" (click)="avatarInput.click()" [disabled]="isUploadingAvatar()" class="relative w-24 h-24 rounded-full overflow-hidden border border-theme-border bg-theme-elevated flex items-center justify-center text-primary disabled:opacity-90">
              @if (avatarPreview()) {
                <img [src]="avatarPreview()" [alt]="fullName()" class="w-full h-full object-cover"/>
              } @else {
                <span class="text-headline-lg font-headline-lg font-bold">{{ editInitials() }}</span>
              }
              @if (isUploadingAvatar()) {
                <span class="avatar-upload-overlay">
                  <span class="avatar-upload-ring"></span>
                  <span class="material-symbols-outlined text-[24px]">cloud_upload</span>
                </span>
              } @else if (avatarUploadSucceeded()) {
                <span class="avatar-success-overlay">
                  <span class="material-symbols-outlined text-[30px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                </span>
              } @else {
                <span class="absolute end-0 bottom-0 w-8 h-8 rounded-full bg-primary text-on-primary border-4 border-theme-surface flex items-center justify-center">
                  <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">photo_camera</span>
                </span>
              }
            </button>
            <input #avatarInput type="file" accept="image/png,image/jpeg,image/webp" class="hidden" (change)="uploadAvatar($event)"/>
            <span class="text-label-md font-label-md" [class.text-primary]="isUploadingAvatar()" [class.text-secondary]="avatarUploadSucceeded()" [class.text-on-surface-variant]="!isUploadingAvatar() && !avatarUploadSucceeded()">
              {{ avatarHelperText() }}
            </span>
          </div>

          <div class="flex flex-col gap-sm">
            <label class="flex flex-col gap-xs">
              <span class="profile-label">{{ i18n.text('Full name') }}</span>
              <input [value]="fullName()" (input)="fullName.set(inputValue($event))" class="profile-input" autocomplete="name"/>
            </label>
            <label class="flex flex-col gap-xs">
              <span class="profile-label">{{ i18n.text('Username') }}</span>
              <input [value]="editUserName()" (input)="editUserName.set(inputValue($event))" class="profile-input" autocomplete="username"/>
            </label>
            <label class="flex flex-col gap-xs">
              <span class="profile-label">{{ i18n.text('Email') }}</span>
              <input [value]="email()" (input)="email.set(inputValue($event))" class="profile-input" autocomplete="email" inputmode="email"/>
            </label>
            <label class="flex flex-col gap-xs">
              <span class="profile-label">{{ i18n.text('Phone') }}</span>
              <input [value]="phoneNumber()" (input)="phoneNumber.set(inputValue($event))" class="profile-input" autocomplete="tel" inputmode="tel"/>
            </label>
          </div>

          <button type="button" (click)="saveProfile()" [disabled]="isBusy()" class="profile-save-button disabled:opacity-60">
            {{ isSaving() ? i18n.text('Saving...') : i18n.text('Save profile') }}
          </button>
        </section>
      </div>
    }

    @if (isLogoutOpen()) {
      <div class="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center px-margin-mobile">
        <section class="w-full max-w-[360px] bg-theme-surface border border-theme-border rounded-2xl p-lg flex flex-col gap-md">
          <div class="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
            <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">logout</span>
          </div>
          <div>
            <h2 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Log out?') }}</h2>
            <p class="text-body-md font-body-md text-on-surface-variant mt-xs mb-0">{{ i18n.text('You will need to sign in again to access your tasks and projects.') }}</p>
          </div>
          <div class="grid grid-cols-2 gap-sm">
            <button type="button" (click)="isLogoutOpen.set(false)" class="secondary-button">{{ i18n.text('Cancel') }}</button>
            <button type="button" (click)="confirmLogout()" class="danger-button">{{ i18n.text('Log out') }}</button>
          </div>
        </section>
      </div>
    }

    <app-loading-modal
      [open]="isUploadingAvatar()"
      title="Uploading photo"
      message="Saving your new profile image"
    />
  `,
  styles: [`
    .icon-button {
      width: 40px;
      height: 40px;
      border-radius: 999px;
      background: var(--color-theme-surface);
      border: 1px solid var(--color-theme-border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-on-surface);
    }
    .profile-label {
      color: var(--color-on-surface-variant);
      font: 700 11px/14px var(--font-app);
      text-transform: uppercase;
    }
    .profile-input {
      width: 100%;
      min-height: 48px;
      border: 1px solid var(--color-theme-border);
      background: var(--color-surface-container-lowest);
      border-radius: 16px;
      color: var(--color-on-surface);
      padding: 0 14px;
      outline: none;
      font: 500 14px/18px var(--font-app);
    }
    .profile-input:focus {
      border-color: var(--color-primary);
    }
    .profile-save-button,
    .secondary-button,
    .danger-button {
      min-height: 52px;
      border: none;
      border-radius: 999px;
      font: 800 15px/18px var(--font-app);
    }
    .profile-save-button {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }
    .secondary-button {
      background: var(--color-surface-container-high);
      color: var(--color-on-surface);
    }
    .danger-button {
      background: var(--color-error-container);
      color: var(--color-on-error-container);
    }
    .profile-row {
      width: 100%;
      min-height: 68px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      text-align: start;
    }
    .profile-row-icon {
      width: 40px;
      height: 40px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .profile-row-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .profile-row-title {
      color: var(--color-on-surface);
      font: 600 14px/18px var(--font-app);
    }
    .profile-row-caption {
      color: var(--color-on-surface-variant);
      font: 500 12px/16px var(--font-app);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .avatar-upload-overlay,
    .avatar-success-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: rgba(5, 10, 18, 0.66);
      backdrop-filter: blur(6px);
    }
    .avatar-upload-ring {
      position: absolute;
      inset: 12px;
      border-radius: 999px;
      background: conic-gradient(var(--color-primary), var(--color-secondary), transparent 72%);
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
      mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
      animation: avatar-upload-spin 900ms linear infinite;
    }
    .avatar-success-overlay {
      color: var(--color-theme-green);
      background: rgba(0, 244, 185, 0.18);
      animation: avatar-success-pop 420ms ease both;
    }
    @keyframes avatar-upload-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes avatar-success-pop {
      from { opacity: 0; transform: scale(0.82); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ProfileComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);

  readonly currentUser = this.auth.currentUser;
  readonly profile = signal<UserProfile | null>(this.currentUser()?.profile ?? null);
  readonly fullName = signal(this.profile()?.fullName ?? '');
  readonly editUserName = signal(this.currentUser()?.userName ?? '');
  readonly email = signal(this.profile()?.email ?? this.currentUser()?.email ?? '');
  readonly phoneNumber = signal(this.profile()?.phoneNumber ?? '');
  readonly editAvatarUrl = signal(this.profile()?.avatarUrl ?? null);
  readonly settings = signal<UserSettings>(this.profile()?.settings ?? this.defaultSettings());
  readonly editSettings = signal<UserSettings>(this.settings());
  readonly isEditOpen = signal(false);
  readonly isLogoutOpen = signal(false);
  readonly isSaving = signal(false);
  readonly isUploadingAvatar = signal(false);
  readonly avatarUploadSucceeded = signal(false);
  readonly statusMessage = signal('');
  readonly hasError = signal(false);
  readonly displayName = computed(() => this.profile()?.fullName?.trim() || this.currentUser()?.userName || this.i18n.text('User'));
  readonly userName = computed(() => this.currentUser()?.userName || this.i18n.text('user'));
  readonly avatarUrl = computed(() => this.profile()?.avatarUrl?.trim() || null);
  readonly avatarPreview = computed(() => this.editAvatarUrl()?.trim() || null);
  readonly initials = computed(() => this.initialsFor(this.displayName()));
  readonly editInitials = computed(() => this.initialsFor(this.fullName() || this.editUserName()));
  readonly isBusy = computed(() => this.isSaving() || this.isUploadingAvatar());
  readonly calendarTypeLabel = computed(() => this.calendar.calendarTypeLabel(this.calendar.normalizeCalendarType(this.settings().calendarType)));
  private avatarSuccessTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.loadProfile();
  }

  ngOnDestroy(): void {
    if (this.avatarSuccessTimer) clearTimeout(this.avatarSuccessTimer);
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  openEditProfile(): void {
    this.resetEditForm();
    this.avatarUploadSucceeded.set(false);
    this.isEditOpen.set(true);
  }

  closeEditProfile(): void {
    this.resetEditForm();
    this.isEditOpen.set(false);
  }

  async uploadAvatar(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.showStatus(this.i18n.text('Please select an image file.'), true);
      return;
    }

    this.isUploadingAvatar.set(true);
    this.avatarUploadSucceeded.set(false);
    try {
      const updatedProfile = await this.auth.uploadAvatar(file);
      this.applyProfile(updatedProfile);
      this.editAvatarUrl.set(updatedProfile.avatarUrl);
      this.showAvatarUploadSuccess();
      this.showStatus(this.i18n.text('Profile photo updated.'));
    } catch {
      this.showStatus(this.i18n.text('Could not upload profile photo.'), true);
    } finally {
      this.isUploadingAvatar.set(false);
    }
  }

  async saveProfile(): Promise<void> {
    const current = this.profile();
    if (!current || this.isBusy()) return;

    this.isSaving.set(true);
    try {
      const user = await this.auth.updateAccount({
        fullName: this.fullName().trim(),
        userName: this.editUserName().trim(),
        email: this.email().trim(),
        phoneNumber: this.phoneNumber().trim() || null,
        avatarUrl: this.editAvatarUrl(),
        settings: this.editSettings()
      });
      this.applyUser(user);
      this.isEditOpen.set(false);
      this.showStatus(this.i18n.text('Profile updated.'));
    } catch {
      this.showStatus(this.i18n.text('Could not save profile.'), true);
    } finally {
      this.isSaving.set(false);
    }
  }

  async toggleNotifications(): Promise<void> {
    await this.saveSettings({ ...this.settings(), notificationsEnabled: !this.settings().notificationsEnabled });
  }

  async cycleLanguage(): Promise<void> {
    const options = ['en', 'fa'];
    await this.saveSettings({ ...this.settings(), language: this.nextOption(options, this.settings().language) });
  }

  async toggleCalendarType(): Promise<void> {
    const current = this.calendar.normalizeCalendarType(this.settings().calendarType);
    await this.saveSettings({ ...this.settings(), calendarType: current === 'Jalali' ? 'Gregorian' : 'Jalali' });
  }

  async confirmLogout(): Promise<void> {
    this.isLogoutOpen.set(false);
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  private async loadProfile(): Promise<void> {
    try {
      this.applyProfile(await this.auth.getProfile());
      this.resetEditForm();
    } catch {
      if (!this.profile()) this.showStatus(this.i18n.text('Could not load profile.'), true);
    }
  }

  private async saveSettings(settings: UserSettings): Promise<void> {
    this.settings.set(settings);
    try {
      this.applyProfile(await this.auth.updateSettings(settings));
      this.showStatus(this.i18n.text('Settings updated.'));
    } catch {
      this.showStatus(this.i18n.text('Could not save settings.'), true);
    }
  }

  private applyProfile(profile: UserProfile): void {
    this.profile.set(profile);
    this.fullName.set(profile.fullName);
    this.email.set(profile.email ?? '');
    this.phoneNumber.set(profile.phoneNumber ?? '');
    this.editAvatarUrl.set(profile.avatarUrl);
    this.settings.set(profile.settings);
    this.editSettings.set(profile.settings);
  }

  private applyUser(user: AuthUser): void {
    this.applyProfile(user.profile);
    this.editUserName.set(user.userName);
  }

  private resetEditForm(): void {
    const profile = this.profile();
    this.fullName.set(profile?.fullName ?? '');
    this.editUserName.set(this.currentUser()?.userName ?? '');
    this.email.set(profile?.email ?? this.currentUser()?.email ?? '');
    this.phoneNumber.set(profile?.phoneNumber ?? '');
    this.editAvatarUrl.set(profile?.avatarUrl ?? null);
    this.editSettings.set(profile?.settings ?? this.settings());
  }

  private nextOption(options: string[], value: string): string {
    const index = options.indexOf(value);
    return options[(index + 1) % options.length];
  }

  private showStatus(message: string, isError = false): void {
    this.statusMessage.set(message);
    this.hasError.set(isError);
  }

  avatarHelperText(): string {
    if (this.isUploadingAvatar()) return this.i18n.text('Uploading...');
    if (this.avatarUploadSucceeded()) return this.i18n.text('Upload complete');
    return this.i18n.text('JPG, PNG, or WebP');
  }

  private showAvatarUploadSuccess(): void {
    if (this.avatarSuccessTimer) clearTimeout(this.avatarSuccessTimer);
    this.avatarUploadSucceeded.set(true);
    this.avatarSuccessTimer = setTimeout(() => this.avatarUploadSucceeded.set(false), 1400);
  }

  private initialsFor(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'U';
  }

  private defaultSettings(): UserSettings {
    return {
      notificationsEnabled: true,
      language: 'en',
      theme: 'dark',
      weekStartDay: 'Monday',
      calendarType: 'Gregorian',
      defaultReminderTime: null
    };
  }
}
