import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StoreSettingsService } from '../../services/store-settings.service';
import { IconComponent } from '../../ui/icon/icon.component';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.scss',
})
export class ConfiguracoesComponent implements OnInit {
  form!: FormGroup;
  loading = true;
  saving = false;
  message = '';
  messageError = '';
  copyFeedback = false;
  private readonly STORE_EXTRA_KEY = 'chefcontrol_store_extra';

  constructor(
    private storeSettings: StoreSettingsService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.nonNullable.group({
      storeName: ['Minha Loja', [Validators.required, Validators.maxLength(200)]],
      storeTagline: ['', [Validators.maxLength(300)]],
      storeDescription: ['', [Validators.maxLength(2000)]],
      storePhone: ['', [Validators.maxLength(50)]],
      storeWhatsapp: ['', [Validators.maxLength(50)]],
      storeInstagram: ['', [Validators.maxLength(100)]],
      storeAddress: ['', [Validators.maxLength(500)]],
      storeEmail: ['', [Validators.maxLength(255)]],
      storeHours: ['', [Validators.maxLength(300)]],
      storeFooterTagline: ['', [Validators.maxLength(400)]],
      storeSlug: ['', [Validators.maxLength(100), Validators.pattern(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$|^$/)]],
      // Aparência (só frontend – guardado em localStorage)
      storeHeroImage1: ['', [Validators.maxLength(500)]],
      storeHeroImage2: ['', [Validators.maxLength(500)]],
      storeHeroImage3: ['', [Validators.maxLength(500)]],
      storePrimaryColor: ['#0d9488', [Validators.maxLength(20)]],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.messageError = '';
    try {
      const s = await this.storeSettings.getMyStoreSettings();
      this.form.patchValue({
        storeName: s.storeName ?? 'Minha Loja',
        storeTagline: s.storeTagline ?? '',
        storeDescription: s.storeDescription ?? '',
        storePhone: s.storePhone ?? '',
        storeWhatsapp: s.storeWhatsapp ?? '',
        storeInstagram: s.storeInstagram ?? '',
        storeAddress: s.storeAddress ?? '',
        storeEmail: s.storeEmail ?? '',
        storeHours: s.storeHours ?? '',
        storeFooterTagline: s.storeFooterTagline ?? '',
        storeSlug: s.storeSlug ?? '',
      });
      // Carregar aparência (só frontend, localStorage)
      try {
        const extra = localStorage.getItem(this.STORE_EXTRA_KEY);
        if (extra) {
          const data = JSON.parse(extra);
          this.form.patchValue({
            storeHeroImage1: data.storeHeroImage1 ?? '',
            storeHeroImage2: data.storeHeroImage2 ?? '',
            storeHeroImage3: data.storeHeroImage3 ?? '',
            storePrimaryColor: data.storePrimaryColor ?? '#0d9488',
          });
        }
      } catch (_) {}
    } catch (_) {
      this.messageError = 'Erro ao carregar as definições. A tabela user_store_settings pode não existir — execute o script 13_user_store_settings.sql e 14_store_settings_more_fields.sql.';
    } finally {
      this.loading = false;
    }
  }

  onSlugInput(): void {
    const ctrl = this.form.get('storeSlug');
    if (ctrl?.value) {
      ctrl.setValue(ctrl.value.toLowerCase().replace(/[^a-z0-9-]/g, ''), { emitEvent: false });
    }
  }

  async save(): Promise<void> {
    this.message = '';
    this.messageError = '';
    if (this.form.invalid) return;
    const slug = (this.form.get('storeSlug')?.value ?? '').trim();
    if (slug && slug.length < 3) {
      this.messageError = 'O identificador do site deve ter pelo menos 3 caracteres.';
      return;
    }
    this.saving = true;
    try {
      const raw = this.form.getRawValue();
      const apiData = {
        storeName: raw.storeName, storeTagline: raw.storeTagline, storeDescription: raw.storeDescription,
        storePhone: raw.storePhone, storeWhatsapp: raw.storeWhatsapp, storeInstagram: raw.storeInstagram,
        storeAddress: raw.storeAddress, storeEmail: raw.storeEmail, storeHours: raw.storeHours,
        storeFooterTagline: raw.storeFooterTagline, storeSlug: raw.storeSlug,
      };
      await this.storeSettings.updateStoreSettings(apiData);
      // Guardar aparência em localStorage (só frontend)
      try {
        localStorage.setItem(this.STORE_EXTRA_KEY, JSON.stringify({
          storeHeroImage1: raw.storeHeroImage1 || '',
          storeHeroImage2: raw.storeHeroImage2 || '',
          storeHeroImage3: raw.storeHeroImage3 || '',
          storePrimaryColor: raw.storePrimaryColor || '#0d9488',
        }));
      } catch (_) {}
      this.message = 'Definições guardadas com sucesso.';
      await this.load();
    } catch (err: unknown) {
      const e = err as { error?: { message?: string }; status?: number };
      this.messageError = e?.error?.message ?? 'Erro ao guardar. Este identificador pode já estar em uso.';
    } finally {
      this.saving = false;
    }
  }

  copyUrl(): void {
    const url = this.storeUrl;
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.copyFeedback = true;
        setTimeout(() => this.copyFeedback = false, 2000);
      });
    }
  }

  /** Background do hero na preview: primeira imagem ou gradiente. */
  heroPreviewBg(): string {
    const img = this.form.get('storeHeroImage1')?.value?.trim();
    if (img) return `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.2)), url(${img})`;
    return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%)';
  }

  get storeUrl(): string {
    const slug = this.form.get('storeSlug')?.value?.trim();
    if (!slug) return '';
    const base = window.location.origin;
    return `${base}/loja/${slug}`;
  }
}
