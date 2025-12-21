import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  function setup(token: string | null) {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { token } },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    if (httpMock) httpMock.verify();
  });

  it('appends Authorization header when token exists', () => {
    setup('token');

    http.get('/secure').subscribe();

    const req = httpMock.expectOne('/secure');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token');

    req.flush({});
  });

  it('does not append Authorization header when token missing', () => {
    setup(null);

    http.get('/secure').subscribe();

    const req = httpMock.expectOne('/secure');
    expect(req.request.headers.has('Authorization')).toBeFalse();

    req.flush({});
  });
});
