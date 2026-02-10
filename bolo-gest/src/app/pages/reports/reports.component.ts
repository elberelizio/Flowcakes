import { Component, computed, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart } from 'chart.js/auto';
import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { API_URL } from '../../core/api.config';

export interface RevenueByMonthDto {
  month: string;
  revenue: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('revenueChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  today = new Date();
  isAdmin = false;
  revenueByMonth = signal<RevenueByMonthDto[]>([]);
  chartLoading = signal(true);
  chartError = signal('');
  private chart: Chart | null = null;

  dayOrders = computed(() => this.orders.ordersOfDay(this.today));
  weekOrders = computed(() => this.orders.ordersOfWeek(this.today));
  monthOrders = computed(() => this.orders.ordersOfMonth(this.today));

  profitDay = computed(() => this.orders.totalProfit(this.dayOrders()));
  profitWeek = computed(() => this.orders.totalProfit(this.weekOrders()));
  profitMonth = computed(() => this.orders.totalProfit(this.monthOrders()));

  totalOrders = computed(() => this.orders.allOrders().length);
  pendingCount = computed(() => this.orders.ordersWithPendingBalance().length);

  backLink = computed(() => '/dashboard');

  constructor(
    public orders: OrdersService,
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.isAdmin = this.auth.isAdmin();
  }

  ngOnInit(): void {
    const url = this.isAdmin ? `${API_URL}/admin/revenue-by-month` : `${API_URL}/orders/revenue-by-month`;
    this.chartLoading.set(true);
    this.chartError.set('');
    this.http.get<RevenueByMonthDto[]>(url).subscribe({
      next: (list) => {
        const withNum = (list || []).map((x) => ({ month: x.month, revenue: Number(x.revenue) }));
        this.revenueByMonth.set(withNum);
        this.chartLoading.set(false);
        setTimeout(() => this.buildOrUpdateChart(), 150);
      },
      error: () => {
        this.chartError.set('Erro ao carregar receita por mês.');
        this.chartLoading.set(false);
      },
    });
  }

  ngAfterViewInit(): void {
    if (this.revenueByMonth().length > 0 && this.chartCanvas?.nativeElement) {
      this.buildOrUpdateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private buildOrUpdateChart(): void {
    const data = this.revenueByMonth();
    if (!data.length || !this.chartCanvas?.nativeElement) return;

    const reversed = [...data].reverse();
    const labels = reversed.map((d) => this.formatMonthLabel(d.month));
    const values = reversed.map((d) => d.revenue);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.update();
      return;
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
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
        maintainAspectRatio: true,
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
            ticks: {
              callback: (v) => (typeof v === 'number' ? v.toFixed(0) + ' MZN' : v),
            },
          },
        },
      },
    });
  }

  formatMonthLabel(ym: string): string {
    if (!ym || ym.length < 7) return ym;
    const [y, m] = ym.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const i = parseInt(m, 10) - 1;
    return `${months[i] ?? m} ${y}`;
  }
}
