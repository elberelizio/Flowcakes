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
import { Chart, ArcElement, type Plugin } from 'chart.js/auto';
import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { API_URL } from '../../core/config/api.config';
import { Order } from '../../models/order.model';
import { computeTotalProfit } from '../../core/utils/profit.util';
import { WithdrawalService } from '../../services/withdrawal.service';
import {
  ReportsExportService,
  RevenueByMonthDto,
  ReportsExportPayload,
  ChartSlice,
} from './reports-export.service';

/** Cores fixas por tipo de informação (alinhado com o dashboard). */
const FINANCIAL_SLICE_COLORS = {
  lucro: '#059669',
  despesas: '#dc2626',
  dividas: '#2563eb',
  retiradas: '#0891b2',
} as const;

const MONTH_PIE_COLORS = [
  '#0d9488',
  '#2563eb',
  '#0284c7',
  '#059669',
  '#0891b2',
  '#1d4ed8',
  '#10b981',
  '#38bdf8',
  '#14b8a6',
  '#3b82f6',
  '#06b6d4',
  '#22c55e',
];

function formatSliceAmount(value: number): string {
  return value.toLocaleString('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Desenha o valor em MZN no centro de cada fatia do gráfico de pizza. */
const pieSliceValueLabelsPlugin: Plugin<'pie'> = {
  id: 'pieSliceValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;
    const dataset = data.datasets[0];
    if (!dataset) return;

    const values = dataset.data as number[];
    const total = values.reduce((sum, v) => sum + Number(v), 0);
    const meta = chart.getDatasetMeta(0);

    meta.data.forEach((element, index) => {
      const value = Number(values[index] ?? 0);
      if (!value) return;

      const arc = element as ArcElement;
      const midAngle = (arc.startAngle + arc.endAngle) / 2;
      const midRadius = (arc.innerRadius + arc.outerRadius) / 2;
      const labelX = arc.x + Math.cos(midAngle) * midRadius * 0.72;
      const labelY = arc.y + Math.sin(midAngle) * midRadius * 0.72;

      const pct = total > 0 ? (value / total) * 100 : 0;
      const fontSize = pct < 10 ? 9 : pct < 18 ? 11 : 12;
      const amount = formatSliceAmount(value);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.55)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;

      if (pct >= 12) {
        ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
        ctx.fillText(amount, labelX, labelY - 7);
        ctx.font = `600 ${Math.max(fontSize - 1, 8)}px system-ui, sans-serif`;
        ctx.fillText('MZN', labelX, labelY + 8);
      } else {
        ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
        ctx.fillText(amount, labelX, labelY);
      }

      ctx.restore();
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
  private readonly withdrawalService = inject(WithdrawalService);

  today = new Date();
  isAdmin = false;
  revenueByMonth = signal<RevenueByMonthDto[]>([]);
  chartLoading = signal(true);
  chartError = signal('');
  exportBusy = signal(false);
  showFilters = signal(false);

  /** Datas nos inputs (rascunho — só entram em vigor ao clicar Aplicar). */
  filterDateFrom = signal('');
  filterDateTo = signal('');

  /** Período activo para gráfico, KPIs e PDF. Vazio = total acumulado na BD. */
  appliedDateFrom = signal('');
  appliedDateTo = signal('');

  filterIsActive = computed(() => !!(this.appliedDateFrom() || this.appliedDateTo()));

  private chart: Chart | null = null;

  filteredRevenueByMonth = computed(() => {
    const data = this.revenueByMonth();
    const from = this.appliedDateFrom();
    const to = this.appliedDateTo();
    if (!from && !to) return data;
    return data.filter((row) => this.monthInRange(row.month, from, to));
  });

  ordersInPeriod = computed(() => {
    const from = this.appliedDateFrom();
    const to = this.appliedDateTo();
    return this.orders.allOrders().filter((o) => this.orderInRange(o, from, to));
  });

  profitInPeriod = computed(() => computeTotalProfit(this.activeOrdersInPeriod()));

  expenseInPeriod = computed(() =>
    this.activeOrdersInPeriod().reduce((sum, o) => {
      const extras = o.variableExpenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0;
      return sum + o.costTotal + extras;
    }, 0),
  );

  debtInPeriod = computed(() =>
    this.activeOrdersInPeriod().reduce(
      (sum, o) => sum + Math.max(0, (o.valueCharged ?? 0) - (o.valuePaid ?? 0)),
      0,
    ),
  );

  withdrawnInPeriod = computed(() =>
    this.withdrawalsInPeriod().reduce((sum, w) => sum + (w.amount ?? 0), 0),
  );

  /** Fatias do gráfico de pizza — composição financeira do período (utilizador). */
  financialChartSlices = computed((): ChartSlice[] => {
    const slices: ChartSlice[] = [
      { label: 'Lucro', value: this.profitInPeriod(), color: FINANCIAL_SLICE_COLORS.lucro },
      { label: 'Despesas', value: this.expenseInPeriod(), color: FINANCIAL_SLICE_COLORS.despesas },
      { label: 'Dívidas a cobrar', value: this.debtInPeriod(), color: FINANCIAL_SLICE_COLORS.dividas },
      { label: 'Retiradas de caixa', value: this.withdrawnInPeriod(), color: FINANCIAL_SLICE_COLORS.retiradas },
    ];
    return slices.filter((s) => s.value > 0);
  });

  /** Admin: receita por mês como fatias do gráfico. */
  adminChartSlices = computed((): ChartSlice[] =>
    [...this.filteredRevenueByMonth()]
      .reverse()
      .map((row, i) => ({
        label: this.formatMonthLabel(row.month),
        value: row.revenue,
        color: MONTH_PIE_COLORS[i % MONTH_PIE_COLORS.length],
      }))
      .filter((s) => s.value > 0),
  );

  chartSlices = computed(() => (this.isAdmin ? this.adminChartSlices() : this.financialChartSlices()));

  chartTitle = computed(() => {
    if (this.isAdmin) {
      return this.filterIsActive() ? 'Receita por mês (plataforma)' : 'Receita por mês — total acumulado';
    }
    return this.filterIsActive()
      ? 'Composição financeira do período'
      : 'Composição financeira — total acumulado';
  });

  periodProfitLabel = computed(() =>
    this.filterIsActive() ? 'Lucro no período' : 'Lucro total acumulado',
  );

  chartHasData = computed(() => this.chartSlices().length > 0);

  withdrawalsInPeriod = computed(() => {
    const from = this.appliedDateFrom();
    const to = this.appliedDateTo();
    return this.withdrawalService.withdrawals().filter((w) => {
      const d = w.withdrawalDate;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  });

  totalOrdersInPeriod = computed(() => this.ordersInPeriod().length);

  dayOrders = computed(() => this.orders.ordersOfDay(this.today));
  weekOrders = computed(() => this.orders.ordersOfWeek(this.today));
  monthOrders = computed(() => this.orders.ordersOfMonth(this.today));

  profitDay = computed(() => this.orders.totalProfit(this.dayOrders()));
  profitWeek = computed(() => this.orders.totalProfit(this.weekOrders()));
  profitMonth = computed(() => this.orders.totalProfit(this.monthOrders()));

  periodLabel = computed(() => {
    if (!this.filterIsActive()) {
      return 'Total acumulado na base de dados';
    }
    const from = this.appliedDateFrom();
    const to = this.appliedDateTo();
    if (from && to) return `${this.formatDisplayDate(from)} — ${this.formatDisplayDate(to)}`;
    if (from) return `A partir de ${this.formatDisplayDate(from)}`;
    if (to) return `Até ${this.formatDisplayDate(to)}`;
    return 'Total acumulado na base de dados';
  });

  canExport = computed(
    () => !this.chartLoading() && !this.exportBusy(),
  );

  ngOnInit(): void {
    this.isAdmin = this.auth.isAdmin();
    this.chartLoading.set(true);
    this.chartError.set('');

    const url = this.isAdmin
      ? `${API_URL}/admin/revenue-by-month`
      : `${API_URL}/orders/revenue-by-month`;

    Promise.all([
      this.orders.loadOrders(),
      this.withdrawalService.loadWithdrawals(),
      this.http.get<RevenueByMonthDto[]>(url).toPromise().catch(() => []),
    ])
      .then(([, , list]) => {
        const withNum = (list || []).map((x) => ({ month: x.month, revenue: Number(x.revenue) }));
        this.revenueByMonth.set(withNum);
        this.chartLoading.set(false);
        setTimeout(() => this.buildOrUpdateChart(), 150);
      })
      .catch(() => {
        this.chartError.set('Erro ao carregar dados do relatório.');
        this.chartLoading.set(false);
      });
  }

  ngAfterViewInit(): void {
    if (this.chartHasData() && this.chartCanvas?.nativeElement) {
      this.buildOrUpdateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  applyFilters(): void {
    const from = this.filterDateFrom().trim();
    const to = this.filterDateTo().trim();
    if (!from && !to) {
      this.notification.showWarning('Indique pelo menos uma data (início ou fim) para filtrar o período.');
      return;
    }
    if (from && to && from > to) {
      this.notification.showWarning('A data de início não pode ser posterior à data de fim.');
      return;
    }
    this.appliedDateFrom.set(from);
    this.appliedDateTo.set(to);
    setTimeout(() => this.buildOrUpdateChart(), 50);
  }

  clearFilters(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.appliedDateFrom.set('');
    this.appliedDateTo.set('');
    setTimeout(() => this.buildOrUpdateChart(), 50);
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  async exportPdf(): Promise<void> {
    if (this.exportBusy()) return;
    if (!this.chartHasData()) {
      this.notification.showWarning('Sem dados para exportar.');
      return;
    }

    this.exportBusy.set(true);
    try {
      const chartImage = this.chart?.toBase64Image('image/png', 1) ?? '';
      await this.reportExport.exportPdf({
        ...this.buildExportPayload(),
        chartImageDataUrl: chartImage,
        chartTitle: this.chartTitle(),
        chartBreakdown: this.chartSlices(),
      });
      this.notification.showSuccess('Relatório PDF descarregado.');
    } catch {
      this.notification.showError('Não foi possível exportar o relatório.');
    } finally {
      this.exportBusy.set(false);
    }
  }

  private buildExportPayload(): ReportsExportPayload {
    const fmt = (n: number) =>
      n.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MZN';
    const orderLabel = (n: number) => `${n} ${n === 1 ? 'pedido' : 'pedidos'}`;

    const summary: ReportsExportPayload['summary'] = [];
    if (!this.isAdmin) {
      const periodWord = this.filterIsActive() ? 'no período' : 'acumulado';
      summary.push(
        {
          label: this.filterIsActive() ? 'Lucro no período' : 'Lucro total acumulado',
          value: fmt(this.profitInPeriod()),
          detail: orderLabel(this.activeOrdersInPeriod().length),
        },
        { label: `Despesas ${periodWord}`, value: fmt(this.expenseInPeriod()) },
        { label: 'Dívidas a cobrar', value: fmt(this.debtInPeriod()) },
        { label: `Retiradas ${periodWord}`, value: fmt(this.withdrawnInPeriod()) },
        { label: 'Lucro do dia', value: fmt(this.profitDay()), detail: orderLabel(this.dayOrders().length) },
        { label: 'Lucro da semana', value: fmt(this.profitWeek()), detail: orderLabel(this.weekOrders().length) },
        { label: 'Lucro do mês', value: fmt(this.profitMonth()), detail: orderLabel(this.monthOrders().length) },
      );
    }

    return {
      isAdmin: this.isAdmin,
      userName: this.auth.getDisplayName(),
      extractedAt: new Date(),
      periodLabel: this.periodLabel(),
      summary,
      revenueByMonth: [...this.filteredRevenueByMonth()],
    };
  }

  private buildOrUpdateChart(): void {
    const slices = this.chartSlices();
    if (!this.chartCanvas?.nativeElement) return;

    if (!slices.length) {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      return;
    }

    const labels = slices.map((s) => s.label);
    const values = slices.map((s) => s.value);
    const colors = slices.map((s) => s.color);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.data.datasets[0].backgroundColor = colors;
      this.chart.update();
      return;
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'pie',
      plugins: [pieSliceValueLabelsPlugin],
      data: {
        labels,
        datasets: [
          {
            label: 'MZN',
            data: values,
            backgroundColor: colors,
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              font: { size: 12, weight: 600 },
              color: '#334155',
              generateLabels: (chart) => {
                const dataset = chart.data.datasets[0];
                const total = (dataset.data as number[]).reduce((s, v) => s + Number(v), 0);
                return (chart.data.labels ?? []).map((label, i) => {
                  const value = Number((dataset.data as number[])[i] ?? 0);
                  const pct = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
                  const bg = Array.isArray(dataset.backgroundColor)
                    ? dataset.backgroundColor[i]
                    : dataset.backgroundColor;
                  return {
                    text: `${label} (${pct}%)`,
                    fillStyle: typeof bg === 'string' ? bg : '#0d9488',
                    strokeStyle: '#fff',
                    lineWidth: 1,
                    hidden: false,
                    index: i,
                  };
                });
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = Number(ctx.raw);
                const total = values.reduce((s, v) => s + v, 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return ` ${value.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MZN (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  private activeOrdersInPeriod(): Order[] {
    return this.ordersInPeriod().filter(
      (o) => !o.isCancelled && o.orderStatus !== 'cancelled',
    );
  }

  private orderInRange(order: Order, from: string, to: string): boolean {
    const key = (order.deliveryDate || order.createdAt).slice(0, 10);
    if (from && key < from) return false;
    if (to && key > to) return false;
    return true;
  }

  private monthInRange(month: string, from: string, to: string): boolean {
    const monthStart = `${month}-01`;
    const monthEnd = `${month}-31`;
    if (from && monthEnd < from) return false;
    if (to && monthStart > to) return false;
    return true;
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  formatDisplayDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
