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
import { OrderAlertsPopupService } from '../services/order-alerts-popup.service';
import { LoginSuccessModalComponent } from './login-success-modal/login-success-modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoginSuccessModalComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  error = '';
  /** Mostrar nota sobre JSON 401 em POST /auth/login (distingue conta inexistente vs senha). */
  showLoginDiagHint = false;
  loading = false;
  showNoAccountInfo = false;
  showLoginSuccessModal = false;
  /** Após registo com redirecionamento para o login. */
  showPostRegisterHint = false;
  form!: FormGroup;

  licenseBlock: LoginLicenseBlock | null = null;
  /** Valor mensal (MZN), alinhado ao backend `app.license-amount`. */
  readonly licenseMonthAmountMzn = 500;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private orders: OrdersService,
    private reminders: ReminderService,
    private orderAlertsPopup: OrderAlertsPopupService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.nonNullable.group({
      phone: ['', [loginPhoneFormatValidator]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  /** Query params para pré-preencher o contacto na página de pagamento. */
  paymentPageQueryParams(): Record<string, string> {
    const phone = this.form.get('phone')?.value ?? '';
    const digits = phone.replace(/\D/g, '');
    if (!digits) return {};
    return { phone: digits };
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
    if (this.auth.isLoggedIn()) {
      if (this.auth.isAdmin()) {
        this.router.navigate(['/gestao-licencas']);
      } else {
        this.router.navigate(['/dashboard']);
      }
      return;
    }
    this.error = '';
    const q = this.route.snapshot.queryParamMap;
    const phoneFromUrl = q.get('phone')?.replace(/\D/g, '') ?? '';
    if (phoneFromUrl) {
      this.form.patchValue({ phone: phoneFromUrl });
    }
    this.showPostRegisterHint = q.get('registered') === '1';
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
        } else {
          this.error = result.message?.trim() || 'Telefone ou senha incorretos.';
          this.showNoAccountInfo = false;
          this.showLoginDiagHint = result.code === 'INVALID_CREDENTIALS';
        }
        return;
      }
      this.showNoAccountInfo = false;
      if (this.auth.isAdmin()) {
        void this.orders.loadOrders();
        this.showLoginSuccessModal = true;
      } else {
        await Promise.all([this.orders.loadOrders(), this.reminders.loadReminders()]);
        this.orderAlertsPopup.tryShowSessionPopup();
        await this.router.navigate(['/dashboard']);
      }
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onLoginSuccessModalClosed(): void {
    this.showLoginSuccessModal = false;
    this.router.navigate(['/gestao-licencas']);
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
