import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OrdersService, OrderRecord } from './orders.service';
import { ApiService } from './api.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  const mockOrders: OrderRecord[] = [{ id: 1, status: 'pending', items: [] }];

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get']);
    TestBed.configureTestingModule({
      providers: [
        OrdersService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });
    service = TestBed.inject(OrdersService);
  });

  it('fetches orders when enabled', () => {
    apiSpy.get.and.returnValue(of(mockOrders));
    service.fetchOrders(true);
    service.orders$.subscribe((orders) => expect(orders).toEqual(mockOrders));
  });

  it('skips fetch when disabled', () => {
    service.fetchOrders(false);
    service.orders$.subscribe((orders) => expect(orders).toEqual([]));
  });

  it('handles fetch errors', () => {
    apiSpy.get.and.returnValue(throwError(() => new Error('network')));
    service.fetchOrders(true);
    service.error$.subscribe((error) => expect(error).toBe('Unable to load orders.'));
  });
});
