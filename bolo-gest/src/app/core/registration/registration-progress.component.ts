import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@app/core/i18n/translate.pipe';
import { LanguageService } from '@app/services/language.service';

@Component({
  selector: 'app-registration-progress',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './registration-progress.component.html',
  styleUrl: './registration-progress.component.scss',
})
export class RegistrationProgressComponent {
  @Input({ required: true }) currentStep!: 1 | 2 | 3;
  /** Texto por baixo da barra; se vazio, usa o padrão conforme o passo. */
  @Input() hint = '';

  readonly lang = inject(LanguageService);

  readonly steps = [
    { id: 1 as const, labelKey: 'register.progressStep1' },
    { id: 2 as const, labelKey: 'register.progressStep2' },
    { id: 3 as const, labelKey: 'register.progressStep3' },
  ];
}
