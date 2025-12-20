import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OrdersComponent } from './orders.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { OrdersService, OrderRecord } from '../../services/orders.service';
import { Router } from '@angular/router';

describe('OrdersComponent', () => {
  let fixture: ComponentFixture<OrdersComponent>;
  let component: OrdersComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let ordersSpy: jasmine.SpyObj<OrdersService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const order: OrderRecord = { id: 1, status: 'pending', items: [{ name: 'Latte' }], total_price: 5 };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['post']);
    authSpy = jasmine.createSpyObj('AuthService', [], { token: 'token' });
    ordersSpy = jasmine.createSpyObj('OrdersService', ['fetchOrders', 'setOrders'], {
      orders$: of([order]),
      error$: of(null)
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: OrdersService, useValue: ordersSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initialises orders when authenticated', () => {
    expect(component.orders.length).toBe(1);
    expect(ordersSpy.fetchOrders).toHaveBeenCalled();
  });

  it('formats items from array or JSON', () => {
    expect(component.formatItems(order)).toContain('Latte');
    const jsonOrder: OrderRecord = { ...order, items: JSON.stringify([{ name: 'Mocha' }]) };
    expect(component.formatItems(jsonOrder)).toContain('Mocha');
  });

  it('submits orders and prepends record', async () => {
    apiSpy.post.and.returnValue(of(order));
    component.items = 'Latte';
    component.totalPrice = '5';
    await component.submitOrder();
    expect(ordersSpy.setOrders).toHaveBeenCalled();
    expect(component.feedback?.type).toBe('success');
  });

  it('handles submit errors gracefully', async () => {
    apiSpy.post.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
    await component.submitOrder();
    expect(component.feedback?.type).toBe('error');
  });

  it('redirects to login when unauthenticated', () => {
    Object.defineProperty(authSpy, 'token', { value: null });
    component.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
