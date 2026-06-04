import { Injectable, signal } from '@angular/core';

type InstallOutcome = 'accepted' | 'dismissed';
type PwaInstallResult = 'accepted' | 'dismissed' | 'installed' | 'ios' | 'unavailable';

interface BeforeInstallPromptChoice {
  outcome: InstallOutcome;
  platform: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<BeforeInstallPromptChoice>;
}

interface StandaloneNavigator extends Navigator {
  standalone?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  readonly canPrompt = signal(false);
  readonly isPrompting = signal(false);
  readonly isIos = signal(this.detectIos());
  readonly isInstalled = signal(this.detectInstalled());

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canPrompt.set(!this.isInstalled());
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canPrompt.set(false);
      this.isInstalled.set(true);
    });

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const syncInstalled = () => this.isInstalled.set(this.detectInstalled());
    standaloneQuery.addEventListener('change', syncInstalled);
  }

  async install(): Promise<PwaInstallResult> {
    if (this.isInstalled()) return 'installed';

    const prompt = this.deferredPrompt;
    if (prompt) {
      this.isPrompting.set(true);
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        this.deferredPrompt = null;
        this.canPrompt.set(false);
        if (choice.outcome === 'accepted') {
          this.isInstalled.set(true);
          return 'accepted';
        }

        return 'dismissed';
      } catch {
        return 'unavailable';
      } finally {
        this.isPrompting.set(false);
      }
    }

    return this.isIos() ? 'ios' : 'unavailable';
  }

  private detectInstalled(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as StandaloneNavigator).standalone === true;
  }

  private detectIos(): boolean {
    if (typeof navigator === 'undefined') return false;
    const platform = navigator.platform || '';
    const userAgent = navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
}
