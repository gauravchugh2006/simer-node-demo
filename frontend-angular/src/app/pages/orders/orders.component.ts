import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { OrdersService, OrderRecord } from '../../services/orders.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef = inject(DestroyRef);

  items = '';
  totalPrice = '';
  feedback: { type: 'success' | 'error'; message: string } | null = null;
  loading = false;
  error: string | null = null;
  orders: OrderRecord[] = [];
  ordersLoading = false;

  ngOnInit(): void {
    if (!this.auth.token) {
      this.router.navigate(['/login']);
      return;
    }

    this.ordersLoading = true;
    this.ordersService.orders$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((records) => {
      this.orders = records;
      this.ordersLoading = false;
    });
    this.ordersService.error$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message) => {
      this.error = message;
    });
    this.ordersService.fetchOrders(Boolean(this.auth.token));
  }

  async submitOrder(): Promise<void> {
    this.feedback = null;
    this.loading = true;
    try {
      const parsed = this.items
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
      const created = await firstValueFrom(
        this.api.post<OrderRecord>('/api/orders', {
          items: parsed,
          totalPrice: Number(this.totalPrice)
        })
      );
      this.ordersService.setOrders([created, ...this.orders]);
      this.items = '';
      this.totalPrice = '';
      this.feedback = { type: 'success', message: 'Order placed successfully!' };
    } catch (err: any) {
      console.error('Order failed', err);
      this.feedback = { type: 'error', message: err?.error?.message || 'Unable to place order.' };
    } finally {
      this.loading = false;
    }
  }

  formatItems(order: OrderRecord): string {
    if (Array.isArray(order.items)) {
      return order.items.map((item) => item.name).join(', ');
    }
    try {
      const parsed = JSON.parse(order.items as unknown as string) as { name: string }[];
      return parsed.map((item) => item.name).join(', ');
    } catch (error) {
      return String(order.items);
    }
  }

  totalFor(order: OrderRecord): string {
    const total = Number(order.total_price || order.totalPrice || 0);
    return total.toFixed(2);
  }

  createdAt(order: OrderRecord): string {
    return new Date(order.created_at || order.createdAt || '').toLocaleString();
  }
}
