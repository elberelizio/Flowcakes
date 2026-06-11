import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  input,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables, type TooltipItem, type ChartConfiguration } from 'chart.js';
import type { AdminStats, RevenueByMonthDto } from '../models';

Chart.register(...registerables);

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Verde — receita de licenças */
const COLOR_LICENSE = '#0f766e';

/** Laranja — lucro em encomendas */
const COLOR_ORDERS = '#ea580c';

@Component({
  selector: 'app-admin-charts-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-charts-section.component.html',
  styleUrl: './admin-charts-section.component.scss',
})
export class AdminChartsSectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartRevenueCompare') chartRevenueCompareRef!: ElementRef<HTMLCanvasElement>;

  ordersRevenueByMonth = input.required<RevenueByMonthDto[]>();
  licenseRevenueByMonth = input.required<RevenueByMonthDto[]>();
  adminStats = input<AdminStats | null>(null);

  private chartRevenue: Chart<'line'> | null = null;

  readonly periodLicenseTotal = computed(() =>
    this.sumLastMonths(this.licenseRevenueByMonth(), 12)
  );

  readonly periodOrdersTotal = computed(() =>
    this.sumLastMonths(this.ordersRevenueByMonth(), 12)
  );

  readonly licenseBreakdown = computed(() => {
    const s = this.adminStats();
    if (!s) return null;
    const paid = s.licensesPaid ?? 0;
    const trial = s.licensesTrial ?? 0;
    const pending = s.licensesPending ?? 0;
    if (paid === 0 && trial === 0 && pending === 0) return null;
    return { paid, trial, pending };
  });

  constructor() {
    effect(() => {
      this.ordersRevenueByMonth();
      this.licenseRevenueByMonth();
      this.adminStats();
      setTimeout(() => this.buildChart(), 80);
    });
  }

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnDestroy(): void {
    this.chartRevenue?.destroy();
  }

  formatMzn(value: number | undefined | null): string {
    const n = value ?? 0;
    return `${n.toLocaleString('pt-MZ', { maximumFractionDigits: 0 })} MZN`;
  }

  private sumLastMonths(rows: RevenueByMonthDto[], count: number): number {
    return [...rows]
      .reverse()
      .slice(-count)
      .reduce((acc, r) => acc + (Number(r.revenue) || 0), 0);
  }

  private buildChart(): void {
    const canvas = this.chartRevenueCompareRef?.nativeElement;
    if (!canvas) return;
    this.chartRevenue?.destroy();

    const orders = [...this.ordersRevenueByMonth()].reverse().slice(-12);
    const licenses = [...this.licenseRevenueByMonth()].reverse().slice(-12);
    const monthSet = new Set([...orders.map((d) => d.month), ...licenses.map((d) => d.month)]);
    const sortedMonths = [...monthSet].sort();
    const labels = sortedMonths.map((m) => this.formatMonthLabel(m));
    const orderMap = new Map(orders.map((d) => [d.month, Number(d.revenue) || 0]));
    const licMap = new Map(licenses.map((d) => [d.month, Number(d.revenue) || 0]));

    const ctx = canvas.getContext('2d');
    const h = canvas.parentElement?.clientHeight ?? 300;
    const gradLic = ctx ? this.waveGradient(ctx, h, COLOR_LICENSE, 0.38) : 'rgba(5, 150, 105, 0.2)';
    const gradOrd = ctx ? this.waveGradient(ctx, h, COLOR_ORDERS, 0.32) : 'rgba(234, 88, 12, 0.18)';

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Licenças',
            data: sortedMonths.map((m) => licMap.get(m) ?? 0),
            borderColor: COLOR_LICENSE,
            backgroundColor: gradLic,
            fill: true,
            tension: 0.45,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: COLOR_LICENSE,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHitRadius: 12,
            order: 1,
          },
          {
            label: 'Lucro encomendas',
            data: sortedMonths.map((m) => orderMap.get(m) ?? 0),
            borderColor: COLOR_ORDERS,
            backgroundColor: gradOrd,
            fill: true,
            tension: 0.45,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: COLOR_ORDERS,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHitRadius: 12,
            order: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        elements: {
          line: { capBezierPoints: true },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            padding: 14,
            cornerRadius: 10,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 13 },
            displayColors: true,
            boxWidth: 10,
            boxHeight: 10,
            boxPadding: 6,
            callbacks: {
              title: (items) => (items[0]?.label ? `Mês: ${items[0].label}` : ''),
              label: (c: TooltipItem<'line'>) => {
                const val = Number(c.raw);
                return ` ${c.dataset.label}: ${val.toLocaleString('pt-MZ', { maximumFractionDigits: 0 })} MZN`;
              },
              footer: (items) => {
                const sum = items.reduce((a, i) => a + Number(i.raw), 0);
                return sum > 0 ? `Total do mês: ${sum.toLocaleString('pt-MZ', { maximumFractionDigits: 0 })} MZN` : '';
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: '#475569',
              font: { size: 11, weight: 'bold' },
              maxRotation: 0,
            },
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: 'rgba(148, 163, 184, 0.18)', drawTicks: false },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
              padding: 8,
              callback: (v) => this.formatAxis(Number(v)),
            },
            title: {
              display: true,
              text: 'Montante (MZN)',
              color: '#94a3b8',
              font: { size: 10, weight: 'bold' },
              padding: { bottom: 4 },
            },
          },
        },
      },
    };

    this.chartRevenue = new Chart(canvas, config);
  }

  private waveGradient(
    ctx: CanvasRenderingContext2D,
    height: number,
    hex: string,
    topAlpha: number
  ): CanvasGradient {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    const r = parseInt(hex.slice(1, 3), 16);
    const gr = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    g.addColorStop(0, `rgba(${r}, ${gr}, ${b}, ${topAlpha})`);
    g.addColorStop(0.55, `rgba(${r}, ${gr}, ${b}, ${topAlpha * 0.35})`);
    g.addColorStop(1, `rgba(${r}, ${gr}, ${b}, 0)`);
    return g;
  }

  private formatAxis(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return `${value}`;
  }

  private formatMonthLabel(ym: string): string {
    if (!ym || ym.length < 7) return ym;
    const [, m] = ym.split('-');
    const i = parseInt(m, 10) - 1;
    return MONTHS[i] ?? m;
  }
}
