import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

const storageKey = 'ccd-cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.readFromStorage());
  readonly cartItems$ = this.itemsSubject.asObservable();

  constructor(private readonly api: ApiService, private readonly auth: AuthService) {
    this.itemsSubject.subscribe((items) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(items));
      }
    });
  }

  get cartItems(): CartItem[] {
    return this.itemsSubject.value;
  }

  get cartTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  addToCart(item: Omit<CartItem, 'quantity'>): void {
    this.itemsSubject.next(
      this.cartItems.some((entry) => entry.id === item.id)
        ? this.cartItems.map((entry) =>
            entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
          )
        : [...this.cartItems, { ...item, quantity: 1 }]
    );
  }

  updateQuantity(id: string, quantity: number): void {
    const normalized = Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : 1;
    this.itemsSubject.next(
      this.cartItems
        .map((item) => (item.id === id ? { ...item, quantity: normalized } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  removeFromCart(id: string): void {
    this.itemsSubject.next(this.cartItems.filter((item) => item.id !== id));
  }

  clear(): void {
    this.itemsSubject.next([]);
  }

  async checkout(): Promise<unknown> {
    if (!this.auth.token) {
      throw new Error('AUTH_REQUIRED');
    }
    if (this.cartItems.length === 0) {
      throw new Error('CART_EMPTY');
    }

    const formatted = this.cartItems.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({ name: item.name }))
    );
    const payload = {
      items: formatted,
      totalPrice: Number(this.cartTotal.toFixed(2))
    };

    const response = await firstValueFrom(this.api.post('/api/orders', payload));
    this.clear();
    return response;
  }

  private readFromStorage(): CartItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed as CartItem[];
        }
      }
    } catch (error) {
      console.warn('Failed to parse cart storage', error);
    }
    return [];
  }
}
