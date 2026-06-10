import { Injectable, Injector, inject, signal } from '@angular/core';
import { LoginPopupOrchestratorService } from './login-popup-orchestrator.service';
import { UserFeedbackService } from './user-feedback.service';
import { AuthService } from './auth.service';

export type SatisfactionPromptMode = 'login' | 'logout';

const SKIP_LOGIN_KEY = 'chefcontrol_satisfaction_skip_login';
const SKIP_LOGOUT_KEY = 'chefcontrol_satisfaction_skip_logout';

/**
 * Shows the satisfaction survey after the login popup chain or before logout.
 * Prompt rules come from the API (30-day cooldown after submission).
 */
@Injectable({ providedIn: 'root' })
export class SatisfactionPromptService {
  private readonly injector = inject(Injector);
  private readonly feedback = inject(UserFeedbackService);
  private readonly auth = inject(AuthService);
  /**
   * Feature flag temporária: questionário de satisfação desactivado.
   * Para reactivar, mudar para `true`.
   */
  private readonly enabled = false;

  readonly visible = signal(false);
  readonly mode = signal<SatisfactionPromptMode>('login');
  readonly submitting = signal(false);
  readonly error = signal('');

  private logoutComplete: (() => void) | null = null;
  private firstLoginContext = false;

  markLoginSessionContext(): void {
    this.firstLoginContext = this.auth.showWelcomeOnboarding();
  }

  reset(): void {
    this.visible.set(false);
    this.submitting.set(false);
    this.error.set('');
    this.logoutComplete = null;
    this.firstLoginContext = false;
  }

  /** Called when the post-login chain may show the survey. */
  async tryShowAfterLoginChain(): Promise<boolean> {
    if (!this.enabled) return false;
    if (this.auth.isAdmin()) return false;
    if (this.wasSkipped(SKIP_LOGIN_KEY)) return false;
    try {
      const status = await this.feedback.getPromptStatus(this.firstLoginContext);
      if (!status.shouldPromptOnLogin) return false;
      this.mode.set('login');
      this.visible.set(true);
      return true;
    } catch {
      return false;
    }
  }

  /** Blocks until the user submits, skips, or no prompt is needed. */
  async runBeforeLogout(): Promise<void> {
    if (!this.enabled) return;
    if (this.auth.isAdmin()) return;
    if (this.wasSkipped(SKIP_LOGOUT_KEY)) return;
    try {
      const status = await this.feedback.getPromptStatus(false);
      if (!status.shouldPromptOnLogout) return;
      await new Promise<void>((resolve) => {
        this.logoutComplete = resolve;
        this.mode.set('logout');
        this.visible.set(true);
      });
    } catch {
      /* proceed with logout */
    }
  }

  skip(): void {
    const key = this.mode() === 'login' ? SKIP_LOGIN_KEY : SKIP_LOGOUT_KEY;
    try {
      sessionStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
    this.close();
  }

  async submit(rating: number, wouldRecommend: boolean | null, comment: string): Promise<void> {
    this.submitting.set(true);
    this.error.set('');
    try {
      await this.feedback.submit({
        rating,
        wouldRecommend,
        comment: comment.trim() || undefined,
      });
      this.close();
    } catch (err: unknown) {
      const e = err as { error?: { message?: string }; message?: string };
      this.error.set(e?.error?.message || e?.message || 'Não foi possível enviar a avaliação.');
    } finally {
      this.submitting.set(false);
    }
  }

  private close(): void {
    this.visible.set(false);
    this.error.set('');
    if (this.mode() === 'login') {
      this.injector.get(LoginPopupOrchestratorService).completeSatisfactionStep();
    }
    const done = this.logoutComplete;
    this.logoutComplete = null;
    done?.();
  }

  private wasSkipped(key: string): boolean {
    try {
      return sessionStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  }
}
