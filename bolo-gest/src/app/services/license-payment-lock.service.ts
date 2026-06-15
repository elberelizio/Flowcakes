import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type LicenseRestrictionCode =
  | 'LICENSE_PENDING'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_TRIAL_ENDED'
  | string;

/** Utilizador com sessão mas sem licença activa: só pode usar a página de pagamento (e login/recuperação). */
@Injectable({ providedIn: 'root' })
export class LicensePaymentLockService {
  private readonly auth = inject(AuthService);

  /** Rotas permitidas quando a licença está inactiva/expirada. */
  private readonly allowedWhenLocked = [
    '/license-payment',
    '/pagamento-licenca',
    '/login',
    '/recover-password',
    '/recuperar-senha',
  ];

  readonly active = computed(
    () => this.auth.isLoggedIn() && !this.auth.isAdmin() && !this.auth.isAccountFinalized()
  );

  isAllowedWhenLocked(url: string): boolean {
    const path = (url.split('?')[0] || '').replace(/\/+$/, '') || '/';
    return this.allowedWhenLocked.some((p) => path === p || path.endsWith(p));
  }

  readonly restrictionCode = computed(() => this.auth.licenseRestrictedCode());

  readonly title = computed(() => {
    const code = this.restrictionCode();
    if (code === 'LICENSE_TRIAL_ENDED') {
      return 'Período de teste terminado';
    }
    if (code === 'LICENSE_EXPIRED') {
      return 'Licença expirada';
    }
    return 'Licença por activar';
  });

  readonly message = computed(() => {
    const code = this.restrictionCode();
    if (code === 'LICENSE_TRIAL_ENDED') {
      return 'Para aceder às suas informações e continuar a usar o sistema, efectue a compra da licença abaixo (M-Pesa ou e-Mola).';
    }
    if (code === 'LICENSE_EXPIRED') {
      return 'A sua licença expirou. Renove abaixo para voltar a aceder aos seus dados e serviços.';
    }
    return 'Active a licença por transferência. O acesso só é restaurado após o administrador confirmar o pagamento.';
  });

  isLicensePaymentUrl(url: string): boolean {
    const path = (url.split('?')[0] || '').replace(/\/+$/, '') || '/';
    return path === '/license-payment' || path.endsWith('/license-payment');
  }
}
