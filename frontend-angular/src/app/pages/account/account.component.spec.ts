import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AccountComponent } from './account.component';
import { AuthService } from '../../services/auth.service';

describe('AccountComponent', () => {
  let fixture: ComponentFixture<AccountComponent>;
  let component: AccountComponent;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['updateProfile'], {
      user: { email: 'user@test.com', firstName: 'Test', lastName: 'User' }
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AccountComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('hydrates form with user details', () => {
    expect(component.form.email).toBe('user@test.com');
    expect(component.displayName).toContain('Test');
  });

  it('saves profile updates', () => {
    component.form.firstName = 'Updated';
    component.save();
    expect(authSpy.updateProfile).toHaveBeenCalled();
    expect(component.status).toContain('saved successfully');
  });

  it('redirects to login when user is missing', () => {
    Object.defineProperty(authSpy, 'user', { value: null });
    component.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
