import { Injectable, signal } from '@angular/core';

interface AppVersion {
  version: string;
  builtAtUtc?: string;
}

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly storageKey = 'ido.app.version';
  private readonly pollMs = 5 * 60 * 1000;
  private started = false;

  readonly updateAvailable = signal(false);
  readonly latestVersion = signal<string | null>(null);

  start(): void {
    if (this.started) return;
    this.started = true;

    void this.checkForUpdate(false);
    window.setInterval(() => void this.checkForUpdate(false), this.pollMs);
    window.addEventListener('focus', () => void this.checkForUpdate(false));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        void this.checkForUpdate(false);
      });
    }
  }

  async applyUpdate(): Promise<void> {
    const version = this.latestVersion();
    if (version) localStorage.setItem(this.storageKey, version);

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }

    window.location.reload();
  }

  private async checkForUpdate(showOnFirstVersion: boolean): Promise<void> {
    try {
      const response = await fetch(`/version.json?v=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) return;

      const serverVersion = await response.json() as AppVersion;
      if (!serverVersion.version) return;

      const currentVersion = localStorage.getItem(this.storageKey);
      this.latestVersion.set(serverVersion.version);

      if (!currentVersion) {
        localStorage.setItem(this.storageKey, serverVersion.version);
        this.updateAvailable.set(showOnFirstVersion);
        return;
      }

      this.updateAvailable.set(currentVersion !== serverVersion.version);
    } catch {
      // Version checks must never interrupt normal app usage.
    }
  }
}
