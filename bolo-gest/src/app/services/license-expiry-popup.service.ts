import { Injectable, signal, inject, Injector } from '@angular/core';
import { LoginPopupOrchestratorService } from './login-popup-orchestrator.service';

/** Evita dependência circular com AuthService. */
export interface LicenseExpiryStatusHint {
  daysRemaining?: number;
  showLicenseExpiryWarning?: boolean;
}

/**
 * Aviso de licença a expirar em ≤10 dias — no máximo uma vez por sessão após carregar o estado da licença.
 * Aguarda a cadeia pós-login (manutenção → boas-vindas → resumo) antes de aparecer.
 */
@Injectable({ providedIn: 'root' })
export class LicenseExpiryPopupService {
  private readonly injector = inject(Injector);

  visible = signal(false);
  daysRemaining = signal<number | null>(null);
  private alreadyShown = false;
  private pendingStatus: LicenseExpiryStatusHint | null = null;

  tryShowFromStatus(status: LicenseExpiryStatusHint | null): void {
    if (!status?.showLicenseExpiryWarning) return;
    if (this.alreadyShown) return;

    const orchestrator = this.injector.get(LoginPopupOrchestratorService);
    if (orchestrator.activeStep() !== null) {
      this.pendingStatus = status;
      return;
    }

    this.showInternal(status);
    if (this.visible()) {
      orchestrator.showLicenseStep();
    }
  }

  /** @returns true se o popup ficou visível */
  showPendingIfAny(): boolean {
    if (!this.pendingStatus || this.alreadyShown) return false;
    const status = this.pendingStatus;
    this.pendingStatus = null;
    this.showInternal(status);
    return this.visible();
  }

  close(): void {
    this.visible.set(false);
    this.injector.get(LoginPopupOrchestratorService).completeLicenseStep();
  }

  resetForNextLogin(): void {
    this.alreadyShown = false;
    this.pendingStatus = null;
    this.visible.set(false);
    this.daysRemaining.set(null);
  }

  private showInternal(status: LicenseExpiryStatusHint): void {
    this.daysRemaining.set(status.daysRemaining ?? null);
    this.visible.set(true);
    this.alreadyShown = true;
  }
}
