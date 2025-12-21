import api from '../services/api.js';

describe('API client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('attaches auth token from storage', async () => {
    localStorage.setItem('ccd-auth', JSON.stringify({ token: 'abc', user: { email: 'u@test.com' } }));
    const handler = api.interceptors.request.handlers[0].fulfilled;
    const config = await handler({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer abc');
  });

  it('resolves a default base URL', () => {
    expect(api.defaults.baseURL).toContain('http');
  });
});
