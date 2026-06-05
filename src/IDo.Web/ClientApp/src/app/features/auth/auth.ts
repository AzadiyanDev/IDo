import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n.service';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal';

@Component({
  selector: 'app-auth',
  imports: [RouterLink, LoadingModalComponent],
  template: `
    <section class="min-h-full px-margin-mobile py-xl flex flex-col justify-center gap-xl">
      <header class="flex flex-col gap-sm">
        <div class="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center">
          <span class="material-symbols-outlined text-[30px]">verified_user</span>
        </div>
        <div>
          <p class="text-label-md font-label-md text-primary uppercase m-0">{{ isRegister() ? i18n.text('Create account') : i18n.text('Welcome back') }}</p>
          <h1 class="text-display font-display text-on-surface m-0 mt-1">{{ isRegister() ? i18n.text('Sign up') : i18n.text('Log in') }}</h1>
        </div>
      </header>

      <form class="flex flex-col gap-md" (submit)="submit($event)">
        @if (isRegister()) {
          <label class="flex flex-col gap-xs">
            <span class="text-label-md font-label-md text-on-surface-variant">{{ i18n.text('Username') }}</span>
            <div class="h-12 rounded-xl bg-theme-surface border border-theme-border flex items-center gap-sm px-md focus-within:border-primary">
              <span class="material-symbols-outlined text-on-surface-variant text-[20px]">alternate_email</span>
              <input [value]="userName" (input)="userName = inputValue($event)" autocomplete="username" class="bg-transparent outline-none border-none text-on-surface w-full text-body-lg font-body-lg" required />
            </div>
          </label>

          <label class="flex flex-col gap-xs">
            <span class="text-label-md font-label-md text-on-surface-variant">{{ i18n.text('Email') }}</span>
            <div class="h-12 rounded-xl bg-theme-surface border border-theme-border flex items-center gap-sm px-md focus-within:border-primary">
              <span class="material-symbols-outlined text-on-surface-variant text-[20px]">mail</span>
              <input [value]="email" (input)="email = inputValue($event)" type="email" autocomplete="email" class="bg-transparent outline-none border-none text-on-surface w-full text-body-lg font-body-lg" required />
            </div>
          </label>
        } @else {
          <label class="flex flex-col gap-xs">
            <span class="text-label-md font-label-md text-on-surface-variant">{{ i18n.text('Username or email') }}</span>
            <div class="h-12 rounded-xl bg-theme-surface border border-theme-border flex items-center gap-sm px-md focus-within:border-primary">
              <span class="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
              <input [value]="identifier" (input)="identifier = inputValue($event)" autocomplete="username" class="bg-transparent outline-none border-none text-on-surface w-full text-body-lg font-body-lg" required />
            </div>
          </label>
        }

        <label class="flex flex-col gap-xs">
          <span class="text-label-md font-label-md text-on-surface-variant">{{ i18n.text('Password') }}</span>
          <div class="h-12 rounded-xl bg-theme-surface border border-theme-border flex items-center gap-sm px-md focus-within:border-primary">
            <span class="material-symbols-outlined text-on-surface-variant text-[20px]">lock</span>
            <input [value]="password" (input)="password = inputValue($event)" [type]="showPassword() ? 'text' : 'password'" [autocomplete]="isRegister() ? 'new-password' : 'current-password'" class="bg-transparent outline-none border-none text-on-surface w-full text-body-lg font-body-lg min-w-0" required />
            <button type="button" (click)="togglePasswordVisibility()" [attr.aria-label]="showPassword() ? i18n.text('Hide password') : i18n.text('Show password')" class="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 active:scale-95 transition-colors shrink-0">
              <span class="material-symbols-outlined text-[20px]">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </label>

        @if (error()) {
          <div class="rounded-xl border border-error/40 bg-error-container/30 text-on-error-container px-md py-sm text-body-md font-body-md">
            {{ error() }}
          </div>
        }

        <button type="submit" [disabled]="isSubmitting()" class="h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center gap-sm text-body-lg font-body-lg font-semibold disabled:opacity-60">
          <span class="material-symbols-outlined text-[20px]">{{ isRegister() ? 'person_add' : 'login' }}</span>
          {{ isRegister() ? i18n.text('Create account') : i18n.text('Log in') }}
        </button>
      </form>

      <footer class="text-center text-body-md font-body-md text-on-surface-variant">
        @if (isRegister()) {
          {{ i18n.text('Already have an account?') }}
          <a routerLink="/login" class="text-primary no-underline font-semibold">{{ i18n.text('Log in') }}</a>
        } @else {
          {{ i18n.text('New to IDo?') }}
          <a routerLink="/register" class="text-primary no-underline font-semibold">{{ i18n.text('Create account') }}</a>
        }
      </footer>
    </section>

    <app-loading-modal
      [open]="isSubmitting()"
      [title]="isRegister() ? i18n.text('Creating account') : i18n.text('Signing in')"
      [message]="isRegister() ? i18n.text('Setting up your IDo workspace') : i18n.text('Checking your credentials')"
    />
  `
})
export class AuthComponent implements OnDestroy {
  readonly i18n = inject(I18nService);
  isRegister = signal(false);
  isSubmitting = signal(false);
  showPassword = signal(false);
  error = signal<string | null>(null);
  userName = '';
  email = '';
  identifier = '';
  password = '';
  private readonly subscription: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService
  ) {
    this.subscription = this.route.data.subscribe(data => {
      this.isRegister.set(data['mode'] === 'register');
      this.error.set(null);
    });

    this.auth.clearLocalSession();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      if (this.isRegister()) {
        await this.auth.register(this.userName, this.email, this.password);
      } else {
        await this.auth.login(this.identifier, this.password);
      }
      await this.router.navigateByUrl('/today');
    } catch (error) {
      this.error.set(this.messageFromError(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  private messageFromError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { errors?: string[]; error?: string } | null;
      if (Array.isArray(body?.errors) && body.errors.length > 0) return body.errors.join(' ');
      if (body?.error) return body.error;
    }

    return this.i18n.text('Authentication failed.');
  }
}
