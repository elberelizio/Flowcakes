import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { AdminStats, KpiTile } from '../../models';

/**
 * Secção de KPIs do painel admin: totais (utilizadores, activos, receita) e acessos ao sistema.
 */
@Component({
  selector: 'app-admin-kpi-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-kpi-section.component.html',
  styleUrl: './admin-kpi-section.component.scss',
})
export class AdminKpiSectionComponent {
  kpiTiles = input.required<KpiTile[]>();
  adminStats = input<AdminStats | null>(null);
}
