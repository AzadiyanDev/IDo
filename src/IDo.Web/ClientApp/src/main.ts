import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';

const recoveryStorageKey = 'ido.boot.recovered';

registerStartupRecovery();

bootstrapApplication(App, appConfig)
  .then(() => {
    clearRecoveryMarker();
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' })
          .then((registration) => registration.update())
          .catch((err) => console.error(err));
      });
    }
  })
  .catch((err) => console.error(err));

function registerStartupRecovery(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    const target = event.target as HTMLElement | null;
    const isAssetError = target?.tagName === 'SCRIPT' || target?.tagName === 'LINK';
    if (isAssetError || isRecoverableLoadError(event.message)) {
      void recoverFromStaleInstall();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isRecoverableLoadError(event.reason)) {
      void recoverFromStaleInstall();
    }
  });
}

function isRecoverableLoadError(value: unknown): boolean {
  const message = value instanceof Error ? value.message : `${value ?? ''}`;
  return /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch/i.test(message);
}

async function recoverFromStaleInstall(): Promise<void> {
  if (hasRecoveryMarker()) return;
  setRecoveryMarker();

  try {
    if ('caches' in window) {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } finally {
    window.location.reload();
  }
}

function hasRecoveryMarker(): boolean {
  try {
    return sessionStorage.getItem(recoveryStorageKey) === '1';
  } catch {
    return true;
  }
}

function setRecoveryMarker(): void {
  try {
    sessionStorage.setItem(recoveryStorageKey, '1');
  } catch {
    // Session storage can be unavailable in restricted browser contexts.
  }
}

function clearRecoveryMarker(): void {
  try {
    sessionStorage.removeItem(recoveryStorageKey);
  } catch {
    // Session storage can be unavailable in restricted browser contexts.
  }
}
