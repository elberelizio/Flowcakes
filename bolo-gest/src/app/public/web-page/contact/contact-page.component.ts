import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PublicSiteNavComponent } from '../public-site-nav/public-site-nav.component';

type ContactStep = 'form' | 'actions';

/** Página pública de contacto: reclamações, sugestões; envio via cliente de e-mail / SMS (sem backend). */
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

  /** Destino de e-mail (equipa ChefControl). */
  readonly supportEmail = 'suporte@chefcontrol.co.mz';

  /** Destino SMS — apenas dígitos com indicativo, ex.: 258841234567 */
  readonly supportPhoneE164 = '258840000000';

  step: ContactStep = 'form';
  formError: string | null = null;
  mailtoHref = '';
  smsHref = '';

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.email, Validators.maxLength(200)]],
    phone: ['', [Validators.maxLength(30)]],
    messageKind: this.fb.nonNullable.control<'reclamacao' | 'melhoria'>('melhoria', Validators.required),
    channelEmail: this.fb.nonNullable.control(true),
    channelSms: this.fb.nonNullable.control(false),
    message: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(4000)]],
  });

  ngOnInit(): void {
    this.title.setTitle('Contacto — ChefControl');
  }

  onSubmit(): void {
    this.formError = null;
    const chEmail = this.form.controls.channelEmail.value;
    const chSms = this.form.controls.channelSms.value;

    if (!chEmail && !chSms) {
      this.formError = 'Seleccione pelo menos um meio: e-mail ou SMS.';
      return;
    }

    const emailCtl = this.form.controls.email;
    const phoneCtl = this.form.controls.phone;
    if (chEmail) {
      emailCtl.setValidators([Validators.required, Validators.email, Validators.maxLength(200)]);
    } else {
      emailCtl.setValidators([Validators.email, Validators.maxLength(200)]);
    }
    if (chSms) {
      phoneCtl.setValidators([Validators.required, Validators.pattern(/^[0-9+\s]{9,30}$/), Validators.maxLength(30)]);
    } else {
      phoneCtl.setValidators([Validators.maxLength(30)]);
    }
    emailCtl.updateValueAndValidity();
    phoneCtl.updateValueAndValidity();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const kindLabel = v.messageKind === 'reclamacao' ? 'Reclamação' : 'Melhorias / sugestão';
    const subject = `[ChefControl] ${kindLabel} — ${v.fullName}`;

    const bodyLines = [
      `Tipo: ${kindLabel}`,
      `Nome: ${v.fullName}`,
      `E-mail: ${v.email || '—'}`,
      `Telefone (contacto): ${v.phone || '—'}`,
      '',
      'Mensagem:',
      v.message,
      '',
      '— Enviado a partir do formulário de contacto do site ChefControl.',
    ];
    const body = bodyLines.join('\n');

    if (chEmail) {
      this.mailtoHref = `mailto:${this.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      this.mailtoHref = '';
    }

    if (chSms) {
      const digits = this.supportPhoneE164.replace(/\D/g, '');
      const smsText = this.buildSmsBody(v.fullName, kindLabel, v.message);
      this.smsHref = `sms:${digits}?body=${encodeURIComponent(smsText)}`;
    } else {
      this.smsHref = '';
    }

    this.step = 'actions';
  }

  private buildSmsBody(fullName: string, kindLabel: string, message: string): string {
    const max = 480;
    const head = `ChefControl | ${kindLabel} | ${fullName}\n`;
    let rest = message.trim();
    if (head.length + rest.length > max) {
      rest = rest.slice(0, Math.max(0, max - head.length - 20)) + '… [ver e-mail]';
    }
    return head + rest;
  }

  resetForm(): void {
    this.step = 'form';
    this.formError = null;
    this.mailtoHref = '';
    this.smsHref = '';
    this.form.reset({
      fullName: '',
      email: '',
      phone: '',
      messageKind: 'melhoria',
      channelEmail: true,
      channelSms: false,
      message: '',
    });
  }

  async copyBodyToClipboard(): Promise<void> {
    const v = this.form.getRawValue();
    const kindLabel = v.messageKind === 'reclamacao' ? 'Reclamação' : 'Melhorias / sugestão';
    const text = [
      `Tipo: ${kindLabel}`,
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
