import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DecimalPipe } from '@angular/common';
import { AdminDashboardService } from './admin-dashboard.service';
import type { AdminStats, KpiTile } from './models';
import { ADMIN_QUICK_ACTIONS } from './constants/quick-actions';
import { AdminKpiSectionComponent } from './components/admin-kpi-section/admin-kpi-section.component';
import { AdminChartsSectionComponent } from './components/admin-charts-section/admin-charts-section.component';
import { AdminQuickActionsSectionComponent } from './components/admin-quick-actions-section/admin-quick-actions-section.component';

/**
 * Shell do painel de administração.
 * Responsabilidades: carregar dados (via service), calcular KPIs, passar dados aos componentes de secção.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AdminKpiSectionComponent,
    AdminChartsSectionComponent,
    AdminQuickActionsSectionComponent,
  ],
  providers: [DecimalPipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly service = inject(AdminDashboardService);
  private readonly decimalPipe = inject(DecimalPipe);

  adminStats = signal<AdminStats | null>(null);
  revenueByMonth = signal<{ month: string; revenue: number }[]>([]);
  revenueThisMonth = signal(0);
  loading = signal(true);
  private readonly today = new Date();

  kpiTiles = computed<KpiTile[]>(() => {
    const stats = this.adminStats();
    const revenue = this.revenueThisMonth();
    if (!stats) return [];
    return [
      { id: 'users', label: 'Total utilizadores', value: stats.totalUsers ?? 0, meta: 'registados no sistema', cssClass: 'kpi-tile-users' },
      { id: 'active', label: 'Clientes activos', value: stats.licensesPaid ?? 0, meta: 'com licença paga e válida', cssClass: 'kpi-tile-active' },
      { id: 'blocked', label: 'Não activos', value: stats.licensesPending ?? 0, meta: 'sem licença ou pendentes', cssClass: 'kpi-tile-blocked' },
      {
        id: 'revenue',
        label: 'Receita este mês',
        value: this.decimalPipe.transform(revenue, '1.0-0') ?? '0',
        meta: 'MZN · todos os clientes',
        cssClass: 'kpi-tile-revenue',
      },
    ];
  });

  quickActions = signal(ADMIN_QUICK_ACTIONS);

  ngOnInit(): void {
    this.service.getStats().subscribe({
      next: (s) => {
        this.adminStats.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.service.getRevenueByMonth().subscribe({
      next: (list) => {
        const withNum = (list || []).map((x) => ({ month: x.month, revenue: Number(x.revenue) }));
        this.revenueByMonth.set(withNum);
        const key = `${this.today.getFullYear()}-${String(this.today.getMonth() + 1).padStart(2, '0')}`;
        const found = withNum.find((x) => x.month === key);
        this.revenueThisMonth.set(found ? found.revenue : 0);
      },
      error: () => {},
    });
  }
}
