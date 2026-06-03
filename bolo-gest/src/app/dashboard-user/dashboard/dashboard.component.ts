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
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, Plugin } from 'chart.js/auto';

const PROFIT_WAVE_COLORS = {
  lucro: { line: '#16a34a', top: 0.42 },
  despesa: { line: '#dc2626', top: 0.35 },
  dividas: { line: '#ca8a04', top: 0.32 },
} as const;

/** Etiquetas nos pontos (caixa colorida), estilo spline area / ondas. */
const profitExpenseSplineLabelsPlugin: Plugin<'line'> = {
  id: 'profitExpenseSplineLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;
      const color =
        typeof dataset.borderColor === 'string' ? dataset.borderColor : PROFIT_WAVE_COLORS.lucro.line;
      meta.data.forEach((element, index) => {
        const raw = dataset.data[index];
        const value = typeof raw === 'number' ? raw : Number(raw);
        if (!Number.isFinite(value) || value <= 0) return;
        const prev = index > 0 ? Number(dataset.data[index - 1]) || 0 : 0;
        const next =
          index < dataset.data.length - 1 ? Number(dataset.data[index + 1]) || 0 : 0;
        const isPeak = value >= prev && value >= next;
        const isLast = index === dataset.data.length - 1;
        if (!isPeak && !isLast) return;
        const label = Math.round(value).toLocaleString('pt-MZ', { maximumFractionDigits: 0 });
        const { x, y } = element.getProps(['x', 'y'], true);
        ctx.save();
        ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
        const textW = ctx.measureText(label).width;
        const padX = 6;
        const boxW = textW + padX * 2;
        const boxH = 16;
        const boxX = x - boxW / 2;
        const boxY = y - boxH - 10;
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(boxX + r, boxY);
        ctx.lineTo(boxX + boxW - r, boxY);
        ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
        ctx.lineTo(boxX + boxW, boxY + boxH - r);
        ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
        ctx.lineTo(boxX + r, boxY + boxH);
        ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
        ctx.lineTo(boxX, boxY + r);
        ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, boxY + boxH / 2);
        ctx.restore();
      });
    });
  },
};
import { OrdersService } from '../../services/orders.service';
import { ReminderService } from '../../services/reminder.service';
import { AuthService, LicenseStatusResponse } from '../../services/auth.service';
import { Order, orderDisplayName, orderDisplaySize } from '../../models/order.model';
import { IconComponent } from '../../ui/icon/icon.component';
import { NotificationService } from '../../services/notification.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { WithdrawalService } from '../../services/withdrawal.service';
import { LoginPopupOrchestratorService } from '../../services/login-popup-orchestrator.service';
import {
  getHolidayOnDate,
  getUpcomingHolidays,
  formatHolidayDate,
} from '../../core/data/mozambique-holidays';

const SUGESTIVE_MESSAGES = [
  'Organize o seu dia e aproveite cada encomenda.',
  'Um passo de cada vez: as suas finanças e entregas em ordem.',
  'Bom trabalho! Consulte os filtros para analisar por período.',
  'Mantenha os lembretes em dia para não faltar material.',
  'O Chef Control está aqui para simplificar o seu negócio.',
];
const DASHBOARD_VISITED_KEY = 'chefcontrol_dashboard_visited';
const LOGIN_SUMMARY_DISMISSED_KEY = 'chefcontrol_login_summary_dismissed';

type ChartGranularity = 'day' | 'month' | 'year';

/** Estado financeiro no popup «Resumo da situação». */
export type ProfitMoodTier = 'loss' | 'zero' | 'modest' | 'good' | 'excellent';

interface ProfitExpensePoint {
  date: string;
  label: string;
  profit: number;
  expense: number;
  debt: number;
  tooltipTitle: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartProfitExpense') chartProfitExpenseRef!: ElementRef<HTMLCanvasElement>;

  private orders = inject(OrdersService);
  private reminders = inject(ReminderService);
  private auth = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private userSettings = inject(UserSettingsService);
  private withdrawalService = inject(WithdrawalService);
  private loginChain = inject(LoginPopupOrchestratorService);
  today = new Date();
  isAdmin = false;

  userName = computed(() => this.auth.getDisplayName() || 'Utilizador');

  /** Primeira vez que abre o dashboard nesta sessão (depois do login). */
  isFirstVisitThisSession = signal(true);

  /** Saudação conforme a hora: Bom dia, Boa tarde, Boa noite. */
  timeGreeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  /** Título: "Bom dia, Carolina!" */
  welcomeTitle = computed(() => `${this.timeGreeting()}, ${this.userName()}!`);

  /** Texto: bem-vindo(a) ou bem-vindo de volta + mensagem sugestiva. */
  welcomeSubline = computed(() => {
    const first = this.isFirstVisitThisSession();
    const base = first
      ? 'Bem-vindo ao dashboard do Chef Control. '
      : 'Bem-vindo de volta. ';
    const idx = new Date().getDate() % SUGESTIVE_MESSAGES.length;
    return base + SUGESTIVE_MESSAGES[idx];
  });

