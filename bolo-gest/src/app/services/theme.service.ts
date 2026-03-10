import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme = signal<Theme>(this.loadTheme());

  isDark = computed(() => this.theme() === 'dark');
  isLight = computed(() => this.theme() === 'light');

  /** Tema em memória apenas; preferência do sistema se não definido. Nada é guardado no browser. */
  private loadTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggle(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  init(): void {
    document.documentElement.setAttribute('data-theme', this.theme());
  }
}
