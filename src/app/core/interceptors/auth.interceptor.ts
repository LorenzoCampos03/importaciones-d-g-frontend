import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authToken = authService.getAuthToken();

  const isAuthEndpoint =
    req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh');

  let authReq = req;
  if (authToken && !isAuthEndpoint) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint && authService.isAuthenticated()) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            const newToken = authService.getAuthToken();
            const retryReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newToken}`)
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
