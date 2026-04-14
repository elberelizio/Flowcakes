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
import { Chart, registerables } from 'chart.js';
import type { AdminStats, RevenueByMonthDto } from '../models';

Chart.register(...registerables);

/**
 * Secção de gráficos do painel admin: receita por mês, distribuição de licenças, actividade hoje.
 */
@Component({
  selector: 'app-admin-charts-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-charts-section.component.html',
  styleUrl: './admin-charts-section.component.scss',
})
export class AdminChartsSectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartRevenueMonth') chartRevenueMonthRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartLicenses') chartLicensesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartActivity') chartActivityRef!: ElementRef<HTMLCanvasElement>;

  revenueByMonth = input.required<RevenueByMonthDto[]>();
  adminStats = input<AdminStats | null>(null);

  private chartRevenueMonth: Chart<'bar'> | null = null;
  private chartLicenses: Chart<'doughnut'> | null = null;
  private chartActivity: Chart<'bar'> | null = null;

  constructor() {
    effect(() => {
      this.revenueByMonth();
      this.adminStats();
      setTimeout(() => {
        this.buildRevenueMonthChart();
        this.buildLicensesChart();
        this.buildActivityChart();
      }, 100);
    });
  }

  ngAfterViewInit(): void {
    this.buildRevenueMonthChart();
  }

  ngOnDestroy(): void {
    this.chartRevenueMonth?.destroy();
    this.chartLicenses?.destroy();
    this.chartActivity?.destroy();
  }

  private buildRevenueMonthChart(): void {
    const data = this.revenueByMonth();
    if (!data.length || !this.chartRevenueMonthRef?.nativeElement) return;
    const prev = this.chartRevenueMonth;
    if (prev) prev.destroy();
    this.chartRevenueMonth = null;
    const reversed = [...data].reverse();
    const labels = reversed.map((d) => this.formatMonthLabel(d.month));
    const values = reversed.map((d) => d.revenue);
    this.chartRevenueMonth = new Chart(this.chartRevenueMonthRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Receita (MZN)',
            data: values,
            backgroundColor: 'rgba(13, 148, 136, 0.75)',
            borderColor: 'rgb(13, 148, 136)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${Number(ctx.raw).toFixed(2)} MZN`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => (typeof v === 'number' ? v.toFixed(0) + ' MZN' : v) },
          },
        },
      },
    });
  }

  private buildLicensesChart(): void {
    const stats = this.adminStats();
    if (!stats || !this.chartLicensesRef?.nativeElement) return;
    const paid = stats.licensesPaid ?? 0;
    const trial = stats.licensesTrial ?? 0;
    const pending = stats.licensesPending ?? 0;
    const prev = this.chartLicenses;
    if (prev) prev.destroy();
    this.chartLicenses = null;
    if (paid === 0 && trial === 0 && pending === 0) return;
    this.chartLicenses = new Chart(this.chartLicensesRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Pagas', 'Teste', 'Pendentes'],
        datasets: [
          {
            data: [paid, trial, pending],
            backgroundColor: ['#059669', '#6366f1', '#d97706'],
            borderColor: ['#059669', '#6366f1', '#d97706'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  private buildActivityChart(): void {
    const stats = this.adminStats();
    if (!this.chartActivityRef?.nativeElement) return;
    const logins = stats?.loginsToday ?? 0;
    const unique = stats?.uniqueUsersToday ?? 0;
    const prev = this.chartActivity;
    if (prev) prev.destroy();
    this.chartActivity = null;
    this.chartActivity = new Chart(this.chartActivityRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Logins hoje', 'Utilizadores únicos'],
        datasets: [
          {
            label: 'Quantidade',
            data: [logins, unique],
            backgroundColor: ['rgba(99, 102, 241, 0.7)', 'rgba(13, 148, 136, 0.7)'],
            borderColor: ['rgb(99, 102, 241)', 'rgb(13, 148, 136)'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  private formatMonthLabel(ym: string): string {
    if (!ym || ym.length < 7) return ym;
    const [, m] = ym.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const i = parseInt(m, 10) - 1;
    return months[i] ?? m;
  }
}
