import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RegistrationFlowService } from '../registration/registration-flow.service';
/** Só permite escolher plano com fluxo de registo activo (ou reentrada após voltar do pagamento). */
export const registrationChoosePlanGuard: CanActivateFn = () => {
  const flow = inject(RegistrationFlowService);
  const router = inject(Router);

  if (flow.isActive()) {
    return true;
  }

  return router.createUrlTree(['/register']);
};

/** No fluxo de nova conta, só entra no pagamento depois de escolher plano pago. */
export const registrationPaymentGuard: CanActivateFn = () => {
  const flow = inject(RegistrationFlowService);
  const router = inject(Router);

  if (!flow.isActive()) {
    return true;
  }

  if (flow.isFinalizePaid()) {
    return true;
  }

  const phone = flow.getPhone();
  return router.createUrlTree(['/escolher-plano'], {
    queryParams: phone ? { phone, registered: '1' } : { registered: '1' },
  });
};
