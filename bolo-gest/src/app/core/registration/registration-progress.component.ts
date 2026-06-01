import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registration-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registration-progress.component.html',
  styleUrl: './registration-progress.component.scss',
})
export class RegistrationProgressComponent {
  @Input({ required: true }) currentStep!: 1 | 2 | 3;
  /** Texto por baixo da barra; se vazio, usa o padrão conforme o passo. */
  @Input() hint = '';

  readonly steps = [
    { id: 1 as const, label: 'Criar conta' },
    { id: 2 as const, label: 'Escolher plano' },
    { id: 3 as const, label: 'Finalização da conta' },
  ];
}
