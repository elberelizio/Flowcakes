import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Usado na rota finalizar-conta: administrador não precisa de licença,
 * redireciona sempre para /admin.
 */
export const noFinalizarForAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isAdmin()) return router.createUrlTree(['/gestao-licencas']);
  return true;
};
