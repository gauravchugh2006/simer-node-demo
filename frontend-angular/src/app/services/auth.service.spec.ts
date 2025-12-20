import { AuthService, AuthPayload } from './auth.service';

describe('AuthService', () => {
  const storageKey = 'ccd-auth';

  beforeEach(() => {
    localStorage.clear();
  });

  it('loads stored auth payload on init', () => {
    const payload: AuthPayload = { user: { id: 1, email: 'user@test.com' }, token: 'abc' };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    const service = new AuthService();
    expect(service.user?.email).toBe('user@test.com');
    expect(service.token).toBe('abc');
  });

  it('persists login payload and exposes observables', (done) => {
    const service = new AuthService();
    const payload: AuthPayload = { user: { id: 2, email: 'new@test.com' }, token: 'xyz' };
    service.login(payload);
    expect(localStorage.getItem(storageKey)).toContain('new@test.com');
    service.user$.subscribe((user) => {
      if (user) {
        expect(user.email).toBe('new@test.com');
        done();
      }
    });
  });

  it('clears state on logout', () => {
    const service = new AuthService();
    service.login({ user: { email: 'clear@test.com' }, token: 'token' });
    service.logout();
    expect(service.user).toBeNull();
    expect(service.token).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('merges updates when updating profile', () => {
    const service = new AuthService();
    service.login({ user: { email: 'merge@test.com', firstName: 'Old' }, token: 't1' });
    service.updateProfile({ firstName: 'New', city: 'NYC' });
    expect(service.user?.firstName).toBe('New');
    expect(service.user?.city).toBe('NYC');
  });
});
