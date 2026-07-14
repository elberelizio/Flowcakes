import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { OrdersService } from '../services/orders.service';
import { ReminderService } from '../services/reminder.service';
import { LoginPopupOrchestratorService } from '../services/login-popup-orchestrator.service';
import { AdminLoginSummaryPopupService } from '../dashboard-admin/services/admin-login-summary-popup.service';
import { RegistrationFlowService } from '@app/core/registration/registration-flow.service';
import { BRAND_ASSETS } from '@app/core/config/brand-assets';
import { BrandLockupComponent } from '@app/core/brand/brand-lockup.component';
import { TranslatePipe } from '@app/core/i18n/translate.pipe';
import { LanguageService } from '@app/services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BrandLockupComponent, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  readonly brand = BRAND_ASSETS;
  readonly lang = inject(LanguageService);
  error = '';
  /** Mostrar nota sobre JSON 401 em POST /auth/login (distingue conta inexistente vs senha). */
  showLoginDiagHint = false;
  loading = false;
  showNoAccountInfo = false;
  /** Após registo com redirecionamento para o login. */
  showPostRegisterHint = false;
  /** Banner simples após escolher teste grátis (sem barra de passos 1-2-3). */
  showTrialLoginBanner = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private orders: OrdersService,
    private reminders: ReminderService,
    private loginPopupOrchestrator: LoginPopupOrchestratorService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private registrationFlow: RegistrationFlowService,
    private adminLoginSummaryPopup: AdminLoginSummaryPopupService,
  ) {
    this.form = this.fb.nonNullable.group({
      phone: ['', [loginPhoneFormatValidator]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  /** 9 dígitos ou 258 + 9 (máx. 12 dígitos). */
  onPhoneInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '');
    if (v.startsWith('258')) {
      v = v.slice(0, 12);
    } else {
      v = v.slice(0, 9);
    }
    input.value = v;
    this.form.get('phone')?.setValue(v, { emitEvent: true });
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const trialQuery = q.get('trial') === '1';
    const finalizeQuery = q.get('finalize') === '1';

    if (this.registrationFlow.mustCompleteOnboarding()) {
      if (this.registrationFlow.isChoosePlanPhase()) {
        const phone = this.registrationFlow.getPhone();
        void this.router.navigate(['/choose-plan'], {
          queryParams: phone ? { phone, registered: '1' } : { registered: '1' },
          replaceUrl: true,
        });
        return;
      }
      if (this.registrationFlow.isFinalizePaid() && !finalizeQuery && !trialQuery) {
        const phone = this.registrationFlow.getPhone();
        void this.router.navigate(['/login'], {
          queryParams: phone ? { phone, finalize: '1' } : { finalize: '1' },
          replaceUrl: true,
        });
        return;
      }
      if (this.auth.isLoggedIn()) {
        this.auth.endSessionWithoutNavigation();
      }
    } else if (this.auth.isLoggedIn()) {
      if (this.auth.isAdmin()) {
        void this.router.navigate(['/admin-dashboard']);
      } else if (!this.auth.isAccountFinalized()) {
        void this.router.navigate(['/license-payment'], { queryParams: { renewed: '1' }, replaceUrl: true });
      } else {
        void this.router.navigate(['/dashboard']);
      }
      return;
    }

    this.error = '';
    const phoneFromUrl = q.get('phone')?.replace(/\D/g, '') ?? '';
    if (phoneFromUrl) {
      this.form.patchValue({ phone: phoneFromUrl });
    }
    this.showTrialLoginBanner =
      trialQuery || this.registrationFlow.isFinalizeTrial();
    this.showPostRegisterHint =
      q.get('registered') === '1' && !this.showTrialLoginBanner && !finalizeQuery;
    if (this.route.snapshot.fragment === 'login-form') {
      setTimeout(() => this.scrollToLoginForm(), 0);
    }
  }

  /** Plano teste grátis: foco no formulário de entrada (já com conta). */
  scrollToLoginForm(): void {
    document.getElementById('login-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async submit(): Promise<void> {
    this.error = '';
    this.showLoginDiagHint = false;
    const phone = this.form.get('phone')?.value;
    const password = this.form.get('password')?.value;
    if (!phone || !password || this.form.get('phone')?.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    try {
      const result = await this.auth.login(phone, password);
      if (!result.ok) {
        this.showPostRegisterHint = false;
        this.showTrialLoginBanner = this.registrationFlow.isFinalizeTrial();
        if (result.code === 'ACCOUNT_NOT_FOUND') {
          this.error = result.message?.trim() || '';
          this.showNoAccountInfo = true;
          this.showLoginDiagHint = false;
        } else if (result.code === 'ACCOUNT_BLOCKED') {
          this.error =
            result.message?.trim() ||
            this.lang.t('auth.accountBlockedError');
          this.showNoAccountInfo = false;
        } else {
          this.error = result.message?.trim() || this.lang.t('auth.wrongCredentialsError');
          this.showNoAccountInfo = false;
          this.showLoginDiagHint = result.code === 'INVALID_CREDENTIALS';
        }
        return;
      }
      this.showNoAccountInfo = false;
      this.registrationFlow.complete();
      if (this.auth.isAdmin()) {
        void this.orders.loadOrders();
        this.adminLoginSummaryPopup.requestShowAfterLogin();
        await this.router.navigate(['/admin-dashboard']);
      } else if (!this.auth.isAccountFinalized()) {
        const qp: Record<string, string> = { renewed: '1' };
        if (this.auth.shouldShowPaymentRejectionPopup()) {
          qp['rejected'] = '1';
        }
        await this.router.navigate(['/license-payment'], { queryParams: qp });
      } else {
        this.loginPopupOrchestrator.reset();
        await Promise.all([this.orders.loadOrders(), this.reminders.loadReminders()]);
        const rawReturn = this.route.snapshot.queryParamMap.get('returnUrl')?.trim() ?? '';
        const returnUrl = safeInternalPath(rawReturn);
        if (returnUrl) {
          await this.router.navigateByUrl(returnUrl);
        } else {
          await this.router.navigate(['/dashboard']);
        }
        this.loginPopupOrchestrator.markUserDataReady();
        queueMicrotask(() => this.loginPopupOrchestrator.continueChainAfterShell());
      }
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  goToForgotPassword(): void {
    this.error = '';
    this.showNoAccountInfo = false;
    this.router.navigate(['/recover-password']);
  }
}

function loginPhoneDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

/** Evita redireccionamento aberto para domínios externos. */
function safeInternalPath(url: string): string | null {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return null;
  if (url.includes('://')) return null;
  return url;
}

/** Validação do contacto só no fluxo de login (9 dígitos ou 258 + 9). */
function loginPhoneFormatValidator(control: AbstractControl): ValidationErrors | null {
  const d = loginPhoneDigits(control.value);
  if (!d) {
    return { mzPhone: true };
  }
  if (d.startsWith('258')) {
    return d.length === 12 ? null : { mzPhone: true };
  }
  return d.length === 9 ? null : { mzPhone: true };
}
