import { Component, computed, input, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { AdminStats } from '../models';

interface OverviewMetric {
  label: string;
  value: string;
  hint?: string;
  route?: string;
  accent: 'teal' | 'sky' | 'amber' | 'slate';
  icon: string;
}

@Component({
  selector: 'app-admin-kpi-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  providers: [DecimalPipe],
  templateUrl: './admin-kpi-section.component.html',
  styleUrl: './admin-kpi-section.component.scss',
})
export class AdminKpiSectionComponent {
  adminStats = input<AdminStats | null>(null);

  private readonly decimal = inject(DecimalPipe);

  private fmt(n: number | undefined): string {
    return this.decimal.transform(n ?? 0, '1.0-0') ?? '0';
  }

  readonly metrics = computed<OverviewMetric[]>(() => {
    const s = this.adminStats();
    if (!s) return [];
    const activeClients = (s.licensesPaid ?? 0) + (s.licensesTrial ?? 0);
    return [
      {
        label: 'Clientes activos',
        value: this.fmt(activeClients),
        hint: 'com licença válida agora',
        route: '/license-management',
        accent: 'teal',
        icon: 'clients',
      },
      {
        label: 'Encomendas',
        value: this.fmt(s.totalOrders),
        hint: 'realizadas na plataforma',
        route: '/admin-orders',
        accent: 'sky',
        icon: 'orders',
      },
      {
        label: 'Receita licenças',
        value: `${this.fmt(s.licenseRevenueThisMonth)} MZN`,
        hint: `total acumulado ${this.fmt(s.licenseRevenueTotal)} MZN`,
        accent: 'slate',
        icon: 'revenue',
      },
      {
        label: 'Aprovações pendentes',
        value: this.fmt(s.pendingApprovals),
        hint: 'aguardam a sua acção',
        route: '/admin-new-users',
        accent: 'amber',
        icon: 'pending',
      },
    ];
  });
}
