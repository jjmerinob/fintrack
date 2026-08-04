import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
  });

  it('should default to light when there is no stored preference and the OS prefers light', () => {
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);
  });

  it('should default to dark when the OS prefers dark and nothing is stored', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
  });

  it('should prefer a previously stored theme over the OS preference', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    localStorage.setItem('fintrack-theme', 'light');

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
  });

  it('should toggle between light and dark', () => {
    const service = TestBed.inject(ThemeService);

    service.toggle();
    expect(service.theme()).toBe('dark');

    service.toggle();
    expect(service.theme()).toBe('light');
  });

  it('should apply the dark class to <html> and persist the choice when switching to dark', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    service.toggle();
    TestBed.flushEffects();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('fintrack-theme')).toBe('dark');
  });
});
