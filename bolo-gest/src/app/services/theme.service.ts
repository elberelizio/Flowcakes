import { Injectable, signal, computed } from '@angular/core';

/** Dark mode desativado: mantém-se apenas `'light'`. */
export type Theme = 'light'; // | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme = signal<Theme>('light');
  // private theme = signal<Theme>(this.loadTheme());

  /** Sempre falso — alternância escura desligada. */
  isDark = computed(() => false);
  // isDark = computed(() => this.theme() === 'dark');

  isLight = computed(() => true);
  // isLight = computed(() => this.theme() === 'light');

  /*
  private loadTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  */

  setTheme(_theme: Theme): void {
    this.theme.set('light');
    document.documentElement.setAttribute('data-theme', 'light');
    /*
    this.theme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    */
  }

  toggle(): void {
    /* Dark mode desativado — não alterna.
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
    */
  }

  init(): void {
    document.documentElement.setAttribute('data-theme', 'light');
    // document.documentElement.setAttribute('data-theme', this.theme());
  }
}
