import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protege rotas que exigem licença paga. Admin não precisa de licença.
 * Se o utilizador está logado mas a conta não está finalizada, redireciona para /finalizar-conta.
 */
export const licenseGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.isAdmin()) return true;
  if (!auth.isAccountFinalized()) return router.createUrlTree(['/finalizar-conta']);
  return true;
};
