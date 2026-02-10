import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { OrdersService } from '../../services/orders.service';
import { PROVINCES } from '../../models/user.model';
import { LoginSuccessModalComponent } from '../../modals/login-success-modal/login-success-modal.component';

/** Contacto Moçambique: exactamente 9 dígitos */
const PHONE_PATTERN = /^[0-9]{9}$/;
/** NUIT: 9 dígitos */
const NUIT_PATTERN = /^[0-9]{9}$/;
/** BI: 12 dígitos + 1 letra maiúscula A–Z */
const BI_PATTERN = /^[0-9]{12}[A-Z]$/;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoginSuccessModalComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  isRegister = false;
  error = '';
  loading = false;
  showSuccessPopup = false;
  showNoAccountInfo = false;
  showLoginSuccessModal = false;
  successMessage = '';
  form!: FormGroup;

  readonly provinces = PROVINCES;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private orders: OrdersService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.nonNullable.group({
      documentType: ['bi' as 'bi' | 'nuit'],
      documentNumber: ['', [this.documentNumberValidator()]],
      fullName: [''],
      province: [''],
      phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      email: ['', [Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      dataTrue: [false as boolean],
    });
    this.form.get('documentType')?.valueChanges.subscribe(() => {
      this.form.get('documentNumber')?.updateValueAndValidity();
    });
  }

  /** Valida NUIT (9 dígitos) ou BI (12 dígitos + 1 letra A–Z) conforme o tipo seleccionado. */
  private documentNumberValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const type = this.form?.get('documentType')?.value as string;
      const v = (control.value ?? '').trim().replace(/\s/g, '');
      if (!v) return null;
      if (type === 'nuit') return NUIT_PATTERN.test(v) ? null : { documentNumber: 'NUIT deve ter 9 dígitos.' };
      return BI_PATTERN.test(v) ? null : { documentNumber: 'BI: 12 dígitos e uma letra maiúscula no fim (A–Z).' };
    };
  }

  /** Restringe contacto a 9 dígitos. */
  onPhoneInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const v = input.value.replace(/\D/g, '').slice(0, 9);
    if (v !== input.value) {
      input.value = v;
      this.form.get('phone')?.setValue(v, { emitEvent: true });
    }
  }

  getFirstInvalidFieldMessage(): string {
    const order = ['documentNumber', 'fullName', 'province', 'phone', 'email', 'password', 'dataTrue'] as const;
    const names: Record<string, string> = {
      documentNumber: 'Número do documento',
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
        if (c.errors['pattern']) return key === 'phone' ? 'Contacto deve ter 9 dígitos (Moçambique).' : (names[key] + ' em formato inválido.');
        if (c.errors['documentNumber']) return c.errors['documentNumber'] as string;
        if (c.errors['minlength']) return names[key] + ' deve ter pelo menos 4 caracteres.';
      }
    }
    return 'Preencha todos os campos obrigatórios.';
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      if (this.auth.isAdmin()) {
        this.router.navigate(['/gestao-licencas']);
      } else {
        const goDashboard = this.auth.isAccountFinalized() && this.auth.isLicenseCodeValidated();
        this.router.navigate([goDashboard ? '/dashboard' : '/finalizar-conta']);
      }
    }
  }

  toggleMode(): void {
    this.isRegister = !this.isRegister;
    this.error = '';
    if (this.isRegister) {
      this.form.get('documentType')?.setValidators([Validators.required]);
      this.form.get('documentNumber')?.setValidators([Validators.required]);
      this.form.get('fullName')?.setValidators([Validators.required]);
      this.form.get('province')?.setValidators([Validators.required]);
    } else {
      this.form.get('documentType')?.clearValidators();
      this.form.get('documentNumber')?.clearValidators();
      this.form.get('fullName')?.clearValidators();
      this.form.get('province')?.clearValidators();
    }
    this.form.get('documentType')?.updateValueAndValidity();
    this.form.get('documentNumber')?.updateValueAndValidity();
    this.form.get('fullName')?.updateValueAndValidity();
    this.form.get('province')?.updateValueAndValidity();
  }

  setLoginMode(): void {
    this.showNoAccountInfo = false;
    if (this.isRegister) this.toggleMode();
    else this.error = '';
  }

  setRegisterMode(): void {
    this.showNoAccountInfo = false;
    if (!this.isRegister) this.toggleMode();
    else this.error = '';
  }

  async submit(): Promise<void> {
    this.error = '';
    if (this.isRegister) {
      if (this.form.invalid || !this.form.get('dataTrue')?.value) {
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
        documentType: raw.documentType,
        documentNumber: raw.documentNumber,
        province: raw.province,
        email: raw.email ?? '',
      });
      this.loading = false;
      if (!result.ok) {
        this.error = result.message || 'Este contacto já está registado.';
        return;
      }
      this.successMessage = result.data?.message ?? 'Sua conta foi criada com sucesso! Foi enviada uma mensagem para o seu número. Para activar: efectue o pagamento de 500 MZN para o número 871964887 (e-Mola). Depois clique em Continuar para finalizar a conta.';
      this.showSuccessPopup = true;
      this.cdr.detectChanges();
      this.orders.loadOrders();
      return;
    }
    const phone = this.form.get('phone')?.value;
    const password = this.form.get('password')?.value;
    if (!phone || !password) return;
    this.loading = true;
    const result = await this.auth.login(phone, password);
    this.loading = false;
    if (!result.ok) {
      if (result.code === 'ACCOUNT_NOT_FOUND') {
        this.error = 'Não tem conta? A licença custa 500 MZN. Crie a sua conta para ter acesso.';
        this.showNoAccountInfo = true;
      } else {
        this.error = 'Telefone ou senha incorretos.';
        this.showNoAccountInfo = false;
      }
      return;
    }
    this.showNoAccountInfo = false;
    this.orders.loadOrders();
    // Usar auth.isAdmin() pois o currentUser já foi actualizado no login
    if (this.auth.isAdmin()) {
      this.showLoginSuccessModal = true;
      this.cdr.detectChanges();
    } else {
      const goDashboard = result.user.accountFinalized && result.user.licenseCodeValidated;
      this.router.navigate([goDashboard ? '/dashboard' : '/finalizar-conta']);
    }
  }

  onLoginSuccessModalClosed(): void {
    this.showLoginSuccessModal = false;
    this.router.navigate(['/gestao-licencas']);
  }

  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
    this.router.navigate(['/finalizar-conta']);
  }
}
