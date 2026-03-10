import { Injectable, signal, computed } from '@angular/core';

export type Lang = 'pt' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private lang = signal<Lang>('pt');

  currentLang = computed(() => this.lang());

  /** Idioma em memória apenas. Nada é guardado no browser. */
  setLang(lang: Lang): void {
    this.lang.set(lang);
  }

  toggle(): void {
    const next = this.lang() === 'pt' ? 'en' : 'pt';
    this.setLang(next);
  }
}
