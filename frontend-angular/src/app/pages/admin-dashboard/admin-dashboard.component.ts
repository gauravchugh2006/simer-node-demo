import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { OrdersService, OrderRecord } from '../../services/orders.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly ordersService = inject(OrdersService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  orders: OrderRecord[] = [];
  loading = false;
  error: string | null = null;
  updatingId: number | string | null = null;
  readonly orderStatuses = ['placed', 'preparing', 'ready', 'completed', 'cancelled'];

  ngOnInit(): void {
    if (!this.auth.user) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.auth.user.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    this.loading = true;
    this.ordersService.orders$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((records) => {
        this.orders = records;
        this.loading = false;
      });
    this.ordersService.error$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => (this.error = message));
    this.ordersService.fetchOrders(Boolean(this.auth.token));
  }

  async updateStatus(orderId: number | string, status: string): Promise<void> {
    this.updatingId = orderId;
    try {
      const updated = await firstValueFrom(
        this.api.patch<OrderRecord>(`/api/orders/${orderId}/status`, { status })
      );
      this.ordersService.setOrders(
        this.orders.map((order) => (order.id === orderId ? updated : order))
      );
    } catch (err: any) {
      console.error('Failed to update order', err);
      this.error = err?.error?.message || 'Unable to update order status.';
    } finally {
      this.updatingId = null;
    }
  }

  formatItems(order: OrderRecord): string {
    if (Array.isArray(order.items)) {
      return order.items.map((item) => item.name).join(', ');
    }
    try {
      const parsed = JSON.parse(order.items as unknown as string) as { name: string }[];
      return parsed.map((item) => item.name).join(', ');
    } catch {
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
