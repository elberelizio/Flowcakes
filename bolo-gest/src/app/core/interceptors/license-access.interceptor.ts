import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LicensePaymentLockService } from '../../services/license-payment-lock.service';

/**
 * Se a API responder 403 por licença inactiva com sessão válida, redirecciona para pagamento.
 * Redirecciona utilizadores com sessão mas licença inactiva para a página de pagamento.
 */
export const licenseAccessInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 403) {
        return throwError(() => err);
      }
      const code = typeof err.error?.code === 'string' ? err.error.code : '';
      if (!code.startsWith('LICENSE_')) {
        return throwError(() => err);
      }
      if (!auth.isLoggedIn() || auth.isAdmin() || auth.isAccountFinalized()) {
        return throwError(() => err);
      }
      const path = router.url.split('?')[0];
      const lock = inject(LicensePaymentLockService);
      if (!lock.isAllowedWhenLocked(path)) {
        void router.navigate(['/license-payment'], { queryParams: { renewed: '1' } });
      }
      return throwError(() => err);
    })
  );
};
