import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, normalizeMzPhoneDigits } from '../../services/auth.service';
import { PROVINCES } from '../../models/user.model';
import { IconComponent } from '../../ui/icon/icon.component';
import { IconName } from '../../ui/icon/icon-names';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  form!: FormGroup;
  phoneForm!: FormGroup;
  message = '';
  messageError = '';
  profileMessage = '';
  profileMessageError = '';
  savingProfile = false;
  phoneMessage = '';
  phoneMessageError = '';
  savingPhone = false;
  readonly provinces = PROVINCES;
  activeTab = signal<'dados' | 'contacto' | 'senha'>('dados');

  readonly iconPhone: IconName = 'phone';
  readonly iconLock: IconName = 'lock';
  readonly iconUser: IconName = 'user';
  readonly iconClock: IconName = 'clock';
  readonly iconAlert: IconName = 'alert-circle';

  userInitial = (): string => {
    const u = this.auth.getCurrentUser();
    if (!u?.fullName) return (u?.phone?.[0] ?? '?').toUpperCase();
    const parts = u.fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] ?? '?').toUpperCase();
  };

  constructor(
    public auth: AuthService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.nonNullable.group({
      fullName: [''],
      documentType: ['bi' as 'bi' | 'nuit'],
      documentNumber: [''],
      province: [''],
      email: [''],
    });
    this.form = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(4)]],
      newPassword: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', [Validators.required]],
    });
    this.phoneForm = this.fb.group({
      newPhone: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(12)]],
      currentPassword: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  ngOnInit(): void {
    void this.auth.refreshProfile().then(() => this.fillProfileForm());
  }

  formatAccountCreatedAt(iso?: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  formatDisplayPhone(phone?: string): string {
    if (!phone) return '—';
    const d = normalizeMzPhoneDigits(phone);
    if (d.length === 9) {
      return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
    }
    return phone;
  }

  onNewPhoneInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '');
    if (v.startsWith('258')) {
      v = v.slice(0, 12);
    } else {
      v = v.slice(0, 9);
    }
    input.value = v;
    this.phoneForm.get('newPhone')?.setValue(v, { emitEvent: true });
  }

  private fillProfileForm(): void {
    const u = this.auth.getCurrentUser();
    if (u) {
      this.profileForm.patchValue({
        fullName: u.fullName ?? '',
        documentType: u.documentType ?? 'bi',
        documentNumber: u.documentNumber ?? '',
        province: u.province ?? '',
        email: u.email ?? '',
      });
    }
  }

  async saveProfile(): Promise<void> {
    this.profileMessage = '';
    this.profileMessageError = '';
    if (this.profileForm.invalid) return;
    this.savingProfile = true;
    const result = await this.auth.updateProfile(this.profileForm.getRawValue());
    this.savingProfile = false;
    if (result.ok) {
      this.profileMessage = 'Dados guardados com sucesso.';
      this.fillProfileForm();
    } else {
      this.profileMessageError = result.message ?? 'Erro ao guardar.';
    }
  }

  async changePhoneSubmit(): Promise<void> {
    this.phoneMessage = '';
    this.phoneMessageError = '';
    const { newPhone, currentPassword } = this.phoneForm.getRawValue();
    const normalized = normalizeMzPhoneDigits(newPhone);
    if (!normalized || normalized.length !== 9) {
      this.phoneMessageError = 'Introduza um contacto válido (9 dígitos).';
      return;
    }
    const current = this.auth.getCurrentUser()?.phone;
    if (current && normalizeMzPhoneDigits(current) === normalized) {
      this.phoneMessageError = 'O novo contacto deve ser diferente do actual.';
      return;
    }
    if (!currentPassword) {
      this.phoneMessageError = 'Introduza a senha actual para confirmar.';
      return;
    }
    this.savingPhone = true;
    const result = await this.auth.changePhone(currentPassword, normalized);
    this.savingPhone = false;
    if (result.ok) {
      this.phoneMessage = 'Contacto actualizado. Use o novo número no próximo login.';
      this.phoneForm.reset();
      this.fillProfileForm();
      return;
    }
    if (result.forceLogout || result.code === 'ACCOUNT_BLOCKED') {
      this.auth.logout();
      return;
    }
    this.phoneMessageError = result.message ?? 'Não foi possível alterar o contacto.';
  }

  async changePassword(): Promise<void> {
    this.message = '';
    this.messageError = '';
    if (this.form.invalid) {
      if (this.form.get('newPassword')?.value !== this.form.get('confirmPassword')?.value) {
        this.messageError = 'A nova senha e a confirmação não coincidem.';
      }
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.messageError = 'A nova senha e a confirmação não coincidem.';
      return;
    }
    const result = await this.auth.changePassword(currentPassword, newPassword);
    if (result.ok) {
      this.message = 'Senha alterada com sucesso.';
      this.form.reset();
    } else {
      this.messageError = result.message || 'Senha actual incorreta.';
    }
  }
}
