import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

interface LogPayload {
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
  message: string;
}

const startLog = (payload: LogPayload): void => {
  console.info('[HTTP] →', payload.method, payload.url, payload.message);
};

const finishLog = (payload: LogPayload): void => {
  console.info('[HTTP] ←', payload.method, payload.url, payload.status ?? '—', `${payload.durationMs}ms`, payload.message);
};

const errorLog = (payload: LogPayload, error: unknown): void => {
  console.error('[HTTP] ✕', payload.method, payload.url, payload.status ?? '—', `${payload.durationMs}ms`, payload.message, error);
};

export const loggingInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const startedAt = performance.now();
  const requestLabel = {
    method: req.method,
    url: req.urlWithParams,
    message: auth.user ? `user=${auth.user.email || auth.user.name || auth.user.id || 'unknown'}` : 'unauthenticated'
  };

  startLog(requestLabel);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          finishLog({
            ...requestLabel,
            status: event.status,
            durationMs: Math.round(performance.now() - startedAt)
          });
        }
      },
      error: (error) => {
        errorLog(
          {
            ...requestLabel,
            status: error?.status,
            durationMs: Math.round(performance.now() - startedAt)
          },
          error
        );
      }
    })
  );
};
