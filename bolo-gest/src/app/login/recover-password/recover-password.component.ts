import { CommonModule } from '@angular/common';
import { Component, ViewChild, AfterViewInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SnackbarComponent } from '../../ui/snackbar/snackbar.component';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

/** Contacto Moçambique: exactamente 9 dígitos */
const PHONE_PATTERN = /^[0-9]{9}$/;
const OTP_PATTERN = /^[0-9]{6}$/;

type RecoverStep = 'phone' | 'otp' | 'password';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SnackbarComponent],
  templateUrl: './recover-password.component.html',
  styleUrl: './recover-password.component.scss',
})
export class RecoverPasswordComponent implements AfterViewInit {
  @ViewChild(SnackbarComponent) snackbar!: SnackbarComponent;

  private readonly notificationService = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  step: RecoverStep = 'phone';
  loading = false;
  error = '';
  simulationOtp = '';
  resetToken = '';

  phoneForm = inject(FormBuilder).nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
  });

  otpForm = inject(FormBuilder).nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(OTP_PATTERN)]],
  });

  passwordForm = inject(FormBuilder).nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(4)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(4)]],
  });

  submitted = false;

  ngAfterViewInit(): void {
    if (this.snackbar) this.notificationService.setSnackbar(this.snackbar);
  }

  onPhoneInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const v = input.value.replace(/\D/g, '').slice(0, 9);
    if (v !== input.value) {
      input.value = v;
      this.phoneForm.get('phone')?.setValue(v, { emitEvent: true });
    }
  }

  onOtpInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const v = input.value.replace(/\D/g, '').slice(0, 6);
    if (v !== input.value) {
      input.value = v;
      this.otpForm.get('otp')?.setValue(v, { emitEvent: true });
    }
  }

  async requestOtp(): Promise<void> {
    this.submitted = true;
    this.error = '';
    if (this.phoneForm.invalid) return;

    this.loading = true;
    try {
      const phone = this.phoneForm.getRawValue().phone;
      const result = await this.auth.requestPasswordResetOtp(phone);
      if (!result.ok) {
        this.error = result.message ?? 'Não foi possível enviar o código.';
        return;
      }
      this.simulationOtp = result.simulationOtp?.trim() ?? '';
      this.step = 'otp';
      this.submitted = false;
      this.otpForm.reset();
      this.notificationService.showSuccess(result.message ?? 'Código OTP gerado.');
    } finally {
      this.loading = false;
    }
  }

  async verifyOtp(): Promise<void> {
    this.submitted = true;
    this.error = '';
    if (this.otpForm.invalid) return;

    this.loading = true;
    try {
      const phone = this.phoneForm.getRawValue().phone;
      const otp = this.otpForm.getRawValue().otp;
      const result = await this.auth.verifyPasswordResetOtp(phone, otp);
      if (!result.ok || !result.resetToken) {
        this.error = result.message ?? 'Código OTP inválido ou expirado.';
        return;
      }
      this.resetToken = result.resetToken;
      this.step = 'password';
      this.submitted = false;
      this.passwordForm.reset();
      this.notificationService.showSuccess(result.message ?? 'Código confirmado.');
    } finally {
      this.loading = false;
    }
  }

  async resetPassword(): Promise<void> {
    this.submitted = true;
    this.error = '';
    if (this.passwordForm.invalid) return;

    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) return;

    this.loading = true;
    try {
      const phone = this.phoneForm.getRawValue().phone;
      const result = await this.auth.resetPasswordViaRecovery({
        phone,
        resetToken: this.resetToken,
        newPassword,
        confirmPassword,
      });
      if (!result.ok) {
        this.error = result.message ?? 'Não foi possível alterar a senha.';
        return;
      }
      this.notificationService.showSuccess(result.message ?? 'Senha alterada com sucesso.');
      await this.router.navigate(['/login'], {
        queryParams: { phone },
      });
    } finally {
      this.loading = false;
    }
  }

  backToPhone(): void {
    this.step = 'phone';
    this.error = '';
    this.submitted = false;
    this.simulationOtp = '';
    this.resetToken = '';
    this.otpForm.reset();
    this.passwordForm.reset();
  }

  backToOtp(): void {
    this.step = 'otp';
    this.error = '';
    this.submitted = false;
    this.resetToken = '';
    this.passwordForm.reset();
  }

  get passwordMismatch(): boolean {
    if (!this.submitted || this.step !== 'password') return false;
    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();
    return !!newPassword && !!confirmPassword && newPassword !== confirmPassword;
  }

  stepLabel(): string {
    if (this.step === 'otp') return 'Confirmar código';
    if (this.step === 'password') return 'Nova senha';
    return 'Recuperar senha';
  }
}
