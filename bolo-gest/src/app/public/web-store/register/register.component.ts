import { Component, OnInit } from '@angular/core';
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
import { normalizeMzPhoneDigits } from '@app/validators/mz-phone.validator';
import { RegistrationFlowService } from '@app/core/registration/registration-flow.service';
import { RegistrationProgressComponent } from '@app/core/registration/registration-progress.component';
import { LegalDocumentModalComponent } from '@app/core/legal/legal-document-modal.component';
import { LegalDocumentId } from '@app/core/legal/legal-content';
import { PublicSiteNavComponent } from '../../web-page/public-site-nav/public-site-nav.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PublicSiteNavComponent,
    RegistrationProgressComponent,
    LegalDocumentModalComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  error = '';
  loading = false;
  form: FormGroup;
  readonly progressStep = 1 as const;
  readonly registerHeroImage = '/t%20(3).jpg';
  legalModalOpen = false;
  legalModalDocument: LegalDocumentId = 'terms';

  readonly provinces = PROVINCES;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private registrationFlow: RegistrationFlowService,
  ) {
    this.form = this.fb.nonNullable.group({
      fullName: ['', [Validators.required]],
      province: ['', [Validators.required]],
      phone: ['', [registerPhoneFormatValidator]],
      email: ['', [Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      dataTrue: [false as boolean, [Validators.requiredTrue]],
      acceptTerms: [false as boolean, [Validators.requiredTrue]],
    });
  }

  openLegalModal(documentId: LegalDocumentId): void {
    this.legalModalDocument = documentId;
    this.legalModalOpen = true;
  }

  closeLegalModal(): void {
    this.legalModalOpen = false;
  }

  ngOnInit(): void {
    if (this.registrationFlow.isActive()) {
      const phone = this.registrationFlow.getPhone();
      void this.router.navigate(['/choose-plan'], {
        queryParams: phone ? { phone, registered: '1' } : { registered: '1' },
        replaceUrl: true,
      });
    }
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
    const order = ['fullName', 'province', 'phone', 'email', 'password', 'dataTrue', 'acceptTerms'] as const;
    const names: Record<string, string> = {
      fullName: 'Nome completo',
      province: 'Província',
      phone: 'Contacto',
      email: 'Email',
      password: 'Senha da conta',
      dataTrue: 'Confirmação dos dados',
      acceptTerms: 'Termos e privacidade',
    };
    for (const key of order) {
      const c = this.form.get(key);
      if (c?.invalid && c?.errors) {
        if (c.errors['required']) return names[key] + ' é obrigatório.';
        if (c.errors['requiredTrue']) {
          if (key === 'acceptTerms') {
            return 'Deve aceitar os Termos de Utilização e a Política de Privacidade para criar conta.';
          }
          return 'Deve concordar que os dados fornecidos são verdadeiros.';
        }
        if (c.errors['email']) return 'Email inválido.';
        if (c.errors['mzPhone']) return 'Use 9 dígitos ou 12 com prefixo 258.';
        if (c.errors['minlength']) return names[key] + ' deve ter pelo menos 4 caracteres.';
      }
    }
    return 'Preencha todos os campos obrigatórios.';
  }

  async submit(): Promise<void> {
    this.error = '';
    if (!this.form.get('acceptTerms')?.value) {
      this.form.get('acceptTerms')?.markAsTouched();
      this.error = 'Deve aceitar os Termos de Utilização e a Política de Privacidade para criar conta.';
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        const msg = this.getFirstInvalidFieldMessage();
        if (msg && !msg.includes('Termos')) {
          this.error = msg;
        }
      }
      return;
    }
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
    const digits = normalizeMzPhoneDigits(raw.phone.replace(/\D/g, ''));
    const phone = digits.length === 9 ? digits : undefined;
    if (phone) {
      this.registrationFlow.startAfterRegister(phone);
    }
    void this.router.navigate(['/choose-plan'], {
      queryParams: phone ? { phone, registered: '1' } : { registered: '1' },
      replaceUrl: true,
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