  /** Mensagem extra se hoje for feriado nacional (Moçambique). */
  todayHolidayMessage = computed(() => {
    const h = getHolidayOnDate(new Date());
    return h ? ` Hoje é ${formatHolidayDate(h)} — ${h.name}.` : '';
  });

  /** Feriados nacionais nos próximos N dias (para o card de lembretes). */
  upcomingNationalHolidays = computed(() => {
    const days = Math.max(90, this.userSettings.getReminderDaysBefore());
    return getUpcomingHolidays(days);
  });

  /** Total retirado da caixa (para o popup de resumo). */
  totalWithdrawn = computed(() => this.withdrawalService.totalWithdrawn());

  /** Valor efectivamente recebido (valor pago pelos clientes — o que já está nas mãos). O valor em dívida não conta. */
  totalValuePaid = computed(() => {
    const all = this.orders.allOrders();
    return all.reduce((sum, o) => sum + (o.valuePaid ?? 0), 0);
  });

  /** Lucro final = valor recebido − despesas − retiradas. Se negativo, é prejuízo. */
  lucroFinal = computed(() =>
    this.totalValuePaid() - this.totalExpense() - this.totalWithdrawn()
  );

  /** Limiares em MZN para mensagens do popup (valor arredondado). */
  private static readonly PROFIT_MODEST_MAX = 4_999;
  private static readonly PROFIT_EXCELLENT_MIN = 25_000;
  private static readonly PROFIT_EXCELLENT_MARGIN = 0.25;

  /**
   * Comportamento do popup conforme o lucro:
   * prejuízo → alerta; zero → sem lucro, motivação; positivo → encorajamento; muito alto → destaque.
   */
  profitMoodTier = computed((): ProfitMoodTier => {
    const lucro = Math.round(this.lucroFinal());
    if (lucro < 0) return 'loss';
    if (lucro === 0) return 'zero';

    const revenue = this.totalValuePaid();
    const margin = revenue > 0 ? lucro / revenue : 0;
    if (lucro >= DashboardComponent.PROFIT_EXCELLENT_MIN || margin >= DashboardComponent.PROFIT_EXCELLENT_MARGIN) {
      return 'excellent';
    }
    if (lucro <= DashboardComponent.PROFIT_MODEST_MAX) return 'modest';
    return 'good';
  });

  summaryMoodEmoji = computed(() => {
    switch (this.profitMoodTier()) {
      case 'loss':
        return '😰';
      case 'zero':
        return '💪';
      case 'modest':
        return '🙂';
      case 'good':
        return '😊';
      case 'excellent':
        return '🎉';
    }
  });

  summaryMoodMessage = computed(() => {
    switch (this.profitMoodTier()) {
      case 'loss':
        return 'Situação crítica: despesas e retiradas superam o que já recebeu. Revise custos, cobranças e evite novas retiradas até recuperar.';
      case 'zero':
        return 'Ainda não há lucro — o que entrou só cobre custos e retiradas. Feche encomendas, receba valores em falta e registe todas as despesas.';
      case 'modest':
        return 'Lucro positivo, ainda modesto. Bom sinal — continue a fechar encomendas e a controlar despesas para fazer o negócio crescer.';
      case 'good':
        return 'Bom trabalho! O negócio está a gerar lucro. Mantenha o registo em dia e acompanhe o dashboard.';
      case 'excellent':
        return 'Resultado excelente! O lucro está forte — considere reservar parte para reinvestir ou para épocas mais calmas.';
    }
  });

  /** Rótulo do valor no popup (Lucro / Sem lucro / Prejuízo). */
  profitFinanceLabel = computed(() => {
    switch (this.profitMoodTier()) {
      case 'loss':
        return 'Prejuízo';
      case 'zero':
        return 'Sem lucro';
      default:
        return 'Lucro';
    }
  });

  /** Filtros do dashboard: painel fechado por defeito, campos zerados */
  showFilters = signal(false);
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');
  filterYear = signal<number | null>(null);
  filterMonth = signal<number | null>(null); // 1-12
  /** Alerta de datas inválidas (data fim &lt; data início) */
  filterDateError = signal<string>('');

