import { Component, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { AdminRankingRow } from '../models';

@Component({
  selector: 'app-admin-ranking-section',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './admin-ranking-section.component.html',
  styleUrl: './admin-ranking-section.component.scss',
})
export class AdminRankingSectionComponent {
  ranking = input.required<AdminRankingRow[]>();

  licenseLabel(status: string): string {
    switch (status) {
      case 'paid':
        return 'Paga';
      case 'trial':
        return 'Teste';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  }
}
