import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['post']);
    authSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, LoginComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('submits and stores auth payload', async () => {
    apiSpy.post.and.returnValue(of({ user: { email: 'user@test.com' }, token: 'abc' }));
    await component.submit();
    expect(authSpy.login).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
    expect(component.error).toBeNull();
  });

  it('captures errors from API', async () => {
    apiSpy.post.and.returnValue(throwError(() => ({ error: { message: 'bad' } })));
    await component.submit();
    expect(component.error).toBe('bad');
    expect(component.loading).toBeFalse();
  });
});
