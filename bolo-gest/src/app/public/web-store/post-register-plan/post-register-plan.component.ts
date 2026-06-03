import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '@app/services/auth.service';
import { normalizeMzPhoneDigits } from '@app/validators/mz-phone.validator';
import { RegistrationFlowService } from '@app/core/registration/registration-flow.service';
import { RegistrationProgressComponent } from '@app/core/registration/registration-progress.component';
import { PublicSiteNavComponent } from '../../web-page/public-site-nav/public-site-nav.component';

/** Após criar conta: escolher teste grátis (login manual) ou pagar Pro (página de pagamento). */
@Component({
  selector: 'app-post-register-plan',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicSiteNavComponent, RegistrationProgressComponent],
  templateUrl: './post-register-plan.component.html',
  styleUrl: './post-register-plan.component.scss',
})
export class PostRegisterPlanComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private registrationFlow = inject(RegistrationFlowService);

  phoneDigits = '';
  fromRegister = false;
  readonly progressStep = 2 as const;
  /**
   * Plano Pro na UI. Manter `false` até a API de pagamento (M-Pesa/e-Mola) estar activa.
   * A lógica `choosePaidPro()` permanece no componente.
   */
  readonly proPlanUiEnabled = false;

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.fromRegister = q.get('registered') === '1';

    if (this.registrationFlow.isFinalizePaid()) {
      this.registrationFlow.reopenPlanChoice();
    }

    const fromQuery = (q.get('phone') ?? '').replace(/\D/g, '');
    const normalized = fromQuery.length >= 9 ? normalizeMzPhoneDigits(fromQuery) : '';
    if (normalized.length === 9) {
      this.phoneDigits = normalized;
      return;
    }
    const fromFlow = this.registrationFlow.getPhone();
    if (fromFlow.length === 9) {
      this.phoneDigits = fromFlow;
      return;
    }
    const fromSession = this.auth.getPhone();
    if (fromSession) {
      const d = normalizeMzPhoneDigits(fromSession.replace(/\D/g, ''));
      if (d.length === 9) {
        this.phoneDigits = d;
        return;
      }
    }
    void this.router.navigate(['/register']);
  }

  chooseFreeTrial(): void {
    this.registrationFlow.markTrialChosen();
    this.auth.endSessionWithoutNavigation();
    void this.router.navigate(['/login'], {
      queryParams: this.phoneDigits
        ? { phone: this.phoneDigits, trial: '1' }
        : { trial: '1' },
      replaceUrl: true,
    });
  }

  choosePaidPro(): void {
    if (!this.proPlanUiEnabled) return;
    this.registrationFlow.markPaidChosen();
    const queryParams: Record<string, string> = { from: 'register' };
    if (this.phoneDigits) {
      queryParams['phone'] = this.phoneDigits;
    }
    void this.router.navigate(['/license-payment'], { queryParams });
  }
}
