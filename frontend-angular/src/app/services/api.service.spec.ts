import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('uses base URL for GET requests', () => {
    service.get('/api/test').subscribe();
    const req = httpMock.expectOne('http://localhost:4000/api/test');
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  it('posts data to composed URL', () => {
    service.post('/api/post', { name: 'latte' }).subscribe();
    const req = httpMock.expectOne('http://localhost:4000/api/post');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'latte' });
    req.flush({ ok: true });
  });
});
