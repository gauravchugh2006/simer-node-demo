import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface OrderItem {
  name: string;
}

export interface OrderRecord {
  id: number | string;
  status: string;
  total_price?: number;
  totalPrice?: number;
  created_at?: string;
  createdAt?: string;
  customer_name?: string;
  customerId?: string;
  items: OrderItem[] | string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly ordersSubject = new BehaviorSubject<OrderRecord[]>([]);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly orders$ = this.ordersSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  constructor(private readonly api: ApiService) {}

  fetchOrders(enabled = true): void {
    this.errorSubject.next(null);
    if (!enabled) {
      this.ordersSubject.next([]);
      return;
    }
    this.api
      .get<OrderRecord[]>('/api/orders')
      .pipe(
        catchError((err) => {
          console.error('Failed to fetch orders', err);
          this.errorSubject.next('Unable to load orders.');
          return of([] as OrderRecord[]);
        })
      )
      .subscribe((records) => this.ordersSubject.next(records));
  }

  setOrders(next: OrderRecord[]): void {
    this.ordersSubject.next(next);
  }
}
