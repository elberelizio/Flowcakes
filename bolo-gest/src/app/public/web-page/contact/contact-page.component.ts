import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import { PublicSiteNavComponent } from '../public-site-nav/public-site-nav.component';

type ContactStep = 'form' | 'success';

function requireEmailOrPhone(control: AbstractControl): ValidationErrors | null {
  const email = (control.get('email')?.value ?? '').toString().trim();
  const phone = (control.get('phone')?.value ?? '').toString().trim();
  return email || phone ? null : { contactRequired: true };
}

/** Página pública de contacto da empresa; envio directo pela aplicação. */
@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PublicSiteNavComponent],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private title = inject(Title);
  private http = inject(HttpClient);

  readonly companyEmail = 'dap@gmail.com';
  readonly companyPhoneDisplay = '871 964 887';
  readonly companyPhoneE164 = '258871964887';

  readonly contactHeroImage = '/cofeiro.jpg';

  step: ContactStep = 'form';
  formError: string | null = null;
  submitting = false;
  successMessage = '';

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.email, Validators.maxLength(200)]],
      phone: ['', [Validators.pattern(/^[0-9+\s]{9,30}$/), Validators.maxLength(30)]],
      message: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(4000)]],
    },
    { validators: requireEmailOrPhone },
  );

  ngOnInit(): void {
    this.title.setTitle('Contacto — Flow Cakes');
  }

  async onSubmit(): Promise<void> {
    this.formError = null;

    if (this.form.hasError('contactRequired')) {
      this.formError = 'Indique o seu e-mail ou telefone para podermos responder.';
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (!this.formError) {
        this.formError = 'Verifique os campos assinalados.';
      }
      return;
    }

    const v = this.form.getRawValue();
    const pageUrl = typeof window !== 'undefined' ? window.location.href : null;

    try {
      this.submitting = true;
      const response = await firstValueFrom(
        this.http.post<{ message?: string }>(`${API_URL}/public/contact-messages`, {
          fullName: v.fullName.trim(),
          email: v.email.trim(),
          phone: v.phone.trim(),
          message: v.message.trim(),
          pageUrl,
        }),
      );
      this.successMessage =
        response?.message?.trim() ||
        'A sua reclamação ou pedido de contacto foi enviado com sucesso. A nossa equipa responderá em breve.';
      this.step = 'success';
    } catch {
      this.formError = 'Não foi possível enviar a mensagem agora. Tente novamente em alguns instantes.';
    } finally {
      this.submitting = false;
    }
  }

  resetForm(): void {
    this.step = 'form';
    this.formError = null;
    this.successMessage = '';
    this.form.reset({
      fullName: '',
      email: '',
      phone: '',
      message: '',
    });
  }
}
