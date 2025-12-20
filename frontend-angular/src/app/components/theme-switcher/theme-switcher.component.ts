import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-switcher.component.html'
})
export class ThemeSwitcherComponent {
  readonly themeService = inject(ThemeService);
  open = false;

  toggle(): void {
    this.open = !this.open;
  }

  selectTheme(id: 'light' | 'dark' | 'ambient'): void {
    this.themeService.setTheme(id);
    this.open = false;
  }
}
