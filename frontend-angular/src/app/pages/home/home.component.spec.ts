/// <reference types="jasmine" />
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { CartItem, CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let cartService: jasmine.SpyObj<CartService>;
  let authService: jasmine.SpyObj<AuthService>;
  let apiService: jasmine.SpyObj<ApiService>;
  let router: jasmine.SpyObj<Router>;

  const product = { id: 'p1', name: 'Latte', description: '', price: 4 };

  beforeEach(async () => {
    cartService = jasmine.createSpyObj<CartService>('CartService', [
      'addToCart',
      'checkout',
      'updateQuantity',
      'removeFromCart'
    ], { cartItems: [] as CartItem[], cartTotal: 0 });
    authService = jasmine.createSpyObj<AuthService>('AuthService', [], { token: 'token' });
    apiService = jasmine.createSpyObj<ApiService>('ApiService', ['post']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule],
      providers: [
        { provide: CartService, useValue: cartService },
        { provide: AuthService, useValue: authService },
        { provide: ApiService, useValue: apiService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('adds items to cart and shows feedback', () => {
    component.addToCart(product);
    expect(cartService.addToCart).toHaveBeenCalledWith(product);
    expect(component.feedback?.message).toContain('was added');
  });

  it('navigates to login when not authenticated on buy now', async () => {
    Object.defineProperty(authService, 'token', { value: null });
    await component.buyNow(product);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('submits buy now when authenticated', async () => {
    apiService.post.and.returnValue(of({}));
    await component.buyNow(product);
    expect(apiService.post).toHaveBeenCalled();
    expect(component.feedback?.type).toBe('success');
  });

  it('handles buy now errors gracefully', async () => {
    apiService.post.and.returnValue(throwError(() => new Error('fail')));
    await component.buyNow(product);
    expect(component.feedback?.type).toBe('error');
  });

  it('prevents checkout when cart empty', async () => {
    spyOnProperty(cartService, 'cartItems', 'get').and.returnValue([]);
    await component.checkout();
    expect(component.feedback?.type).toBe('info');
  });

  it('delegates checkout when items exist', async () => {
    spyOnProperty(cartService, 'cartItems', 'get').and.returnValue([
      { ...product, quantity: 1, id: 'p1' }
    ]);

    cartService.checkout.and.resolveTo({});
    await component.checkout();
    expect(cartService.checkout).toHaveBeenCalled();
  });
});
