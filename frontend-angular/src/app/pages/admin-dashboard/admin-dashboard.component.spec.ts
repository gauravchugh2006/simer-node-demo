import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AuthService } from '../../services/auth.service';
import { OrdersService, OrderRecord } from '../../services/orders.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

describe('AdminDashboardComponent', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let component: AdminDashboardComponent;
  let authSpy: jasmine.SpyObj<AuthService>;
  let ordersSpy: jasmine.SpyObj<OrdersService>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const order: OrderRecord = { id: 1, status: 'placed', items: [{ name: 'Latte' }], total_price: 5 };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', [], { user: { role: 'admin' }, token: 'token' });
    ordersSpy = jasmine.createSpyObj('OrdersService', ['fetchOrders', 'setOrders'], {
      orders$: of([order]),
      error$: of(null)
    });
    apiSpy = jasmine.createSpyObj('ApiService', ['patch']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: OrdersService, useValue: ordersSpy },
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads orders on init for admin users', () => {
    expect(component.orders.length).toBe(1);
    expect(ordersSpy.fetchOrders).toHaveBeenCalled();
  });

  it('redirects when user missing', () => {
    Object.defineProperty(authSpy, 'user', { value: null });
    component.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('updates status and refreshes list', async () => {
    const updated: OrderRecord = { ...order, status: 'ready' };
    apiSpy.patch.and.returnValue(of(updated));
    await component.updateStatus(order.id, 'ready');
    expect(apiSpy.patch).toHaveBeenCalled();
    expect(ordersSpy.setOrders).toHaveBeenCalled();
  });

  it('handles update errors gracefully', async () => {
    apiSpy.patch.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
    await component.updateStatus(order.id, 'cancelled');
    expect(component.error).toBe('fail');
  });
});
