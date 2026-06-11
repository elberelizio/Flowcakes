import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenInitialized();
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (!auth.isAdmin()) return router.createUrlTree(['/dashboard']);
  return true;
};
