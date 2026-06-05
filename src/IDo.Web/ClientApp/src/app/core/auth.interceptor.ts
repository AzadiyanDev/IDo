import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const AUTH_ENTRYPOINTS = ['/api/auth/login', '/api/auth/register'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && shouldEndSession(request.url)) {
        auth.clearLocalSession();
        if (!router.url.startsWith('/login')) {
          void router.navigateByUrl('/login');
        }
      }

      return throwError(() => error);
    })
  );
};

function shouldEndSession(url: string): boolean {
  if (!url.startsWith('/api/')) return false;
  return !AUTH_ENTRYPOINTS.some(entrypoint => url.startsWith(entrypoint));
}
