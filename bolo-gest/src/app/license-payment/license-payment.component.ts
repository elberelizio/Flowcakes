import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { normalizeMzPhoneDigits } from '../validators/mz-phone.validator';
import { LicensePaymentStrings } from './license-payment.strings';
import { LICENSE_PAYMENT_BRAND_ALTS, LICENSE_PAYMENT_BRAND_IMAGES } from './license-payment.brand-assets';
import { RegistrationFlowService } from '@app/core/registration/registration-flow.service';
import { RegistrationProgressComponent } from '@app/core/registration/registration-progress.component';
import { PublicSiteNavComponent } from '../public/web-page/public-site-nav/public-site-nav.component';

@Component({
  selector: 'app-license-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PublicSiteNavComponent, RegistrationProgressComponent],
  templateUrl: './license-payment.component.html',
  styleUrl: './license-payment.component.scss',
})
export class LicensePaymentComponent implements OnInit {
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected readonly auth = inject(AuthService);
  private registrationFlow = inject(RegistrationFlowService);
  private cdr = inject(ChangeDetectorRef);

  /** Fluxo obrigatório de nova conta (passo 3 = pagamento). */
  inRegistrationFlow = false;
  readonly registrationProgressStep = 3 as const;

  /** Valor mensal (MZN); alinhado ao backend `app.license-amount`. */
  readonly licenseMonthAmountMzn = 500;
  readonly str = LicensePaymentStrings;
  readonly brandImg = LICENSE_PAYMENT_BRAND_IMAGES;
  readonly brandAlt = LICENSE_PAYMENT_BRAND_ALTS;

  walletPhone = '';
  payMonths = 1;
  selectedTab: 'mpesa' | 'emola' = 'mpesa';

  /** Backend em modo simulado (sem API externa). */
  paySimulated = false;
  payLoading = false;
  payMessage = '';
  paySuccess = false;

  ngOnInit(): void {
    this.title.setTitle(LicensePaymentStrings.documentTitle);
    this.inRegistrationFlow = this.registrationFlow.isFinalizePaid();

    const q = this.route.snapshot.queryParamMap.get('phone');
    if (q) {
      const digits = q.replace(/\D/g, '').slice(0, 12);
      const d = normalizeMzPhoneDigits(digits.length >= 9 ? digits : '');
      if (d.length === 9) {
        this.walletPhone = d;
      }
    }
    if (this.sessionActive()) {
      const p = this.auth.getPhone();
      if (p) {
        const d = normalizeMzPhoneDigits(p);
        if (d.length === 9) {
          this.walletPhone = d;
        }
      }
    }
    void this.refreshPayMode();
  }

  backFromPayment(): void {
    if (this.inRegistrationFlow) {
      this.registrationFlow.reopenPlanChoice();
      const phone = this.registrationFlow.getPhone() || this.walletPhone;
      void this.router.navigate(['/escolher-plano'], {
        queryParams: phone ? { phone, registered: '1' } : { registered: '1' },
      });
      return;
    }
    if (this.sessionActive()) {
      void this.router.navigate(['/minha-licenca']);
      return;
    }
    void this.router.navigate(['/']);
  }

  goToLoginAfterPayment(): void {
    const phone = this.registrationFlow.getPhone() || this.walletPhone;
    this.auth.endSessionWithoutNavigation();
    void this.router.navigate(['/login'], {
      queryParams: phone ? { phone, finalize: '1' } : { finalize: '1' },
    });
  }

  /** Utilizador normal com sessão: pagamento sem voltar a pedir contacto/senha. */
  sessionActive(): boolean {
    return this.auth.isLoggedIn() && !this.auth.isAdmin();
  }

  /** Página dentro do painel (sessão activa): sem navbar do site público. */
  inAppShell(): boolean {
    return this.auth.isLoggedIn() && !this.auth.isAdmin();
  }

  leadText(): string {
    return this.sessionActive() ? LicensePaymentStrings.leadLogged : LicensePaymentStrings.lead;
  }

  get totalMzn(): number {
    return this.licenseMonthAmountMzn * this.payMonths;
  }

  monthOptionLabel(m: number): string {
    return `${m} ${m === 1 ? 'mês' : 'meses'} — ${m * this.licenseMonthAmountMzn} MZN`;
  }

  apiChannel(): 'mpesa' | 'emola' {
    return this.selectedTab === 'emola' ? 'emola' : 'mpesa';
  }

  selectTab(m: 'mpesa' | 'emola'): void {
    this.selectedTab = m;
    this.payMessage = '';
  }

  walletChannelLabel(): string {
    return this.selectedTab === 'emola' ? 'e-Mola' : 'M-Pesa';
  }

  walletPlaceholder(): string {
    return this.selectedTab === 'emola' ? LicensePaymentStrings.placeholderEmola : LicensePaymentStrings.placeholderMpesa;
  }

  private async refreshPayMode(): Promise<void> {
    const r = await this.auth.checkMpesaAvailable();
    this.paySimulated = r.simulated === true;
    this.cdr.markForCheck();
  }

  async submitPayment(): Promise<void> {
    if (!this.sessionActive()) {
      this.payMessage = LicensePaymentStrings.errNeedAccount;
      this.paySuccess = false;
      return;
    }

    const channel = this.apiChannel();

    if (!this.walletPhone.trim()) {
      this.payMessage = LicensePaymentStrings.errWalletRequired(this.walletChannelLabel());
      this.paySuccess = false;
      return;
    }
    const wallet = normalizeMzPhoneDigits(this.walletPhone);
    if (channel === 'emola') {
      if (wallet.length !== 9 || (!wallet.startsWith('86') && !wallet.startsWith('87'))) {
        this.payMessage = LicensePaymentStrings.errEmolaFormat;
        this.paySuccess = false;
        return;
      }
    } else if (wallet.length !== 9 || (!wallet.startsWith('84') && !wallet.startsWith('85'))) {
      this.payMessage = LicensePaymentStrings.errMpesaFormat;
      this.paySuccess = false;
      return;
    }

    this.payLoading = true;
    this.payMessage = '';
    this.paySuccess = false;
    const res = await this.auth.initiateMpesaPayment(wallet, this.payMonths, channel);
    this.payLoading = false;
    this.payMessage = res.message;
    this.paySuccess = res.success;
    this.cdr.markForCheck();
  }
}
