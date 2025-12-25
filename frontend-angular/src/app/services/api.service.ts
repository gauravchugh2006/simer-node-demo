import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = this.resolveBaseUrl();

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params });
  }

  post<T>(path: string, body: unknown, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, { headers });
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body);
  }

  private resolveBaseUrl(): string {
    const globalBase = (globalThis as { API_BASE_URL?: string }).API_BASE_URL;
    if (globalBase) {
      return globalBase;
    }

    if (typeof window !== 'undefined') {
      const explicit = (window as { __env?: { API_BASE_URL?: string } }).__env?.API_BASE_URL;
      if (explicit) {
        console.info('[ApiService] Using explicit window.__env.API_BASE_URL', explicit);
        return explicit;
      }

      const { protocol, hostname } = window.location;
      const apiPort = (window as { __env?: { API_PORT?: string } }).__env?.API_PORT || '4000';
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.info('[ApiService] Detected local environment; using port', apiPort);
        return `${protocol}//${hostname}:${apiPort}`;
      }

      const resolved = `${protocol}//${hostname}${apiPort ? `:${apiPort}` : ''}`;
      console.info('[ApiService] Resolved API base URL from window.location', resolved);
      return resolved;
    }

    const fallback = 'http://localhost:4000';
    console.warn('[ApiService] window is undefined; defaulting API base URL to', fallback);
    return fallback;
  }
}
