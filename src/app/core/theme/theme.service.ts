import { computed, effect, Service, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'fintrack-theme';

@Service()
export class ThemeService {
  private readonly _theme = signal<Theme>(this.readInitialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    // Runs on every theme change, including the very first one, so the `dark`
    // class (shared by Material's theme and Tailwind's `dark:` variant) is
    // applied before the user ever sees a flash of the wrong theme.
    effect(() => {
      const theme = this._theme();
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem(STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this._theme.set(this._theme() === 'dark' ? 'light' : 'dark');
  }

  private readInitialTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
