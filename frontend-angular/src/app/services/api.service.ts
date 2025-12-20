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
        return explicit;
      }

      const { protocol, hostname } = window.location;
      const apiPort = (window as { __env?: { API_PORT?: string } }).__env?.API_PORT || '4000';
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:${apiPort}`;
      }

      return `${protocol}//${hostname}${apiPort ? `:${apiPort}` : ''}`;
    }

    return 'http://localhost:4000';
  }
}
