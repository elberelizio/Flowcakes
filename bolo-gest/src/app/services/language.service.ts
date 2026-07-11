import { Injectable, signal, computed } from '@angular/core';
import { PT, EN, Dict } from '../core/i18n/dictionaries';

export type Lang = 'pt' | 'en';

const STORAGE_KEY = 'chefcontrol.lang';

function readStoredLang(): Lang {
  if (typeof localStorage === 'undefined') return 'pt';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : 'pt';
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private lang = signal<Lang>(readStoredLang());

  currentLang = computed(() => this.lang());

  setLang(lang: Lang): void {
    this.lang.set(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }

  toggle(): void {
    const next = this.lang() === 'pt' ? 'en' : 'pt';
    this.setLang(next);
  }

  /** Traduz uma chave em notação de ponto (ex.: "shell.navDashboard"). */
  t(key: string): string {
    const dict: Dict = this.lang() === 'en' ? EN : PT;
    const value = key.split('.').reduce<string | Dict | undefined>(
      (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
      dict
    );
    return typeof value === 'string' ? value : key;
  }
}
