import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PROVINCES } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  form!: FormGroup;
  message = '';
  messageError = '';
  profileMessage = '';
  profileMessageError = '';
  savingProfile = false;
  readonly provinces = PROVINCES;

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
  }

  ngOnInit(): void {
    this.fillProfileForm();
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
      this.messageError = result.message || 'Senha atual incorreta.';
    }
  }
}
