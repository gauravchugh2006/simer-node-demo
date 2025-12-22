import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  const authSpy = jasmine.createSpyObj('AuthService', ['logout'], { user: null });
  const cartSpy = jasmine.createSpyObj('CartService', [], { cartItems: [] });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppComponent, NavbarComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: CartService, useValue: cartSpy }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('renders root shell', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).not.toBeNull();
    expect(fixture.componentInstance.currentYear).toBe(new Date().getFullYear());
  });
});
