import { Injectable, inject, signal, computed, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { API_URL } from '../core/config/api.config';
import { AuthService } from './auth.service';
import { LoginPopupOrchestratorService } from './login-popup-orchestrator.service';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  audience?: string;
  createdAt: string;
  expiresAt?: string;
  maintenanceStartAt?: string;
  maintenanceEndAt?: string;
  active: boolean;
  dismissed: boolean;
  maintenancePhase?: 'scheduled' | 'active' | 'ended' | null;
}

@Injectable({ providedIn: 'root' })
export class SystemNotificationsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly sanitizer = inject(DomSanitizer);

  readonly items = signal<SystemNotification[]>([]);
  readonly loading = signal(false);
  readonly loginModalVisible = signal(false);
  readonly loginModalNotification = signal<SystemNotification | null>(null);

  readonly unreadCount = computed(() => this.items().filter((n) => !n.dismissed).length);

  /** Total de comunicados activos (sidebar e navbar). */
  readonly comunicadoCount = computed(() => this.items().length);

  /** Avisos visíveis ao utilizador (manutenção expirada já filtrada no backend). */
  readonly visibleItems = computed(() => this.items());

  /** Evita novo SafeHtml em cada change detection (congela a página com [innerHTML]). */
  private readonly messageHtmlCache = new Map<string, SafeHtml>();

  /** Só a primeira carga após login dispara a cadeia de popups. */
  private loginChainHookSent = false;

  resetForLogout(): void {
    this.loginChainHookSent = false;
    this.messageHtmlCache.clear();
    this.items.set([]);
    this.closeLoginModal();
  }

  load(opts?: { triggerLoginChain?: boolean }): void {
    if (!this.auth.isLoggedIn()) {
      this.resetForLogout();
      return;
    }
    const hookLoginChain = opts?.triggerLoginChain === true && !this.loginChainHookSent;
    this.loading.set(true);
    this.http.get<SystemNotification[]>(`${API_URL}/notifications`).subscribe({
      next: (list) => {
        this.items.set(list ?? []);
        this.messageHtmlCache.clear();
        this.loading.set(false);
        if (hookLoginChain) {
          this.loginChainHookSent = true;
          this.injector.get(LoginPopupOrchestratorService).markNotificationsReady();
        }
      },
      error: () => {
        this.items.set([]);
        this.messageHtmlCache.clear();
        this.loading.set(false);
        if (hookLoginChain) {
          this.loginChainHookSent = true;
          this.injector.get(LoginPopupOrchestratorService).markNotificationsReady();
        }
      },
    });
  }

  dismiss(id: string): void {
    this.http.post(`${API_URL}/notifications/${id}/dismiss`, {}).subscribe({
      next: () => {
        this.items.update((list) => list.map((n) => (n.id === id ? { ...n, dismissed: true } : n)));
        if (this.loginModalNotification()?.id === id) {
          this.closeLoginModal();
        }
      },
      error: () => {},
    });
  }

  /** Popup de login: manutenção ou comunicado aos clientes. */
  tryShowLoginAvisoModal(): boolean {
    if (!this.auth.isLoggedIn() || this.auth.isAdmin() || !this.auth.isAccountFinalized()) return false;

    const unread = this.items().filter((n) => !n.dismissed);
    const pick =
      unread.find((n) => n.category === 'maintenance' && n.maintenancePhase === 'active') ??
      unread.find((n) => n.category === 'maintenance' && n.maintenancePhase === 'scheduled') ??
      unread.find((n) => n.category === 'announcement');

    if (!pick) return false;

    this.loginModalNotification.set(pick);
    this.loginModalVisible.set(true);
    return true;
  }

  /** @deprecated use {@link #tryShowLoginAvisoModal} */
  tryShowMaintenanceLoginModal(): boolean {
    return this.tryShowLoginAvisoModal();
  }

  closeLoginModal(): void {
    this.loginModalVisible.set(false);
    this.loginModalNotification.set(null);
  }

  confirmLoginModal(): void {
    const n = this.loginModalNotification();
    if (n) this.dismiss(n.id);
    else this.closeLoginModal();
  }

  maintenancePeriod(n: SystemNotification): string {
    if (!n.maintenanceStartAt || !n.maintenanceEndAt) return '';
    const fmtDate = (iso: string) =>
      new Date(iso).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' });
    return `${fmtDate(n.maintenanceStartAt)} — ${fmtDate(n.maintenanceEndAt)}`;
  }

  avisoPhaseLabel(n: SystemNotification): string {
    if (n.category === 'maintenance') {
      if (n.maintenancePhase === 'active') return 'Manutenção em curso';
      if (n.maintenancePhase === 'scheduled') return 'Manutenção agendada';
      return 'Manutenção';
    }
    return 'Comunicado';
  }

  /** Texto único para exibição (remove bloco automático legado duplicado). */
  displayMessage(n: SystemNotification): string {
    const msg = (n.message || '').trim();
    if (n.category !== 'maintenance') return msg;
    const parts = msg.split(/\n\n+/);
    if (parts.length >= 2 && parts[0].includes('Chef Control estará em manutenção')) {
      return parts.slice(1).join('\n\n').trim() || parts[0];
    }
    return msg;
  }

  /** Mensagem com destaques a vermelho para popup e listagens (resultado em cache). */
  messageHtml(n: SystemNotification): SafeHtml {
    const cacheKey = [
      n.id,
      n.message,
      n.maintenanceStartAt ?? '',
      n.maintenanceEndAt ?? '',
      n.category ?? '',
    ].join('|');
    const hit = this.messageHtmlCache.get(cacheKey);
    if (hit) {
      return hit;
    }
    const text = this.displayMessage(n);
    let html = this.escapeHtml(text);

    if (n.maintenanceStartAt && n.maintenanceEndAt) {
      const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' });
      const start = fmt(n.maintenanceStartAt);
      const end = fmt(n.maintenanceEndAt);
      html = this.replacePlainText(html, `${start} a ${end}`, this.emphasis(`${start} a ${end}`));
      html = this.replacePlainText(html, `${start} — ${end}`, this.emphasis(`${start} — ${end}`));
    }

    const keywords = ['manutenção', 'indisponível', 'indisponíveis', 'novas funcionalidades', 'interrupção'];
    for (const word of keywords) {
      const re = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
      html = this.replacePlainTextRegex(html, re);
    }

    const safe = this.sanitizer.bypassSecurityTrustHtml(html);
    this.messageHtmlCache.set(cacheKey, safe);
    return safe;
  }

  /** Substitui só texto fora de tags HTML (evita HTML aninhado infinito). */
  private replacePlainText(html: string, search: string, replacement: string): string {
    const escaped = this.escapeHtml(search);
    if (!html.includes(escaped)) {
      return html;
    }
    return this.replacePlainTextRegex(html, new RegExp(`(${this.escapeRegex(escaped)})`, 'gi'), replacement);
  }

  private replacePlainTextRegex(html: string, re: RegExp, replacement?: string): string {
    return html.replace(re, (match, _g1, offset) => {
      const before = html.slice(0, offset);
      if (before.lastIndexOf('<') > before.lastIndexOf('>')) {
        return match;
      }
      return replacement ?? this.emphasis(match);
    });
  }

  private emphasis(text: string): string {
    return `<span class="sys-aviso-popup__emphasis">${text}</span>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
