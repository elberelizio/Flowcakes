import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegistrationFlowService } from '../registration/registration-flow.service';

/**
 * Protege rotas que exigem licença paga. Admin não precisa de licença.
 * Se a licença não estiver activa, mantém a sessão e envia para pagamento da licença.
 */
export const licenseGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.isAdmin()) return true;
  if (!auth.isAccountFinalized()) {
    const registrationFlow = inject(RegistrationFlowService);
    const phone = registrationFlow.getPhone() || auth.getPhone() || undefined;
    if (registrationFlow.isChoosePlanPhase()) {
      return router.createUrlTree(['/choose-plan'], {
        queryParams: phone ? { phone, registered: '1' } : { registered: '1' },
      });
    }
    if (registrationFlow.isFinalizePaid()) {
      return router.createUrlTree(['/license-payment'], {
        queryParams: phone ? { phone, from: 'register' } : { from: 'register' },
      });
    }
    return router.createUrlTree(['/license-payment'], {
      queryParams: phone ? { phone } : undefined,
    });
  }
  return true;
};
