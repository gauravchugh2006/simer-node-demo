import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ThemeOption {
  id: 'light' | 'dark' | 'ambient';
  name: string;
  description: string;
}

const storageKey = 'ccd-theme';

const themeOptions: ThemeOption[] = [
  { id: 'light', name: 'Light', description: 'Airy whites with warm cafe hues' },
  { id: 'dark', name: 'Dark', description: 'Moody blues with luminous highlights' },
  { id: 'ambient', name: 'Ambient', description: 'Dreamy purples with mint undertones' }
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeSubject = new BehaviorSubject<ThemeOption>(this.readInitialTheme());
  readonly theme$ = this.themeSubject.asObservable();
  readonly themes = themeOptions;

  constructor() {
    this.applyTheme(this.themeSubject.value.id);
    this.theme$.subscribe((theme) => this.applyTheme(theme.id));
  }

  setTheme(id: ThemeOption['id']): void {
    const next = themeOptions.find((theme) => theme.id === id) || themeOptions[0];
    this.themeSubject.next(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, next.id);
    }
  }

  get activeTheme(): ThemeOption {
    return this.themeSubject.value;
  }

  private applyTheme(id: ThemeOption['id']): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', id);
    }
  }

  private readInitialTheme(): ThemeOption {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (stored) {
      const found = themeOptions.find((theme) => theme.id === stored as ThemeOption['id']);
      if (found) {
        return found;
      }
    }
    return themeOptions[0];
  }
}
