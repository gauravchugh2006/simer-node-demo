import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let component: NavbarComponent;
  let authSpy: jasmine.SpyObj<AuthService>;
  let cartSpy: jasmine.SpyObj<CartService>;
  let router: Router;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      user: { firstName: 'Test', lastName: 'User', email: 'user@test.com' }
    });
    cartSpy = jasmine.createSpyObj('CartService', [], { cartItems: [{ id: '1', name: 'Latte', price: 4, quantity: 2 }] });

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NavbarComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: CartService, useValue: cartSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate');

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('computes display name and cart count', () => {
    expect(component.displayName).toContain('Test User');
    expect(component.cartCount).toBe(2);
  });

  it('generates account link when authenticated', () => {
    expect(component.links.some((link) => link.to === '/account')).toBeTrue();
  });

  it('toggles menu open state', () => {
    component.toggleOpen();
    expect(component.open).toBeTrue();
  });

  it('logs out and navigates home', () => {
    component.logout();
    expect(authSpy.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
    expect(component.open).toBeFalse();
  });
});
