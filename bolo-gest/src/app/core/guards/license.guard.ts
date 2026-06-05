import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegistrationFlowService } from '../registration/registration-flow.service';

/**
 * Protege rotas que exigem licença activa. Admin não precisa de licença.
 * Com sessão mas licença inactiva: só permite /license-payment (pagamento + espera de aprovação).
 */
export const licenseGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.isAdmin()) return true;
  if (auth.isAccountFinalized()) return true;

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
    queryParams: { renewed: '1', ...(phone ? { phone } : {}) },
  });
};
