import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { AuthService, LoginLicenseBlock } from '../services/auth.service';
import { OrdersService } from '../services/orders.service';
import { ReminderService } from '../services/reminder.service';
import { LoginPopupOrchestratorService } from '../services/login-popup-orchestrator.service';
import { AdminLoginSummaryPopupService } from '../dashboard-admin/services/admin-login-summary-popup.service';
import { RegistrationFlowService } from '@app/core/registration/registration-flow.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
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

  licenseBlock: LoginLicenseBlock | null = null;
  /** Valor mensal (MZN), alinhado ao backend `app.license-amount`. */
  readonly licenseMonthAmountMzn = 500;

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
    if (this.licenseBlock) {
      this.licenseBlock = null;
    }
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const trialQuery = q.get('trial') === '1';
    const finalizeQuery = q.get('finalize') === '1';

    if (this.registrationFlow.mustCompleteOnboarding()) {
      if (this.registrationFlow.isChoosePlanPhase()) {
        const phone = this.registrationFlow.getPhone();
        void this.router.navigate(['/escolher-plano'], {
          queryParams: phone ? { phone, registered: '1' } : { registered: '1' },
          replaceUrl: true,
        });
        return;
      }
      if (this.registrationFlow.isFinalizePaid() && !finalizeQuery && !trialQuery) {
        const phone = this.registrationFlow.getPhone();
        void this.router.navigate(['/license-payment'], {
          queryParams: phone ? { phone, from: 'register' } : { from: 'register' },
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

  /** Uma única mensagem principal (evita duplicar texto do servidor com frases genéricas). */
  primaryAlertText(): string {
    const msg = this.licenseBlock?.message?.trim();
    if (msg) {
      return msg;
    }
    const c = this.licenseBlock?.code;
    if (c === 'LICENSE_PENDING') {
      return 'A licença ainda não está activa. É necessário pagamento ou aprovação pelo administrador.';
    }
    if (c === 'LICENSE_TRIAL_ENDED') {
      return 'O período de teste gratuito terminou. Renove a licença para voltar a usar o sistema.';
    }
    if (c === 'LICENSE_EXPIRED') {
      return 'A validade da sua licença terminou. Renove para voltar a iniciar sessão.';
    }
    return 'Não é possível iniciar sessão até a licença estar em dia.';
  }

  assistantTitle(): string {
    const c = this.licenseBlock?.code;
    if (c === 'LICENSE_PENDING') return 'Licença por activar';
    if (c === 'LICENSE_TRIAL_ENDED') return 'Período de teste terminado';
    if (c === 'LICENSE_EXPIRED') return 'Licença expirada';
    return 'Não é possível iniciar sessão';
  }

  formatValidUntil(): string {
    const iso = this.licenseBlock?.validUntil;
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  dismissAssistant(): void {
    this.licenseBlock = null;
  }

  async submit(): Promise<void> {
    this.error = '';
    this.showLoginDiagHint = false;
    this.licenseBlock = null;
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
        } else if (result.code === 'LICENSE_BLOCKED') {
          this.licenseBlock =
            result.licenseBlock ??
            ({
              code: 'LICENSE_PENDING',
              message: result.message,
            } as LoginLicenseBlock);
          this.showNoAccountInfo = false;
          this.error = '';
          this.showLoginDiagHint = false;
        } else if (result.code === 'ACCOUNT_BLOCKED') {
          this.error =
            result.message?.trim() ||
            'Conta bloqueada por excesso de tentativas. Contacte o suporte para recuperar o acesso.';
          this.showNoAccountInfo = false;
        } else {
          this.error = result.message?.trim() || 'Telefone ou senha incorretos.';
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
    this.licenseBlock = null;
    this.router.navigate(['/recuperar-senha']);
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
