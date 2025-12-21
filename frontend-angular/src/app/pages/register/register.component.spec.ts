import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['post']);
    authSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('registers and navigates home', async () => {
    apiSpy.post.and.returnValue(of({ user: { email: 'user@test.com' }, token: 'abc' }));
    await component.submit();
    expect(authSpy.login).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('sets error on failure', async () => {
    apiSpy.post.and.returnValue(throwError(() => ({ error: { message: 'oops' } })));
    await component.submit();
    expect(component.error).toBe('oops');
    expect(component.loading).toBeFalse();
  });
});
