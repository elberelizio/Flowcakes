import { Injectable, signal } from '@angular/core';

const SESSION_STORAGE_KEY = 'chefcontrol_admin_login_summary_consumed';

/**
 * Resumo «Bem-vindo de volta» após login de administrador.
 * Mostrado no painel (/admin-dashboard), não na página de login.
 */
@Injectable({ providedIn: 'root' })
export class AdminLoginSummaryPopupService {
  visible = signal(false);
  /** Pedido no login; aberto quando o painel carrega. */
  private pendingAfterLogin = false;

  /** Chamar após login admin bem-sucedido, antes de navegar para o painel. */
  requestShowAfterLogin(): void {
    if (this.isConsumedInBrowserSession()) return;
    this.pendingAfterLogin = true;
  }

  /** Chamar no ngOnInit do painel de administração. */
  tryShowOnDashboard(): void {
    if (!this.pendingAfterLogin || this.isConsumedInBrowserSession()) {
      this.pendingAfterLogin = false;
      return;
    }
    this.pendingAfterLogin = false;
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
    this.markConsumedInBrowserSession();
  }

  resetForNextLogin(): void {
    this.pendingAfterLogin = false;
    this.visible.set(false);
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      /* quota / modo privado */
    }
  }

  private isConsumedInBrowserSession(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === '1';
  }

  private markConsumedInBrowserSession(): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  }
}
