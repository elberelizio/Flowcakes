import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenInitialized();
  if (auth.isLoggedIn()) return true;
  const returnUrl =
    state.url.startsWith('/') && !state.url.startsWith('//') ? state.url : '/dashboard';
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};
