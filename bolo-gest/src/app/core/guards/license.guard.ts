import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Protege rotas que exigem licença paga. Admin não precisa de licença.
 * Sessão antiga sem licença activa: termina sessão e envia para o login (onde o assistente explica o pagamento).
 */
export const licenseGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.isAdmin()) return true;
  if (!auth.isAccountFinalized()) {
    auth.endSessionWithoutNavigation();
    return router.createUrlTree(['/login']);
  }
  return true;
};
