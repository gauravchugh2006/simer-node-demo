import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeSwitcherComponent],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly cartService = inject(CartService);

  open = false;

  get user() {
    return this.auth.user;
  }

  get displayName(): string {
    const user = this.auth.user;
    if (!user) return '';
    const first = user.firstName || user.firstname;
    const last = user.lastName || user.lastname;
    const combined = [first, last].filter(Boolean).join(' ').trim();
    return combined || user.name || user.email?.split('@')[0] || '';
  }

  get cartCount(): number {
    return this.cartService.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get links() {
    const base = [
      { to: '/', label: 'Home' },
      { to: '/menu', label: 'Menu' },
      { to: '/orders', label: 'My Orders' },
      { to: '/contact', label: 'Contact' }
    ];
    return this.user ? [...base, { to: '/account', label: 'Account' }] : base;
  }

  toggleOpen(): void {
    this.open = !this.open;
  }

  logout(): void {
    this.auth.logout();
    this.open = false;
    this.router.navigate(['/']);
  }
}
