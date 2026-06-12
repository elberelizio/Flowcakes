import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '@app/core/config/api.config';
import { PublicSiteNavComponent } from '../public-site-nav/public-site-nav.component';
import {
  FORM_MESSAGE_DISALLOWED,
  FORM_MESSAGE_USAGE_HINT,
  FORM_NAME_DISALLOWED,
  FORM_NAME_USAGE_HINT,
  applySanitizedInput,
  sanitizeFormMessage,
  sanitizeFormName,
} from '@app/core/text/public-form-text.rules';

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
export class ContactPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private title = inject(Title);
  private http = inject(HttpClient);

  readonly companyEmail = 'dap@gmail.com';
  readonly companyPhoneDisplay = '871 964 887';
  readonly companyPhoneE164 = '258871964887';
  readonly contactHeroImage = '/cofeiro.jpg';
  readonly formNameUsageHint = FORM_NAME_USAGE_HINT;
  readonly formMessageUsageHint = FORM_MESSAGE_USAGE_HINT;
  readonly maxMessageChars = 4000;

  step: ContactStep = 'form';
  formHint: string | null = null;
  formError: string | null = null;
  submitting = false;
  successMessage = '';
  nameUsageActive = false;
  messageUsageActive = false;
  messageCharCount = 0;
  private nameUsageTimer: ReturnType<typeof setTimeout> | null = null;
  private messageUsageTimer: ReturnType<typeof setTimeout> | null = null;

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

  ngOnDestroy(): void {
    this.clearUsageTimers();
  }

  onFullNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const { value, removedChars } = applySanitizedInput(input, FORM_NAME_DISALLOWED);
    this.form.controls.fullName.setValue(value, { emitEvent: false });
    if (removedChars) {
      this.flashNameUsage();
    }
  }

  onMessageInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    const { value, removedChars } = applySanitizedInput(input, FORM_MESSAGE_DISALLOWED, this.maxMessageChars);
    this.form.controls.message.setValue(value, { emitEvent: false });
    this.messageCharCount = value.length;
    if (removedChars) {
      this.flashMessageUsage();
    }
  }

  async onSubmit(): Promise<void> {
    this.formHint = null;
    this.formError = null;

    const rawName = this.form.controls.fullName.value;
    const rawMessage = this.form.controls.message.value;
    const fullName = sanitizeFormName(rawName).trim();
    const message = sanitizeFormMessage(rawMessage, this.maxMessageChars).trim();
    if (sanitizeFormName(rawName) !== rawName) {
      this.flashNameUsage();
    }
    if (sanitizeFormMessage(rawMessage, this.maxMessageChars) !== rawMessage) {
      this.flashMessageUsage();
    }
    this.form.controls.fullName.setValue(fullName, { emitEvent: false });
    this.form.controls.message.setValue(message, { emitEvent: false });
    this.messageCharCount = message.length;

    if (this.form.hasError('contactRequired')) {
      this.formHint = 'Indique e-mail ou telefone para podermos responder.';
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (!this.formHint) {
        if (this.form.controls.fullName.invalid) {
          this.formHint = 'Preencha o nome para continuar.';
        } else if (this.form.controls.email.invalid) {
          this.formHint = 'Verifique o formato do e-mail (ex.: nome@dominio.com).';
        } else if (this.form.controls.phone.invalid) {
          this.formHint = 'Use apenas números, espaços e + no telefone.';
        } else if (this.form.controls.message.hasError('minlength')) {
          this.formHint = 'A mensagem deve ter pelo menos 15 caracteres.';
        } else if (this.form.controls.message.invalid) {
          this.formHint = 'Escreva a mensagem antes de continuar.';
        } else {
          this.formHint = 'Verifique os campos assinalados.';
        }
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
    this.clearUsageTimers();
    this.step = 'form';
    this.formHint = null;
    this.formError = null;
    this.successMessage = '';
    this.nameUsageActive = false;
    this.messageUsageActive = false;
    this.messageCharCount = 0;
    this.form.reset({
      fullName: '',
      email: '',
      phone: '',
      message: '',
    });
  }

  private flashNameUsage(): void {
    this.nameUsageActive = true;
    if (this.nameUsageTimer) {
      clearTimeout(this.nameUsageTimer);
    }
    this.nameUsageTimer = setTimeout(() => {
      this.nameUsageActive = false;
      this.nameUsageTimer = null;
    }, 4000);
  }

  private flashMessageUsage(): void {
    this.messageUsageActive = true;
    if (this.messageUsageTimer) {
      clearTimeout(this.messageUsageTimer);
    }
    this.messageUsageTimer = setTimeout(() => {
      this.messageUsageActive = false;
      this.messageUsageTimer = null;
    }, 4000);
  }

  private clearUsageTimers(): void {
    if (this.nameUsageTimer) {
      clearTimeout(this.nameUsageTimer);
      this.nameUsageTimer = null;
    }
    if (this.messageUsageTimer) {
      clearTimeout(this.messageUsageTimer);
      this.messageUsageTimer = null;
    }
  }
}
