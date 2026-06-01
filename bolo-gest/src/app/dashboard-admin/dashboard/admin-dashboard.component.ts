import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ADMIN_DASHBOARD_NAV } from './constants/dashboard-nav';
import { AdminDashboardService } from './admin-dashboard.service';
import type { AdminStats, RevenueByMonthDto } from './models';
import { AdminKpiSectionComponent } from './admin-kpi-section/admin-kpi-section.component';
import { AdminChartsSectionComponent } from './admin-charts-section/admin-charts-section.component';
import { AdminAlertsBarComponent } from './admin-alerts-bar/admin-alerts-bar.component';
import { AdminTreasuryService, type AdminAlerts } from '../services/admin-treasury.service';
import { AdminLoginSummaryPopupService } from '../services/admin-login-summary-popup.service';
import { AdminLoginSummaryModalComponent } from '../../login/admin-login-summary-modal/admin-login-summary-modal.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AdminKpiSectionComponent,
    AdminChartsSectionComponent,
    AdminAlertsBarComponent,
    AdminLoginSummaryModalComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  readonly navLinks = ADMIN_DASHBOARD_NAV;

  private readonly service = inject(AdminDashboardService);
  private readonly treasuryService = inject(AdminTreasuryService);
  readonly adminLoginSummaryPopup = inject(AdminLoginSummaryPopupService);

  adminStats = signal<AdminStats | null>(null);
  ordersRevenueByMonth = signal<RevenueByMonthDto[]>([]);
  licenseRevenueByMonth = signal<RevenueByMonthDto[]>([]);
  alerts = signal<AdminAlerts | null>(null);
  loading = signal(true);
  lastUpdated = signal<Date | null>(null);

  ngOnInit(): void {
    this.adminLoginSummaryPopup.tryShowOnDashboard();

    this.service.getStats().subscribe({
      next: (s) => {
        this.adminStats.set(s);
        this.loading.set(false);
        this.lastUpdated.set(new Date());
      },
      error: () => this.loading.set(false),
    });

    this.service.getRevenueByMonth().subscribe({
      next: (list) =>
        this.ordersRevenueByMonth.set((list ?? []).map((x) => ({ month: x.month, revenue: Number(x.revenue) }))),
      error: () => {},
    });

    this.service.getLicenseRevenueByMonth().subscribe({
      next: (list) =>
        this.licenseRevenueByMonth.set((list ?? []).map((x) => ({ month: x.month, revenue: Number(x.revenue) }))),
      error: () => {},
    });

    this.treasuryService.getAlerts().subscribe({
      next: (a) => this.alerts.set(a),
      error: () => this.alerts.set(null),
    });
  }

  formatDateTime(d: Date): string {
    return d.toLocaleString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
