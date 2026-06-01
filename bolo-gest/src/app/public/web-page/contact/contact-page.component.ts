import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PublicSiteNavComponent } from '../public-site-nav/public-site-nav.component';

type ContactStep = 'form' | 'actions';

function requireEmailOrPhone(control: AbstractControl): ValidationErrors | null {
  const email = (control.get('email')?.value ?? '').toString().trim();
  const phone = (control.get('phone')?.value ?? '').toString().trim();
  return email || phone ? null : { contactRequired: true };
}

/** Página pública de contacto da empresa; envio via e-mail (sem backend). */
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

  readonly companyEmail = 'dap@gmail.com';
  readonly companyPhoneDisplay = '871 964 887';
  readonly companyPhoneE164 = '258871964887';

  readonly contactHeroImage = '/cofeiro.jpg';

  step: ContactStep = 'form';
  formError: string | null = null;
  mailtoHref = '';

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
    this.title.setTitle('Contacto — ChefControl');
  }

  onSubmit(): void {
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
    const subject = `[ChefControl] Reclamação — ${v.fullName}`;

    const bodyLines = [
      'Reclamação / contacto',
      `Nome: ${v.fullName}`,
      `E-mail: ${v.email.trim() || '—'}`,
      `Telefone (contacto): ${v.phone.trim() || '—'}`,
      '',
      'Mensagem:',
      v.message,
      '',
      '— Enviado a partir do formulário de contacto do site ChefControl.',
    ];
    const body = bodyLines.join('\n');

    this.mailtoHref = `mailto:${this.companyEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    this.step = 'actions';
  }

  resetForm(): void {
    this.step = 'form';
    this.formError = null;
    this.mailtoHref = '';
    this.form.reset({
      fullName: '',
      email: '',
      phone: '',
      message: '',
    });
  }

  async copyBodyToClipboard(): Promise<void> {
    const v = this.form.getRawValue();
    const text = [
      'Reclamação / contacto',
      `Nome: ${v.fullName}`,
      `E-mail: ${v.email}`,
      `Telefone: ${v.phone}`,
      '',
      v.message,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignorar — alguns browsers bloqueiam clipboard sem HTTPS */
    }
  }
}
