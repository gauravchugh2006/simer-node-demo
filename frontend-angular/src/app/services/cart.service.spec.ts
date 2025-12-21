import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CartService, CartItem } from './cart.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

describe('CartService', () => {
  let service: CartService;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const sampleItem: CartItem = { id: 'latte', name: 'Latte', price: 4.5, quantity: 1 };

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['post']);
    authSpy = jasmine.createSpyObj('AuthService', [], { token: 'token-123' });
    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });
    localStorage.clear();
    service = TestBed.inject(CartService);
  });

  it('adds, updates, and removes items', () => {
    service.addToCart(sampleItem);
    expect(service.cartItems.length).toBe(1);
    service.updateQuantity(sampleItem.id, 3);
    expect(service.cartItems[0].quantity).toBe(3);
    service.removeFromCart(sampleItem.id);
    expect(service.cartItems.length).toBe(0);
  });

  it('calculates cart total', () => {
    service.addToCart(sampleItem);
    service.addToCart(sampleItem);
    expect(service.cartTotal).toBeCloseTo(9.0);
  });

  it('clears cart on successful checkout', async () => {
    apiSpy.post.and.returnValue(of({ id: 1 }));
    service.addToCart(sampleItem);
    await service.checkout();
    expect(apiSpy.post).toHaveBeenCalled();
    expect(service.cartItems.length).toBe(0);
  });

  it('throws when not authenticated', async () => {
    Object.defineProperty(authSpy, 'token', { value: null });
    await expectAsync(service.checkout()).toBeRejectedWithError('AUTH_REQUIRED');
  });

  it('throws when cart is empty', async () => {
    await expectAsync(service.checkout()).toBeRejectedWithError('CART_EMPTY');
  });

  it('surfaces API errors during checkout', async () => {
    service.addToCart(sampleItem);
    apiSpy.post.and.returnValue(throwError(() => new Error('fail')));
    await expectAsync(service.checkout()).toBeRejected();
  });
});