  /** Intervalo efectivo para os gráficos. Prioridade: datas → ano+mês → só ano → últimos 30 dias. */
  filterDateRange = computed((): { from: string; to: string } => {
    const from = this.filterDateFrom().trim();
    const to = this.filterDateTo().trim();
    if (from && to) {
      if (new Date(to) < new Date(from)) return this.getDefaultRange();
      return { from, to };
    }
    const y = this.filterYear();
    const m = this.filterMonth();
    if (y != null && m != null) {
      const start = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      return { from: start, to: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` };
    }
    if (y != null) {
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    }
    return this.getDefaultRange();
  });

  /** Modo activo do filtro (define período e granularidade do gráfico). */
  filterMode = computed((): 'range' | 'yearMonth' | 'yearOnly' | 'default' => {
    const from = this.filterDateFrom().trim();
    const to = this.filterDateTo().trim();
    if (from && to) return 'range';
    const y = this.filterYear();
    const m = this.filterMonth();
    if (y != null && m != null) return 'yearMonth';
    if (y != null) return 'yearOnly';
    return 'default';
  });

  /** Agregação do eixo X: dia, mês ou ano conforme o filtro e a extensão do período. */
  chartGranularity = computed((): ChartGranularity => {
    const mode = this.filterMode();
    if (mode === 'yearMonth' || mode === 'default') return 'day';
    if (mode === 'yearOnly') return 'month';
    const { from, to } = this.filterDateRange();
    const days = this.daysBetween(from, to);
    if (days > 730) return 'year';
    if (days > 62) return 'month';
    return 'day';
  });

  /** Texto sob o título do gráfico (explica período e agrupamento). */
  chartPeriodLabel = computed(() => {
    const g = this.chartGranularity();
    const { from, to } = this.filterDateRange();
    const mode = this.filterMode();
    const gran =
      g === 'day' ? 'Por dia' : g === 'month' ? 'Por mês' : 'Por ano';

    if (mode === 'range') {
      return `${gran} · ${this.formatDatePt(from)} a ${this.formatDatePt(to)}`;
    }
    if (mode === 'yearMonth') {
      const m = this.filterMonth();
      const monthName = this.filterMonths.find((x) => x.value === m)?.label ?? '';
      return `${gran} · ${monthName} ${this.filterYear()}`;
    }
    if (mode === 'yearOnly') {
      return `${gran} · ${this.filterYear()}`;
    }
    return `${gran} · últimos 30 dias`;
  });

  /** Sempre 30 dias de calendário (hoje incluso), para o eixo X ter pontos suficientes para curvas suaves. */
  private getDefaultRange(): { from: string; to: string } {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    return {
      from: this.toLocalDateKey(start),
      to: this.toLocalDateKey(end),
    };
  }

  /** Chave YYYY-MM-DD em hora local (evita desvio UTC de toISOString). */
  private toLocalDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseLocalDate(isoDate: string): Date {
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /** Mesma regra que ordersInRange: entrega, depois data do pedido, depois criação (hora local). */
  private orderDateKey(o: Order): string {
    const raw = o.deliveryDate || o.date || o.createdAt || '';
    if (!raw) return '';
    if (raw.includes('T')) {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) return this.toLocalDateKey(d);
    }
    return raw.length >= 10 ? raw.slice(0, 10) : raw;
  }

  private daysBetween(from: string, to: string): number {
    const a = this.parseLocalDate(from);
    const b = this.parseLocalDate(to);
    return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  }

  private formatDatePt(isoDate: string): string {
    return this.parseLocalDate(isoDate).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private buildChartBuckets(
    fromD: Date,
    toD: Date,
    granularity: ChartGranularity
  ): { key: string; label: string; tooltipTitle: string }[] {
    const buckets: { key: string; label: string; tooltipTitle: string }[] = [];

    if (granularity === 'day') {
      const cur = new Date(fromD);
      while (cur <= toD) {
        const key = this.toLocalDateKey(cur);
        buckets.push({
          key,
          label: `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`,
          tooltipTitle: cur.toLocaleDateString('pt-MZ', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
        });
        cur.setDate(cur.getDate() + 1);
      }
      return buckets;
    }

    if (granularity === 'month') {
      const cur = new Date(fromD.getFullYear(), fromD.getMonth(), 1);
      const end = new Date(toD.getFullYear(), toD.getMonth(), 1);
      while (cur <= end) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
        buckets.push({
          key,
          label: cur.toLocaleDateString('pt-MZ', { month: 'short', year: '2-digit' }),
          tooltipTitle: cur.toLocaleDateString('pt-MZ', { month: 'long', year: 'numeric' }),
        });
        cur.setMonth(cur.getMonth() + 1);
      }
      return buckets;
    }

    for (let y = fromD.getFullYear(); y <= toD.getFullYear(); y++) {
      const key = String(y);
      buckets.push({ key, label: key, tooltipTitle: key });
    }
    return buckets;
  }

  private ordersForBucket(
    orders: Order[],
    bucketKey: string,
    granularity: ChartGranularity
  ): Order[] {
    return orders.filter((o) => {
      const dk = this.orderDateKey(o);
      if (!dk) return false;
      if (granularity === 'day') return dk === bucketKey;
      if (granularity === 'month') return dk.startsWith(bucketKey);
      return dk.startsWith(bucketKey);
    });
  }

  private aggregateOrderMetrics(orders: Order[]): {
    profit: number;
    expense: number;
    debt: number;
  } {
    const profit = orders.reduce((sum, o) => {
      let orderProfit = o.profit;
      if (o.variableExpenses && o.variableExpenses.length > 0) {
        const varExpensesTotal = o.variableExpenses.reduce((s, e) => s + e.amount, 0);
        if (o.valuePaid < o.valueCharged && o.valuePaid > 0) {
          const paymentRatio = o.valuePaid / o.valueCharged;
          orderProfit = orderProfit - varExpensesTotal * paymentRatio;
        } else if (o.valuePaid >= o.valueCharged) {
          orderProfit = orderProfit - varExpensesTotal;
        }
      }
      return sum + Math.max(0, orderProfit);
    }, 0);
    const expense = orders.reduce((sum, o) => {
      const baseExpense = o.costTotal;
      const varExpenses = o.variableExpenses?.reduce((s, e) => s + e.amount, 0) || 0;
      return sum + baseExpense + varExpenses;
    }, 0);
    const debt = orders.reduce((sum, o) => {
      if (o.isCancelled || o.orderStatus === 'cancelled') return sum;
      return sum + Math.max(0, (o.valueCharged ?? 0) - (o.valuePaid ?? 0));
    }, 0);
    return { profit, expense, debt };
  }

  /** Utilizador tem filtro activo (datas, ano+mês ou só ano) */
  hasActiveFilter = computed(() => {
    const from = this.filterDateFrom().trim();
    const to = this.filterDateTo().trim();
    const y = this.filterYear();
    return (from !== '' && to !== '') || y != null;
  });

  /** Há valores não-zero no gráfico */
  chartHasValues = computed(() =>
    this.profitExpenseData().some((d) => d.profit + d.expense + d.debt > 0)
  );

  /** Período filtrado não tem dados – mostrar mensagem amigável */
  filterHasNoData = computed(() => {
    if (!this.hasActiveFilter()) return false;
    return !this.chartHasValues();
  });

  /** Encomendas no intervalo do filtro (por data de entrega ou criação) */
  ordersInRange = computed(() => {
    const all = this.orders.allOrders();
    const { from, to } = this.filterDateRange();
    return all.filter((o) => {
      const key = this.orderDateKey(o);
      return key >= from && key <= to;
    });
  });

  /** Número de clientes únicos no período filtrado */
  clientsCountInRange = computed(() => {
    const names = new Set(this.ordersInRange().map((o) => o.clientName?.trim()).filter(Boolean));
    return names.size;
  });

  /** Total despesas no período filtrado */
  totalExpenseInRange = computed(() => {
    return this.ordersInRange().reduce((sum, o) => {
      const base = o.costTotal;
      const varExp = o.variableExpenses?.reduce((s, e) => s + e.amount, 0) || 0;
      return sum + base + varExp;
    }, 0);
  });

  /** Total dívidas (saldo em falta) no período filtrado */
  totalDebtInRange = computed(() => {
    return this.ordersInRange().reduce((sum, o) => {
      if (o.isCancelled || o.orderStatus === 'cancelled') return sum;
      return sum + Math.max(0, o.valueCharged - o.valuePaid);
    }, 0);
  });

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

  // Novos cálculos para os cards principais
  totalRevenue = computed(() => {
    const allOrders = this.orders.allOrders();
    return allOrders.reduce((sum, o) => sum + o.valueCharged, 0);
  });

  totalExpense = computed(() => {
    const allOrders = this.orders.allOrders();
    return allOrders.reduce((sum, o) => {
      const baseExpense = o.costTotal;
      // Incluir despesas variáveis (delivery + outras)
      const varExpenses = o.variableExpenses?.reduce((s, e) => s + e.amount, 0) || 0;
      return sum + baseExpense + varExpenses;
    }, 0);
  });

  totalProfit = computed(() => {
    const allOrders = this.orders.allOrders();
    return allOrders.reduce((sum, o) => {
      let orderProfit = o.profit;
      // Se há despesas variáveis, subtrair do lucro
      if (o.variableExpenses && o.variableExpenses.length > 0) {
        const varExpensesTotal = o.variableExpenses.reduce((s, e) => s + e.amount, 0);
        // Ajustar lucro proporcionalmente se pagamento parcial
        if (o.valuePaid < o.valueCharged && o.valuePaid > 0) {
          const paymentRatio = o.valuePaid / o.valueCharged;
          orderProfit = orderProfit - (varExpensesTotal * paymentRatio);
        } else if (o.valuePaid >= o.valueCharged) {
          orderProfit = orderProfit - varExpensesTotal;
        }
      }
      return sum + Math.max(0, orderProfit);
    }, 0);
  });

  /** Dias para mostrar entregas/lembretes (usa definição das configurações). */
  reminderDaysBefore = this.userSettings.reminderDays;

  // Encomendas por entregar – usa o mesmo número de dias que lembretes (mín. 7)
  upcomingDeliveries = computed(() => {
    const days = Math.max(7, this.userSettings.getReminderDaysBefore());
    const inRange = this.orders.ordersByDeliveryDateRange(days);
    return inRange.filter(o => !o.delivered);
  });

  /** Lembretes na janela de aviso (cada um com o seu «notificar X dias antes»). */
  upcomingRemindersWithDays = computed(() => {
    const list = this.reminders.remindersInNotifyWindow();
    return list.map((r) => ({
      reminder: r,
      daysUntil: this.reminders.daysUntilDelivery(r.deliveryDate),
    }));
  });

  // Agrupar por data e paginar
  upcomingDeliveriesGrouped = computed(() => {
    const deliveries = this.upcomingDeliveries();
    const grouped = new Map<string, typeof deliveries>();
    
    deliveries.forEach(order => {
      const dateKey = order.deliveryDate || '';
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(order);
    });

    return Array.from(grouped.entries()).map(([date, orders]) => ({
      date,
      orders: orders.slice(0, 3), // Máximo 3 por dia na primeira página
      total: orders.length,
      hasMore: orders.length > 3,
    }));
  });

  // Encomendas para mostrar (até 5 no total, ou 3 por dia)
  displayedDeliveries = computed(() => {
    const grouped = this.upcomingDeliveriesGrouped();
    const result: Array<{ order: typeof grouped[0]['orders'][0]; date: string; isSameDay: boolean }> = [];
    let count = 0;

    for (const group of grouped) {
      if (count >= 5) break;
      
      const remaining = 5 - count;
      const toShow = Math.min(group.orders.length, remaining);
      
      for (let i = 0; i < toShow; i++) {
        result.push({
          order: group.orders[i],
          date: group.date,
          isSameDay: i > 0, // Se não é o primeiro do grupo, é do mesmo dia
        });
        count++;
      }
    }

    return result;
  });

  // Verificar se há mais encomendas para mostrar
  hasMoreDeliveries = computed(() => {
    const grouped = this.upcomingDeliveriesGrouped();
    let total = 0;
    for (const group of grouped) {
      total += group.total;
    }
    return total > this.displayedDeliveries().length;
  });

  // Alertas de entrega próxima (próximos 3 dias)
  deliveryAlerts = computed(() => {
    const deliveries = this.upcomingDeliveries();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    return deliveries
      .filter(o => {
        if (!o.deliveryDate) return false;
        const deliveryDate = new Date(o.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate >= today && deliveryDate <= threeDaysLater;
      })
      .map(o => {
        const deliveryDate = new Date(o.deliveryDate!);
        deliveryDate.setHours(0, 0, 0, 0);
        const diffTime = deliveryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          order: o,
          daysUntil: diffDays,
        };
      });
  });
  last7Days = computed(() => this.orders.getLast7DaysStats());
  paymentCounts = computed(() => this.orders.getPaymentStatusCounts());

  /** Total de lembretes (para o card) */
  reminderCount = computed(() => this.reminders.reminders().length);

  /** Estado da licença (aviso ≤5 dias no resumo pós-login). */
  licenseStatus = signal<LicenseStatusResponse | null>(null);

  /** Card de resumo ao entrar: mostrado após login até o utilizador fechar. Persiste em sessionStorage até logout. */
  loginSummaryDismissed = signal(false);

  /** Só mostra o resumo quando a cadeia pós-login (manutenção/boas-vindas/licença) terminou. */
  showLoginSummaryPopup = computed(
    () => !this.loginSummaryDismissed() && this.loginChain.activeStep() === null
  );

  /** Teste ou licença paga com ≤5 dias até expirar. */
  loginSummaryLicenseWarning = computed(() => {
    const lic = this.licenseStatus();
    return !!lic?.showLicenseExpiryWarning && lic.daysRemaining != null;
  });

  loginSummaryLicenseMessage = computed(() => {
    const lic = this.licenseStatus();
    if (!lic?.showLicenseExpiryWarning || lic.daysRemaining == null) return '';
    const days = lic.daysRemaining;
    const kind = lic.status === 'trial' ? 'período de teste' : 'licença';
    if (days <= 0) {
      return `O seu ${kind} terminou. Pague agora para continuar a usar o Chef Control.`;
    }
    const dayWord = days === 1 ? 'dia' : 'dias';
    return `Faltam ${days} ${dayWord} para o ${kind} terminar. Pague agora para não perder o acesso.`;
  });

  /** Janela de dias para encomendas por entregar (alinhada às configurações). */
  deliveryWindowDays = computed(() => Math.max(7, this.userSettings.getReminderDaysBefore()));

  /** Encomendas por entregar, ordenadas pela data de entrega. */
  loginSummaryDeliveries = computed(() =>
    [...this.upcomingDeliveries()]
      .sort((a, b) => (a.deliveryDate || '').localeCompare(b.deliveryDate || ''))
      .slice(0, 6)
      .map((order) => ({
        order,
        dateLabel: this.formatDeliveryDate(order.deliveryDate || ''),
        urgency: this.getDeliveryUrgency(order.deliveryDate || ''),
        daysUntil: this.daysUntilDate(order.deliveryDate || ''),
        pendingDebt: Math.max(0, (order.valueCharged ?? 0) - (order.valuePaid ?? 0)),
      }))
  );

  /** Total de encomendas por entregar na janela. */
  pendingDeliveryCount = computed(() => this.upcomingDeliveries().length);

  /** Encomendas por entregar com saldo em aberto. */
  pendingDeliveryWithDebtCount = computed(() =>
    this.upcomingDeliveries().filter((o) => (o.valueCharged ?? 0) > (o.valuePaid ?? 0)).length
  );

  /** Fecha o popup e grava em sessionStorage para não reaparecer até o próximo login. */
  dismissLoginSummary(): void {
    this.loginSummaryDismissed.set(true);
    try {
      sessionStorage.setItem(LOGIN_SUMMARY_DISMISSED_KEY, '1');
    } catch (_) {}
  }

  getProductName = orderDisplayName;
  getProductSize = orderDisplaySize;
  /** Formatar data do feriado para exibição (ex.: "7 de Abr"). */
  formatHolidayDate = formatHolidayDate;

  private chartProfitExpense: Chart<'line'> | null = null;
  private chartRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  chartRenderError = signal<string | null>(null);

  /** Anos e meses para os selects do filtro */
  filterYears = computed(() => {
    const orders = this.orders.allOrders();
    const years = new Set<number>();
    orders.forEach((o) => {
      const d = o.deliveryDate || o.createdAt;
      if (d) years.add(new Date(d).getFullYear());
    });
    const arr = Array.from(years).sort((a, b) => b - a);
    return arr.length ? arr : [new Date().getFullYear()];
  });
  readonly filterMonths = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
  ];

  // Dados para gráfico Lucro vs Despesa vs Dívidas (agrupados por dia, mês ou ano)
  profitExpenseData = computed((): ProfitExpensePoint[] => {
    const { from, to } = this.filterDateRange();
    const fromD = this.parseLocalDate(from);
    const toD = this.parseLocalDate(to);
    toD.setHours(23, 59, 59, 999);
    const granularity = this.chartGranularity();
    const inRange = this.ordersInRange();
    const buckets = this.buildChartBuckets(fromD, toD, granularity);

    return buckets.map((bucket) => {
      const bucketOrders = this.ordersForBucket(inRange, bucket.key, granularity);
      const metrics = this.aggregateOrderMetrics(bucketOrders);
      return {
        date: bucket.key,
        label: bucket.label,
        tooltipTitle: bucket.tooltipTitle,
        ...metrics,
      };
    });
  });

  private alertsShown = false;

  /** Valida datas: data fim nunca inferior a data início. Retorna true se válido. */
  private validateFilterDates(): boolean {
    const from = this.filterDateFrom().trim();
    const to = this.filterDateTo().trim();
    this.filterDateError.set('');
    if (!from || !to) return true;
    const dFrom = new Date(from);
    const dTo = new Date(to);
    if (dTo < dFrom) {
      this.filterDateError.set('A data fim não pode ser anterior à data início.');
      this.notificationService.showWarning('A data fim não pode ser anterior à data início. Corrija o intervalo.');
      return false;
    }
    return true;
  }

  /** Um único botão Aplicar: pode combinar intervalo de datas com ano/mês (prioridade: intervalo se ambos preenchidos). */
  applyFilters(): void {
    if (!this.validateFilterDates()) return;
    this.scheduleChartRefresh();
  }

  /** Ao alterar "De": se Até estiver preenchida e for menor que De, mostrar alerta e limpar erro ao corrigir */
  onFilterDateFromChange(value: string): void {
    this.filterDateFrom.set(value);
    this.filterDateError.set('');
    const to = this.filterDateTo().trim();
    if (value && to && new Date(to) < new Date(value)) {
      this.filterDateError.set('A data fim não pode ser anterior à data início.');
      this.notificationService.showWarning('A data fim não pode ser anterior à data início.');
    }
  }

  /** Ao alterar "Até": se De estiver preenchida e Até for menor, mostrar alerta */
  onFilterDateToChange(value: string): void {
    this.filterDateTo.set(value);
    this.filterDateError.set('');
    const from = this.filterDateFrom().trim();
    if (from && value && new Date(value) < new Date(from)) {
      this.filterDateError.set('A data fim não pode ser anterior à data início.');
      this.notificationService.showWarning('A data fim não pode ser anterior à data início.');
    }
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  clearFilter(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterYear.set(null);
    this.filterMonth.set(null);
    this.filterDateError.set('');
    this.scheduleChartRefresh();
  }

  constructor() {
    this.isAdmin = this.auth.isAdmin();
    if (!this.isAdmin) {
      afterNextRender(() => this.scheduleChartRefresh());
    }
    effect(() => {
      this.profitExpenseData();
      this.chartGranularity();
      this.filterDateFrom();
      this.filterDateTo();
      this.filterYear();
      this.filterMonth();
      this.filterDateRange();
      this.orders.allOrders();
      this.clientsCountInRange();
      this.ordersInRange();
      this.totalExpenseInRange();
      this.totalDebtInRange();
      if (!this.isAdmin) {
        this.scheduleChartRefresh();
      }
    });
    // Verificar alertas quando as encomendas mudarem
    effect(() => {
      const alerts = this.deliveryAlerts();
      if (alerts.length > 0 && !this.alertsShown) {
        setTimeout(() => this.checkDeliveryAlerts(), 500);
      }
    });
  }

  ngOnInit(): void {
    // Administradores são redirecionados para o painel admin
    if (this.isAdmin) {
      this.router.navigate(['/admin-dashboard']);
      return;
    }

    // Carregar pedidos e lembretes quando o dashboard inicializar (se o utilizador estiver autenticado)
    if (this.auth.isLoggedIn()) {
      void this.auth.getLicenseStatus().then((s) => this.licenseStatus.set(s));
      void this.orders.loadOrders().then(() => this.scheduleChartRefresh());
      this.reminders.loadReminders();
      this.withdrawalService.loadWithdrawals();
      try {
        if (sessionStorage.getItem(DASHBOARD_VISITED_KEY)) {
          this.isFirstVisitThisSession.set(false);
        } else {
          sessionStorage.setItem(DASHBOARD_VISITED_KEY, '1');
        }
        // Se o utilizador já fechou o resumo nesta sessão de login, não mostrar de novo
        if (sessionStorage.getItem(LOGIN_SUMMARY_DISMISSED_KEY) === '1') {
          this.loginSummaryDismissed.set(true);
        }
      } catch (_) {}
    }
  }

  ngAfterViewInit(): void {
    if (!this.isAdmin) {
      setTimeout(() => this.checkDeliveryAlerts(), 500);
    }
  }

  private checkDeliveryAlerts(): void {
    if (this.alertsShown) return;
    if (!this.loginSummaryDismissed()) return;
    const alerts = this.deliveryAlerts();
    alerts.slice(0, 3).forEach((alert) => {
      const productName = this.getProductName(alert.order);
      this.notificationService.showDeliveryAlert(
        alert.order.clientName,
        productName,
        alert.order.deliveryDate!,
        alert.daysUntil
      );
    });
    this.alertsShown = true;
  }

  formatDeliveryDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = new Date(date);
    deliveryDate.setHours(0, 0, 0, 0);
    
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoje';
    } else if (diffDays === 1) {
      return 'Amanhã';
    } else if (diffDays <= 7) {
      return `Em ${diffDays} dias`;
    } else {
      return date.toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: 'short',
      });
    }
  }

  getDeliveryUrgency(dateStr: string): 'today' | 'soon' | 'normal' {
    if (!dateStr) return 'normal';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = new Date(date);
    deliveryDate.setHours(0, 0, 0, 0);
    
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays <= 2) return 'soon';
    return 'normal';
  }

  private daysUntilDate(dateStr: string): number {
    if (!dateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = new Date(dateStr);
    deliveryDate.setHours(0, 0, 0, 0);
    return Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  urgencyLabel(urgency: 'today' | 'soon' | 'normal'): string {
    if (urgency === 'today') return 'Hoje';
    if (urgency === 'soon') return 'Urgente';
    return 'Agendada';
  }

  ngOnDestroy(): void {
    if (this.chartRefreshTimer) clearTimeout(this.chartRefreshTimer);
    this.chartProfitExpense?.destroy();
    this.chartProfitExpense = null;
  }

  private scheduleChartRefresh(): void {
    if (this.isAdmin) return;
    if (this.chartRefreshTimer) clearTimeout(this.chartRefreshTimer);
    this.chartRefreshTimer = setTimeout(() => {
      this.chartRefreshTimer = null;
      this.renderProfitExpenseChart();
    }, 80);
  }

  private renderProfitExpenseChart(): void {
    const canvas = this.chartProfitExpenseRef?.nativeElement;
    if (!canvas) return;

    try {
      const data = this.profitExpenseData();
      if (this.chartProfitExpense) {
        this.chartProfitExpense.destroy();
        this.chartProfitExpense = null;
      }
      this.chartProfitExpense = new Chart(canvas, this.buildProfitExpenseChartConfig(data, canvas));
      this.chartRenderError.set(null);
    } catch (err) {
      console.error('Erro ao desenhar gráfico do dashboard:', err);
      this.chartRenderError.set('Não foi possível carregar o gráfico. Recarregue a página.');
    }
  }

  private waveAreaGradient(
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

  private buildProfitExpenseChartConfig(
    data: ProfitExpensePoint[],
    canvas: HTMLCanvasElement
  ): ChartConfiguration<'line'> {
    const labels = data.map((d) => d.label);
    const profitData = data.map((d) => d.profit);
    const expenseData = data.map((d) => d.expense);
    const debtData = data.map((d) => d.debt);

    const allValues = [...profitData, ...expenseData, ...debtData];
    const maxValue = allValues.length > 0 ? Math.max(0, ...allValues) : 0;

    let maxYAxis: number;
    if (maxValue === 0) {
      maxYAxis = 1000;
    } else if (maxValue < 100) {
      maxYAxis = 100;
    } else if (maxValue < 1000) {
      maxYAxis = Math.ceil(maxValue / 100) * 100;
    } else {
      maxYAxis = Math.ceil(maxValue / 1000) * 1000;
    }

    let stepSize: number;
    if (maxYAxis <= 100) {
      stepSize = 20;
    } else if (maxYAxis <= 1000) {
      stepSize = Math.ceil(maxYAxis / 5 / 50) * 50;
    } else {
      stepSize = Math.ceil(maxYAxis / 5 / 200) * 200;
    }

    const g = this.chartGranularity();
    const ctx = canvas.getContext('2d');
    const chartH = canvas.parentElement?.clientHeight ?? 360;
    const gradLucro = ctx
      ? this.waveAreaGradient(ctx, chartH, PROFIT_WAVE_COLORS.lucro.line, PROFIT_WAVE_COLORS.lucro.top)
      : 'rgba(22, 163, 74, 0.25)';
    const gradDespesa = ctx
      ? this.waveAreaGradient(ctx, chartH, PROFIT_WAVE_COLORS.despesa.line, PROFIT_WAVE_COLORS.despesa.top)
      : 'rgba(220, 38, 38, 0.2)';
    const gradDividas = ctx
      ? this.waveAreaGradient(ctx, chartH, PROFIT_WAVE_COLORS.dividas.line, PROFIT_WAVE_COLORS.dividas.top)
      : 'rgba(202, 138, 4, 0.2)';

    const waveDataset = (
      label: string,
      seriesData: number[],
      lineColor: string,
      bg: string | CanvasGradient,
      order: number
    ) => ({
      label,
      data: seriesData,
      borderColor: lineColor,
      backgroundColor: bg,
      borderWidth: 2.5,
      tension: 0.5,
      cubicInterpolationMode: 'monotone' as const,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointBackgroundColor: lineColor,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointHitRadius: 14,
      order,
    });

    return {
      type: 'line',
      plugins: [profitExpenseSplineLabelsPlugin],
      data: {
        labels,
        datasets: [
          waveDataset('Dívidas', debtData, PROFIT_WAVE_COLORS.dividas.line, gradDividas, 1),
          waveDataset('Despesa', expenseData, PROFIT_WAVE_COLORS.despesa.line, gradDespesa, 2),
          waveDataset('Lucro', profitData, PROFIT_WAVE_COLORS.lucro.line, gradLucro, 3),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        elements: {
          line: {
            capBezierPoints: true,
            tension: 0.5,
            cubicInterpolationMode: 'monotone' as const,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            align: 'center',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 18,
              boxWidth: 10,
              boxHeight: 10,
              font: {
                size: 12,
                weight: 'bold',
              },
              color: '#475569',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: 12,
            titleFont: {
              size: 13,
              weight: 'bold',
            },
            bodyFont: {
              size: 12,
            },
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: (contexts) => {
                const index = contexts[0].dataIndex;
                const point = this.profitExpenseData()[index];
                return point?.tooltipTitle ?? '';
              },
              label: (context) => {
                const value = Number(context.parsed.y);
                const formatted = new Intl.NumberFormat('pt-MZ', {
                  style: 'currency',
                  currency: 'MZN',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(value);
                return `${context.dataset.label}: ${formatted}`;
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            border: { display: false },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              maxTicksLimit: g === 'day' ? 16 : g === 'month' ? 12 : 8,
              autoSkip: true,
              font: { size: 11, weight: 'bold' },
              color: '#475569',
            },
          },
          y: {
            beginAtZero: true,
            max: maxYAxis,
            border: { display: false },
            grid: {
              display: true,
              color: 'rgba(148, 163, 184, 0.22)',
              drawTicks: false,
            },
            ticks: {
              stepSize,
              font: { size: 10 },
              color: '#64748b',
              padding: 8,
              callback: (value) => {
                const num = Number(value);
                if (num >= 1000) {
                  return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1).replace('.', ',') + 'k';
                }
                return num.toLocaleString('pt-MZ', { maximumFractionDigits: 0 });
              },
            },
            title: {
              display: true,
              text: 'MZN',
              color: '#94a3b8',
              font: { size: 10, weight: 'bold' },
              padding: { bottom: 6 },
            },
          },
        },
        animation: {
          duration: 750,
          easing: 'easeOutQuart',
        },
      },
    };
  }
}
