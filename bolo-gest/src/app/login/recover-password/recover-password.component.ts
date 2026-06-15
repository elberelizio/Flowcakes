import { CommonModule } from '@angular/common';
import { Component, ViewChild, AfterViewInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SnackbarComponent } from '../../ui/snackbar/snackbar.component';
import { NotificationService } from '../../services/notification.service';
import { BrandLockupComponent } from '@app/core/brand/brand-lockup.component';

/** Contacto Moçambique: exactamente 9 dígitos */
const PHONE_PATTERN = /^[0-9]{9}$/;

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SnackbarComponent, BrandLockupComponent],
  templateUrl: './recover-password.component.html',
  styleUrl: './recover-password.component.scss',
})
export class RecoverPasswordComponent implements AfterViewInit {
  @ViewChild(SnackbarComponent) snackbar!: SnackbarComponent;
  private notificationService = inject(NotificationService);

  submitted = false;

  form = inject(FormBuilder).nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    newPassword: ['', [Validators.required, Validators.minLength(4)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(4)]],
  });

  ngAfterViewInit(): void {
    if (this.snackbar) this.notificationService.setSnackbar(this.snackbar);
  }

  onPhoneInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const v = input.value.replace(/\D/g, '').slice(0, 9);
    if (v !== input.value) {
      input.value = v;
      this.form.get('phone')?.setValue(v, { emitEvent: true });
    }
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    const { newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) return;

    // Apenas frontend por enquanto (sem API).
    this.notificationService.showInfo('Página criada. Falta a API para concluir a recuperação por telefone.');
  }

  get passwordMismatch(): boolean {
    if (!this.submitted) return false;
    const { newPassword, confirmPassword } = this.form.getRawValue();
    return !!newPassword && !!confirmPassword && newPassword !== confirmPassword;
  }
}

