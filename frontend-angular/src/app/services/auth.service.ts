import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AuthPayload {
  user: UserProfile;
  token: string;
}

export interface UserProfile {
  id?: number | string;
  name?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  pincode?: string;
  permanentAddress?: string;
  currentAddress?: string;
}

const storageKey = 'ccd-auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<UserProfile | null>(null);
  private readonly tokenSubject = new BehaviorSubject<string | null>(null);

  readonly user$ = this.userSubject.asObservable();
  readonly token$ = this.tokenSubject.asObservable();

  constructor() {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (stored) {
      try {
        const parsed: AuthPayload = JSON.parse(stored);
        this.userSubject.next(parsed.user);
        this.tokenSubject.next(parsed.token);
      } catch (error) {
        console.error('Failed to parse auth payload', error);
        localStorage.removeItem(storageKey);
      }
    }
  }

  get user(): UserProfile | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  login(payload: AuthPayload): void {
    this.userSubject.next(payload.user);
    this.tokenSubject.next(payload.token);
    this.persist(payload);
  }

  logout(): void {
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }

  updateProfile(updates: Partial<UserProfile>): void {
    const current = this.userSubject.value || {};
    const nextUser = { ...current, ...updates } as UserProfile;
    this.userSubject.next(nextUser);
    const token = this.tokenSubject.value;
    if (token) {
      this.persist({ user: nextUser, token });
    }
  }

  private persist(payload: AuthPayload): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }
  }
}
