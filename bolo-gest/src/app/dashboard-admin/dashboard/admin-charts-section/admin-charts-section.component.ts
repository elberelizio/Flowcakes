import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  input,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables, type TooltipItem } from 'chart.js';
import type { AdminStats, RevenueByMonthDto } from '../models';

Chart.register(...registerables);

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

@Component({
  selector: 'app-admin-charts-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-charts-section.component.html',
  styleUrl: './admin-charts-section.component.scss',
})
export class AdminChartsSectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartRevenueCompare') chartRevenueCompareRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartLicenses') chartLicensesRef!: ElementRef<HTMLCanvasElement>;

  ordersRevenueByMonth = input.required<RevenueByMonthDto[]>();
  licenseRevenueByMonth = input.required<RevenueByMonthDto[]>();
  adminStats = input<AdminStats | null>(null);

  private chartRevenueCompare: Chart | null = null;
  private chartLicenses: Chart | null = null;

  constructor() {
    effect(() => {
      this.ordersRevenueByMonth();
      this.licenseRevenueByMonth();
      this.adminStats();
      setTimeout(() => this.rebuildAll(), 80);
    });
  }

  ngAfterViewInit(): void {
    this.rebuildAll();
  }

  ngOnDestroy(): void {
    this.chartRevenueCompare?.destroy();
    this.chartLicenses?.destroy();
  }

  private rebuildAll(): void {
    this.buildRevenueCompareChart();
    this.buildLicensesChart();
  }

  private buildRevenueCompareChart(): void {
    const canvas = this.chartRevenueCompareRef?.nativeElement;
    if (!canvas) return;
    this.chartRevenueCompare?.destroy();

    const orders = [...this.ordersRevenueByMonth()].reverse().slice(-12);
    const licenses = [...this.licenseRevenueByMonth()].reverse().slice(-12);
    const monthSet = new Set([...orders.map((d) => d.month), ...licenses.map((d) => d.month)]);
    const labels = [...monthSet].sort().map((m) => this.formatMonthLabel(m));
    const orderMap = new Map(orders.map((d) => [d.month, d.revenue]));
    const licMap = new Map(licenses.map((d) => [d.month, d.revenue]));
    const sortedMonths = [...monthSet].sort();

    this.chartRevenueCompare = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Licenças (MZN)',
            data: sortedMonths.map((m) => licMap.get(m) ?? 0),
            borderColor: '#14b8a6',
            backgroundColor: 'rgba(20, 184, 166, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
          },
          {
            label: 'Lucro encomendas (MZN)',
            data: sortedMonths.map((m) => orderMap.get(m) ?? 0),
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129, 140, 248, 0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
          },
        ],
      },
      options: this.lineOptions(),
    });
  }

  private buildLicensesChart(): void {
    const canvas = this.chartLicensesRef?.nativeElement;
    const stats = this.adminStats();
    if (!canvas || !stats) return;
    const paid = stats.licensesPaid ?? 0;
    const trial = stats.licensesTrial ?? 0;
    const pending = stats.licensesPending ?? 0;
    if (paid === 0 && trial === 0 && pending === 0) return;

    this.chartLicenses?.destroy();
    this.chartLicenses = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Pagas', 'Teste', 'Pendentes'],
        datasets: [
          {
            data: [paid, trial, pending],
            backgroundColor: ['#14b8a6', '#818cf8', '#fbbf24'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#64748b', font: { size: 10 }, boxWidth: 10, padding: 8 },
          },
        },
      },
    });
  }

  private lineOptions(): object {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: '#64748b', usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 10 } },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          callbacks: {
            label: (ctx: TooltipItem<'line'>) =>
              `${ctx.dataset.label}: ${Number(ctx.raw).toFixed(0)} MZN`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: { color: '#64748b', font: { size: 10 } },
        },
      },
    };
  }

  private formatMonthLabel(ym: string): string {
    if (!ym || ym.length < 7) return ym;
    const [, m] = ym.split('-');
    const i = parseInt(m, 10) - 1;
    return MONTHS[i] ?? m;
  }
}
