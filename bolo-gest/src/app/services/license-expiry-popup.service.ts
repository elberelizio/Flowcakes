import { Injectable, signal } from '@angular/core';

/** Evita dependência circular com AuthService. */
export interface LicenseExpiryStatusHint {
  daysRemaining?: number;
  showLicenseExpiryWarning?: boolean;
}

/**
 * Aviso de licença a expirar em ≤10 dias — no máximo uma vez por sessão após carregar o estado da licença.
 */
@Injectable({ providedIn: 'root' })
export class LicenseExpiryPopupService {
  visible = signal(false);
  daysRemaining = signal<number | null>(null);
  private alreadyShown = false;

  tryShowFromStatus(status: LicenseExpiryStatusHint | null): void {
    if (!status?.showLicenseExpiryWarning) return;
    if (this.alreadyShown) return;
    this.daysRemaining.set(status.daysRemaining ?? null);
    this.visible.set(true);
    this.alreadyShown = true;
  }

  close(): void {
    this.visible.set(false);
  }

  resetForNextLogin(): void {
    this.alreadyShown = false;
    this.visible.set(false);
    this.daysRemaining.set(null);
  }
}
