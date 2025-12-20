import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-theme', '');
  });

  it('applies stored theme if present', () => {
    localStorage.setItem('ccd-theme', 'dark');
    const service = new ThemeService();
    expect(service.activeTheme.id).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('changes theme and persists', () => {
    const service = new ThemeService();
    service.setTheme('ambient');
    expect(service.activeTheme.id).toBe('ambient');
    expect(localStorage.getItem('ccd-theme')).toBe('ambient');
    expect(document.documentElement.getAttribute('data-theme')).toBe('ambient');
  });
});
