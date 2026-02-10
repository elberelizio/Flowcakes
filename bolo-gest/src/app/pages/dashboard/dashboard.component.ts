import {
  Component,
  computed,
  effect,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { orderDisplayName, orderDisplaySize } from '../../models/order.model';
import { API_URL } from '../../core/api.config';

Chart.register(...registerables);

interface AdminStats {
  totalUsers: number;
  licensesPaid: number;
  licensesPending: number;
}

interface RevenueByMonthDto {
  month: string;
  revenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartProfit') chartProfitRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPayment') chartPaymentRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartRevenueMonth') chartRevenueMonthRef!: ElementRef<HTMLCanvasElement>;

  private orders = inject(OrdersService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  today = new Date();
  isAdmin = false;
  adminStats = signal<AdminStats | null>(null);
  revenueByMonth = signal<RevenueByMonthDto[]>([]);
  adminLoading = signal(true);

  dayOrders = computed(() => this.orders.ordersOfDay(this.today));
  weekOrders = computed(() => this.orders.ordersOfWeek(this.today));
  profitDay = computed(() =>
    this.orders.totalProfit(this.orders.ordersOfDay(this.today))
  );
  profitWeek = computed(() =>
    this.orders.totalProfit(this.orders.ordersOfWeek(this.today))
  );
  profitMonth = computed(() =>
    this.orders.totalProfit(this.orders.ordersOfMonth(this.today))
  );
  pendingOrders = computed(() => this.orders.ordersWithPendingBalance());
  last7Days = computed(() => this.orders.getLast7DaysStats());
  paymentCounts = computed(() => this.orders.getPaymentStatusCounts());

  revenueThisMonth = computed(() => {
    const list = this.revenueByMonth();
    const [y, m] = [this.today.getFullYear(), String(this.today.getMonth() + 1).padStart(2, '0')];
    const key = `${y}-${m}`;
    const found = list.find((x) => x.month === key);
    return found ? found.revenue : 0;
  });

  getProductName = orderDisplayName;
  getProductSize = orderDisplaySize;

  private chartProfit: Chart<'bar'> | null = null;
  private chartPayment: Chart<'doughnut'> | null = null;
  private chartRevenueMonth: Chart<'bar'> | null = null;

  constructor() {
    this.isAdmin = this.auth.isAdmin();
    effect(() => {
      this.last7Days();
      this.paymentCounts();
      this.updateCharts();
    });
  }

  ngOnInit(): void {
    if (this.isAdmin) {
      this.http.get<AdminStats>(`${API_URL}/admin/stats`).subscribe({
        next: (s) => {
          this.adminStats.set(s);
          this.adminLoading.set(false);
        },
        error: () => this.adminLoading.set(false),
      });
      this.http.get<RevenueByMonthDto[]>(`${API_URL}/admin/revenue-by-month`).subscribe({
        next: (list) => {
          const withNum = (list || []).map((x) => ({ month: x.month, revenue: Number(x.revenue) }));
          this.revenueByMonth.set(withNum);
          setTimeout(() => this.buildRevenueMonthChart(), 100);
        },
        error: () => {},
      });
    }
  }

  ngAfterViewInit(): void {
    if (!this.isAdmin) this.initCharts();
  }

  ngOnDestroy(): void {
    this.chartProfit?.destroy();
    this.chartPayment?.destroy();
    this.chartRevenueMonth?.destroy();
  }

  private initCharts(): void {
    if (this.chartProfitRef?.nativeElement) {
      this.chartProfit = new Chart(this.chartProfitRef.nativeElement, this.getProfitChartConfig());
    }
    if (this.chartPaymentRef?.nativeElement) {
      this.chartPayment = new Chart(this.chartPaymentRef.nativeElement, this.getPaymentChartConfig());
    }
  }

  private buildRevenueMonthChart(): void {
    const data = this.revenueByMonth();
    if (!data.length || !this.chartRevenueMonthRef?.nativeElement) return;
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
            backgroundColor: 'rgba(37, 99, 235, 0.7)',
            borderColor: 'rgb(37, 99, 235)',
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

  formatMonthLabel(ym: string): string {
    if (!ym || ym.length < 7) return ym;
    const [, m] = ym.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const i = parseInt(m, 10) - 1;
    return months[i] ?? m;
  }

  private getProfitChartConfig(): ChartConfiguration<'bar'> {
    const stats = this.last7Days();
    return {
      type: 'bar',
      data: {
        labels: stats.map((s) => s.label),
        datasets: [
          {
            label: 'Lucro (MZN)',
            data: stats.map((s) => s.profit),
            backgroundColor: 'rgba(194, 65, 12, 0.7)',
            borderColor: 'rgb(194, 65, 12)',
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
              afterLabel: (ctx) => {
                const i = ctx.dataIndex;
                const count = stats[i]?.count ?? 0;
                return `Pedidos: ${count}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => v + ' MZN' },
          },
        },
      },
    };
  }

  private getPaymentChartConfig(): ChartConfiguration<'doughnut'> {
    const c = this.paymentCounts();
    const total = c.pendente + c.parcial + c.pago;
    return {
      type: 'doughnut',
      data: {
        labels: ['Pendente', 'Parcial', 'Pago'],
        datasets: [
          {
            data: [c.pendente, c.parcial, c.pago],
            backgroundColor: ['#fecaca', '#fef08a', '#bbf7d0'],
            borderColor: ['#b91c1c', '#a16207', '#15803d'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw as number;
                const p = total ? ((v / total) * 100).toFixed(0) : 0;
                return `${ctx.label}: ${v} (${p}%)`;
              },
            },
          },
        },
      },
    };
  }

  private updateCharts(): void {
    if (this.chartProfit && this.chartProfitRef?.nativeElement) {
      this.chartProfit.data.labels = this.last7Days().map((s) => s.label);
      this.chartProfit.data.datasets[0].data = this.last7Days().map((s) => s.profit);
      this.chartProfit.update('none');
    }
    if (this.chartPayment && this.chartPaymentRef?.nativeElement) {
      const c = this.paymentCounts();
      this.chartPayment.data.datasets[0].data = [c.pendente, c.parcial, c.pago];
      this.chartPayment.update('none');
    }
  }
}
