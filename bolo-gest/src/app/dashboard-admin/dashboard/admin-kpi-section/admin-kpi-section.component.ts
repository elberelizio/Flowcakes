import { Component, computed, input, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { AdminStats } from '../models';

interface OverviewMetric {
  label: string;
  value: string;
  hint?: string;
  route?: string;
  accent?: 'teal' | 'amber' | 'indigo' | 'rose' | 'slate';
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

  readonly heroMetrics = computed<OverviewMetric[]>(() => {
    const s = this.adminStats();
    if (!s) return [];
    return [
      {
        label: 'Utilizadores',
        value: this.fmt(s.totalUsers),
        hint: 'registados',
        accent: 'indigo',
      },
      {
        label: 'Clientes activos',
        value: this.fmt((s.licensesPaid ?? 0) + (s.licensesTrial ?? 0)),
        hint: 'licença válida',
        accent: 'teal',
      },
      {
        label: 'Receita licenças',
        value: `${this.fmt(s.licenseRevenueThisMonth)} MZN`,
        hint: `mês · total ${this.fmt(s.licenseRevenueTotal)}`,
        accent: 'teal',
      },
      {
        label: 'Pendentes',
        value: this.fmt(s.pendingApprovals),
        hint: 'aprovações',
        route: '/admin-novos-utilizadores',
        accent: 'amber',
      },
    ];
  });

  readonly detailMetrics = computed<OverviewMetric[]>(() => {
    const s = this.adminStats();
    if (!s) return [];
    const topName = s.topProfitUserName?.trim() || '—';
    const topShort = topName.length > 16 ? topName.slice(0, 14) + '…' : topName;
    return [
      { label: 'Online agora', value: this.fmt(s.usersOnline), accent: 'teal' },
      { label: 'Bloqueados', value: this.fmt(s.blockedUsers), route: '/admin-configuracoes/acessos', accent: 'rose' },
      { label: 'Logins hoje', value: this.fmt(s.loginsToday), accent: 'slate' },
      { label: 'Únicos hoje', value: this.fmt(s.uniqueUsersToday), accent: 'slate' },
      {
        label: 'Uso médio (30d)',
        value: (s.avgLoginsPerUser30d ?? 0).toFixed(1),
        hint: 'logins / activo',
        accent: 'indigo',
      },
      {
        label: 'Top lucro',
        value: topShort,
        hint: `${this.fmt(s.topProfitAmount)} MZN`,
        route: '/admin-ranking',
        accent: 'amber',
      },
    ];
  });

  readonly quickLinks = [
    { route: '/admin-novos-utilizadores', label: 'Aprovações' },
    { route: '/gestao-licencas', label: 'Licenças' },
    { route: '/tesouraria', label: 'Tesouraria' },
    { route: '/admin-configuracoes/sugestoes', label: 'Sugestões' },
    { route: '/admin-configuracoes/logs', label: 'Logs' },
    { route: '/admin-ranking', label: 'Ranking' },
  ];
}
