import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '@app/services/auth.service';
import { PROVINCES } from '@app/models/user.model';
import { PublicSiteNavComponent } from '../../web-page/public-site-nav/public-site-nav.component';

const LOGIN_REDIRECT_SECONDS = 15;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PublicSiteNavComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnDestroy {
  error = '';
  loading = false;
  showSuccessPopup = false;
  successMessage = '';
  /** Segundos até redirecionar para o login (pode saltar com o botão). */
  loginRedirectSecondsLeft = LOGIN_REDIRECT_SECONDS;
  /** Contacto usado no registo — enviado na URL do login para pré-preencher. */
  private registeredPhoneDigits = '';
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private loginNavigationDone = false;
  form: FormGroup;

  readonly provinces = PROVINCES;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.nonNullable.group({
      fullName: ['', [Validators.required]],
      province: ['', [Validators.required]],
      phone: ['', [registerPhoneFormatValidator]],
      email: ['', [Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      dataTrue: [false as boolean, [Validators.requiredTrue]],
    });
  }

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

  getFirstInvalidFieldMessage(): string {
    const order = ['fullName', 'province', 'phone', 'email', 'password', 'dataTrue'] as const;
    const names: Record<string, string> = {
      fullName: 'Nome completo',
      province: 'Província',
      phone: 'Contacto',
      email: 'Email',
      password: 'Senha da conta',
      dataTrue: 'Confirmação dos dados',
    };
    for (const key of order) {
      const c = this.form.get(key);
      if (c?.invalid && c?.errors) {
        if (c.errors['required']) return names[key] + ' é obrigatório.';
        if (c.errors['requiredTrue']) return 'Deve concordar que os dados fornecidos são verdadeiros.';
        if (c.errors['email']) return 'Email inválido.';
        if (c.errors['mzPhone']) return 'Use 9 dígitos ou 12 com prefixo 258.';
        if (c.errors['minlength']) return names[key] + ' deve ter pelo menos 4 caracteres.';
      }
    }
    return 'Preencha todos os campos obrigatórios.';
  }

  async submit(): Promise<void> {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = this.getFirstInvalidFieldMessage();
      return;
    }
    const raw = this.form.getRawValue();
    this.loading = true;
    const result = await this.auth.register({
      phone: raw.phone,
      password: raw.password,
      fullName: raw.fullName,
      province: raw.province,
      email: raw.email ?? '',
    });
    this.loading = false;
    if (!result.ok) {
      this.error = result.message || 'Este contacto já está registado.';
      return;
    }
    this.successMessage =
      result.data?.message ??
      'A sua conta foi criada com sucesso e já tem período de teste gratuito. Daqui a instantes vamos pedir que inicie sessão com o mesmo contacto e a senha que definiu.';
    this.registeredPhoneDigits = raw.phone.replace(/\D/g, '');
    this.loginRedirectSecondsLeft = LOGIN_REDIRECT_SECONDS;
    this.loginNavigationDone = false;
    this.showSuccessPopup = true;
    this.clearCountdown();
    this.countdownInterval = setInterval(() => {
      this.loginRedirectSecondsLeft -= 1;
      this.cdr.detectChanges();
      if (this.loginRedirectSecondsLeft <= 0) {
        this.clearCountdown();
        this.goToLoginNow();
      }
    }, 1000);
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  private clearCountdown(): void {
    if (this.countdownInterval != null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /** Termina a sessão criada no registo e abre o ecrã de login (contacto pré-preenchido). */
  goToLoginNow(): void {
    if (this.loginNavigationDone) return;
    this.loginNavigationDone = true;
    this.clearCountdown();
    this.showSuccessPopup = false;
    const phone = this.registeredPhoneDigits || undefined;
    this.auth.endSessionWithoutNavigation();
    this.router.navigate(['/login'], {
      queryParams: phone ? { phone, registered: '1' } : { registered: '1' },
    });
  }
}

function registerPhoneDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

function registerPhoneFormatValidator(control: AbstractControl): ValidationErrors | null {
  const d = registerPhoneDigits(control.value);
  if (!d) {
    return { mzPhone: true };
  }
  if (d.startsWith('258')) {
    return d.length === 12 ? null : { mzPhone: true };
  }
  return d.length === 9 ? null : { mzPhone: true };
}
