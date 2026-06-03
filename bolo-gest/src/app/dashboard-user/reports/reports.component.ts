import {
  Component,
  computed,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart, Plugin } from 'chart.js/auto';
import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { API_URL } from '../../core/config/api.config';
import {
  ReportsExportService,
  RevenueByMonthDto,
  ReportsExportPayload,
} from './reports-export.service';

const revenueBarLabelsPlugin: Plugin<'bar'> = {
  id: 'revenueBarLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;
      meta.data.forEach((element, index) => {
        const raw = dataset.data[index];
        const value = typeof raw === 'number' ? raw : Number(raw);
        if (!Number.isFinite(value)) return;
        const label = value.toLocaleString('pt-MZ', {
          maximumFractionDigits: 0,
        });
        const { x, y } = element.getProps(['x', 'y'], true);
        ctx.save();
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.fillStyle = '#0f766e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, x, y - 6);
        ctx.restore();
      });
    });
  },
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('revenueChart') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly reportExport = inject(ReportsExportService);
  private readonly notification = inject(NotificationService);

  readonly orders = inject(OrdersService);

  today = new Date();
  isAdmin = false;
  revenueByMonth = signal<RevenueByMonthDto[]>([]);
  chartLoading = signal(true);
  chartError = signal('');
  exportBusy = signal(false);
  private chart: Chart | null = null;

  dayOrders = computed(() => this.orders.ordersOfDay(this.today));
  weekOrders = computed(() => this.orders.ordersOfWeek(this.today));
  monthOrders = computed(() => this.orders.ordersOfMonth(this.today));

  profitDay = computed(() => this.orders.totalProfit(this.dayOrders()));
  profitWeek = computed(() => this.orders.totalProfit(this.weekOrders()));
  profitMonth = computed(() => this.orders.totalProfit(this.monthOrders()));

  totalOrders = computed(() => this.orders.allOrders().length);
  pendingCount = computed(() => this.orders.ordersWithPendingBalance().length);

  canExport = computed(
    () => !this.chartLoading() && (this.revenueByMonth().length > 0 || !this.isAdmin)
  );

  ngOnInit(): void {
    this.isAdmin = this.auth.isAdmin();
    const url = this.isAdmin
      ? `${API_URL}/admin/revenue-by-month`
      : `${API_URL}/orders/revenue-by-month`;
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

  exportPdf(): void {
    this.runExport('PDF', () => this.reportExport.exportPdf(this.buildExportPayload()));
  }

  exportWord(): void {
    this.runExport('Word', () => this.reportExport.exportWord(this.buildExportPayload()));
  }

  exportExcel(): void {
    this.runExport('Excel', () => this.reportExport.exportExcel(this.buildExportPayload()));
  }

  private runExport(formatLabel: string, action: () => void): void {
    if (this.exportBusy()) return;
    this.exportBusy.set(true);
    try {
      action();
      this.notification.showSuccess(`Relatório exportado (${formatLabel}).`);
    } catch {
      this.notification.showError('Não foi possível exportar o relatório.');
    } finally {
      setTimeout(() => this.exportBusy.set(false), 400);
    }
  }

  private buildExportPayload(): ReportsExportPayload {
    const fmt = (n: number) =>
      n.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MZN';
    const orderLabel = (n: number) => `${n} ${n === 1 ? 'pedido' : 'pedidos'}`;

    const summary: ReportsExportPayload['summary'] = [];
    if (!this.isAdmin) {
      summary.push(
        { label: 'Lucro do dia', value: fmt(this.profitDay()), detail: orderLabel(this.dayOrders().length) },
        { label: 'Lucro da semana', value: fmt(this.profitWeek()), detail: orderLabel(this.weekOrders().length) },
        { label: 'Lucro do mês', value: fmt(this.profitMonth()), detail: orderLabel(this.monthOrders().length) },
        { label: 'Total de pedidos', value: String(this.totalOrders()) },
        { label: 'Com saldo pendente', value: String(this.pendingCount()) }
      );
    }

    return {
      isAdmin: this.isAdmin,
      userName: this.auth.getDisplayName(),
      extractedAt: new Date(),
      summary,
      revenueByMonth: [...this.revenueByMonth()],
    };
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
            backgroundColor: 'rgba(13, 148, 136, 0.75)',
            borderColor: 'rgb(15, 118, 110)',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      plugins: [revenueBarLabelsPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 28 },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${Number(ctx.raw).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MZN`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grace: '10%',
            ticks: {
              callback: (v) =>
                typeof v === 'number' ? v.toLocaleString('pt-MZ', { maximumFractionDigits: 0 }) : v,
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
