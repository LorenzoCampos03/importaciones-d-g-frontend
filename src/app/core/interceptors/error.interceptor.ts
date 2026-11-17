import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // No cerrar sesión para endpoints de reportes
      const isReportEndpoint = req.url.includes('/reports/');

      if (
        (error.status === 0 ||
          error.status === 503 ||
          error.status === 502 ||
          error.status === 504 ||
          !navigator.onLine) &&
        !isReportEndpoint
      ) {
        authService.logout();

        sessionStorage.clear();

        router.navigate(['/login']).then(() => {
          let message = 'No se pudo conectar con el servidor. Tu sesión ha sido cerrada.';

          if (!navigator.onLine) {
            message = 'Sin conexión a internet. Tu sesión ha sido cerrada.';
          } else if (error.status === 0) {
            message = 'El servidor no está disponible. Tu sesión ha sido cerrada.';
          }

          notificationService.error(message, 7000);
        });
        return throwError(() => new Error('Error de conexión con el servidor.'));
      }

      // Para endpoints de reportes, solo devolver el error sin cerrar sesión
      if (isReportEndpoint && (error.status === 0 || error.status >= 500)) {
        return throwError(() => new Error('Error al generar el reporte. El servidor puede estar temporalmente no disponible.'));
      }

      let errorMessage = '';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error del cliente: ${error.error.message}`;
      } else {
        errorMessage = `Error del servidor: ${error.status} - ${error.message}`;

        switch (error.status) {
          case 401:
            if (!req.url.includes('/login')) {
              authService.logout();
              router.navigate(['/login']);
              errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
              notificationService.warning(errorMessage, 5000);
            } else {
              errorMessage = 'Credenciales incorrectas.';
            }
            break;
          case 403:
            errorMessage = 'Acceso denegado. No tienes permisos para este recurso.';
            notificationService.error(errorMessage, 5000);
            break;
          case 404:
            errorMessage = 'Recurso no encontrado.';
            notificationService.error(errorMessage, 5000);
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intente más tarde.';
            notificationService.error(errorMessage, 5000);
            break;
          default:
            errorMessage = `Error: ${error.status} - ${error.statusText}`;
        }
      }

      console.error('Error interceptado:', errorMessage);
      return throwError(() => new Error(errorMessage));
    })
  );
};
