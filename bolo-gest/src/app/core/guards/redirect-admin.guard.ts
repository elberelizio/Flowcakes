import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Redireciona o administrador para /admin quando tenta aceder a rotas de utilizador
 * (Dashboard, Novo Pedido, Pedidos). O admin só usa Admin, Relatórios e Perfil.
 */
export const redirectAdminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenInitialized();
  if (auth.isLoggedIn() && auth.isAdmin()) return router.createUrlTree(['/license-management']);
  return true;
};
