import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SnowfallComponent } from '../../components/snowfall/snowfall.component';
import { CartService, CartItem } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

interface FeedbackState {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, SnowfallComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  private readonly cartService = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  featuredProducts: Product[] = [
    {
      id: 'signature-latte',
      name: 'Signature Latte',
      description: 'Velvety espresso balanced with caramel drizzle and a hint of cinnamon.',
      price: 4.9
    },
    {
      id: 'cocoa-mocha',
      name: 'Cocoa Mocha Bliss',
      description: 'Dark chocolate, frothy milk and espresso shot.',
      price: 5.2
    },
    {
      id: 'cold-brew',
      name: 'Cold Brew Tonic',
      description: 'Slow steeped cold brew poured over artisanal tonic and citrus peel.',
      price: 5.8
    }
  ];

  feedback: FeedbackState | null = null;
  processingId: string | null = null;
  processingCheckout = false;

  get cartItems(): CartItem[] {
    return this.cartService.cartItems;
  }

  get cartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get cartTotal(): number {
    return this.cartService.cartTotal;
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
    this.showFeedback('info', `${product.name} was added to your cart.`);
  }

  async buyNow(product: Product): Promise<void> {
    if (!this.auth.token) {
      await this.router.navigate(['/login']);
      return;
    }
    this.processingId = product.id;
    try {
      await firstValueFrom(
        this.api.post('/api/orders', {
          items: [{ name: product.name }],
          totalPrice: Number(product.price.toFixed(2))
        })
      );
      this.showFeedback('success', `${product.name} is now being prepared!`);
    } catch (error: any) {
      console.error('Buy now failed', error);
      this.showFeedback('error', error?.error?.message || 'Unable to place order right now.');
    } finally {
      this.processingId = null;
    }
  }

  async checkout(): Promise<void> {
    if (!this.auth.token) {
      await this.router.navigate(['/login']);
      return;
    }
    if (this.cartItems.length === 0) {
      this.showFeedback('info', 'Add a beverage to your cart to get started.');
      return;
    }

    this.processingCheckout = true;
    try {
      await this.cartService.checkout();
      this.showFeedback('success', 'Your order is on the bar!');
    } catch (error: any) {
      console.error('Checkout failed', error);
      if (error?.message === 'AUTH_REQUIRED') {
        await this.router.navigate(['/login']);
      } else {
        this.showFeedback('error', error?.error?.message || 'Unable to submit your order.');
      }
    } finally {
      this.processingCheckout = false;
    }
  }

  updateQuantity(id: string, quantity: number): void {
    this.cartService.updateQuantity(id, quantity);
  }

  removeFromCart(id: string): void {
    this.cartService.removeFromCart(id);
  }

  private showFeedback(type: FeedbackState['type'], message: string): void {
    this.feedback = { type, message };
    setTimeout(() => (this.feedback = null), 4000);
  }
}
