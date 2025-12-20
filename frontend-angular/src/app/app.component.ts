import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <div class="app-shell flex min-h-screen flex-col">
      <app-navbar></app-navbar>
      <router-outlet></router-outlet>
      <footer class="app-footer mt-auto py-8">
        <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {{ currentYear }} Cafe Coffee Day. All rights reserved.</p>
          <p>Crafted with ☕ and code.</p>
        </div>
      </footer>
    </div>
  `
})
export class AppComponent {
  readonly currentYear = new Date().getFullYear();
}
