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
import { Router, RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables, Plugin } from 'chart.js';
import { OrdersService } from '../../services/orders.service';
import { ReminderService } from '../../services/reminder.service';
import { AuthService } from '../../services/auth.service';
import { orderDisplayName, orderDisplaySize } from '../../models/order.model';
import { IconComponent } from '../../ui/icon/icon.component';
import { NotificationService } from '../../services/notification.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { WithdrawalService } from '../../services/withdrawal.service';
import { StoreSettingsService } from '../../services/store-settings.service';
import {
  getHolidayOnDate,
  getUpcomingHolidays,
  formatHolidayDate,
} from '../../core/data/mozambique-holidays';

Chart.register(...registerables);

const SUGESTIVE_MESSAGES = [
  'Organize o seu dia e aproveite cada encomenda.',
  'Um passo de cada vez: as suas finanças e entregas em ordem.',
  'Bom trabalho! Consulte os filtros para analisar por período.',
  'Mantenha os lembretes em dia para não faltar material.',
  'O Chef Control está aqui para simplificar o seu negócio.',
  'Revise os lucros e despesas para tomar melhores decisões.',
];
const DASHBOARD_VISITED_KEY = 'chefcontrol_dashboard_visited';
const LOGIN_SUMMARY_DISMISSED_KEY = 'chefcontrol_login_summary_dismissed';

// Plugin customizado para mostrar números suaves ao longo das linhas
const dataLabelsPlugin: Plugin<'line'> = {
  id: 'dataLabels',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    
    ctx.save();
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Mostrar apenas alguns valores para não poluir (a cada 4-5 dias)
    const step = Math.max(1, Math.floor(chart.data.labels!.length / 10));
    
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      const color = dataset.borderColor as string;
      
      meta.data.forEach((point: any, index: number) => {
        // Mostrar apenas alguns valores para manter limpo
        if (index % step !== 0 && index !== meta.data.length - 1) return;
        
        const value = dataset.data[index] as number;
        if (value === null || value === undefined || value === 0) return;
        
        const x = point.x;
        const y = point.y - 12; // Posicionar acima do ponto
        
        // Formatar valor de forma compacta
        let label = '';
        if (value >= 1000) {
          label = (value / 1000).toFixed(1) + 'k';
        } else {
          label = value.toFixed(0);
        }
        
        const textWidth = ctx.measureText(label).width;
        const padding = 3;
        const radius = 6;
        
        // Desenhar fundo suave para legibilidade
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = color + '30';
        ctx.lineWidth = 0.5;
        
        // Desenhar retângulo arredondado (compatível com todos browsers)
        ctx.beginPath();
        ctx.moveTo(x - textWidth / 2 - padding + radius, y - 7);
        ctx.lineTo(x + textWidth / 2 + padding - radius, y - 7);
        ctx.quadraticCurveTo(x + textWidth / 2 + padding, y - 7, x + textWidth / 2 + padding, y - 7 + radius);
        ctx.lineTo(x + textWidth / 2 + padding, y + 7 - radius);
        ctx.quadraticCurveTo(x + textWidth / 2 + padding, y + 7, x + textWidth / 2 + padding - radius, y + 7);
        ctx.lineTo(x - textWidth / 2 - padding + radius, y + 7);
        ctx.quadraticCurveTo(x - textWidth / 2 - padding, y + 7, x - textWidth / 2 - padding, y + 7 - radius);
        ctx.lineTo(x - textWidth / 2 - padding, y - 7 + radius);
        ctx.quadraticCurveTo(x - textWidth / 2 - padding, y - 7, x - textWidth / 2 - padding + radius, y - 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Desenhar texto com cor suave
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fillText(label, x, y);
        ctx.globalAlpha = 1;
      });
    });
    
    ctx.restore();
  },
};

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
  private storeSettings = inject(StoreSettingsService);

  meuSiteUrl = signal<string | null>(null);

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

  /** Situação boa = lucro final ≥ 0. Mau = prejuízo. */
  situationGood = computed(() => this.lucroFinal() >= 0);

  /** Mensagem de encorajamento ou alerta no popup (mostra despesas quando mau). */
  summaryMoodMessage = computed(() =>
    this.situationGood()
      ? 'Continue assim! A empresa está a gerar bons resultados.'
      : 'Despesas e retiradas a superar o valor recebido. Reveja os custos.'
  );

  /** Filtros do dashboard: painel fechado por defeito, campos zerados */
  showFilters = signal(false);
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');
  filterYear = signal<number | null>(null);
  filterMonth = signal<number | null>(null); // 1-12
  /** Alerta de datas inválidas (data fim &lt; data início) */
  filterDateError = signal<string>('');

  /** Intervalo efectivo para os gráficos. Se datas inválidas (fim < início), usa últimos 30 dias. */
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
    return this.getDefaultRange();
  });

  private getDefaultRange(): { from: string; to: string } {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const end = new Date(t);
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    };
  }

  /** Utilizador tem filtro activo (datas ou ano/mês preenchidos) */
  hasActiveFilter = computed(() => {
    const from = this.filterDateFrom().trim();
    const to = this.filterDateTo().trim();
    const y = this.filterYear();
    const m = this.filterMonth();
    return (from !== '' && to !== '') || (y != null && m != null);
  });

  /** Período filtrado não tem dados – mostrar mensagem amigável */
  filterHasNoData = computed(() => {
    if (!this.hasActiveFilter()) return false;
    const data = this.profitExpenseData();
    const totalPoints = data.reduce((s, d) => s + d.profit + d.expense + d.debt, 0);
    return data.length === 0 || totalPoints === 0;
  });

  /** Encomendas no intervalo do filtro (por data de entrega ou criação) */
  ordersInRange = computed(() => {
    const all = this.orders.allOrders();
    const { from, to } = this.filterDateRange();
    const fromD = new Date(from + 'T00:00:00');
    const toD = new Date(to + 'T23:59:59');
    return all.filter((o) => {
      const dateStr = o.deliveryDate || o.createdAt?.split('T')[0] || '';
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= fromD && d <= toD;
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

  /** Card de resumo ao entrar: mostrado após login até o utilizador fechar. Persiste em sessionStorage até logout. */
  loginSummaryDismissed = signal(false);

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

  // Dados para gráfico Lucro vs Despesa vs Dívidas (respeitando filtro)
  profitExpenseData = computed(() => {
    const { from, to } = this.filterDateRange();
    const fromD = new Date(from + 'T00:00:00');
    const toD = new Date(to + 'T23:59:59');
    const result: { date: string; label: string; profit: number; expense: number; debt: number }[] = [];
    const current = new Date(fromD);
    while (current <= toD) {
      const dateString = current.toISOString().slice(0, 10);
      const orders = this.orders.ordersOfDay(current);
      const profit = orders.reduce((sum, o) => {
        let orderProfit = o.profit;
        if (o.variableExpenses && o.variableExpenses.length > 0) {
          const varExpensesTotal = o.variableExpenses.reduce((s, e) => s + e.amount, 0);
          if (o.valuePaid < o.valueCharged && o.valuePaid > 0) {
            const paymentRatio = o.valuePaid / o.valueCharged;
            orderProfit = orderProfit - (varExpensesTotal * paymentRatio);
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
      const day = current.getDate();
      const month = current.getMonth() + 1;
      result.push({
        date: dateString,
        label: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
        profit,
        expense,
        debt,
      });
      current.setDate(current.getDate() + 1);
    }
    return result;
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
    this.updateCharts();
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
    this.updateCharts();
  }

  constructor() {
    this.isAdmin = this.auth.isAdmin();
    effect(() => {
      this.profitExpenseData();
      this.filterDateRange();
      this.clientsCountInRange();
      this.ordersInRange();
      this.totalExpenseInRange();
      this.totalDebtInRange();
      this.updateCharts();
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
      this.orders.loadOrders();
      this.reminders.loadReminders();
      this.withdrawalService.loadWithdrawals();
      this.storeSettings.getMyStoreSettings().then(s => {
        this.meuSiteUrl.set(s?.storeSlug ? `/loja/${s.storeSlug}` : '/loja');
      }).catch(() => this.meuSiteUrl.set('/loja'));
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
      this.initCharts();
      // Verificar alertas de entrega (snackbar global já configurado no app)
      setTimeout(() => this.checkDeliveryAlerts(), 500);
    }
  }

  private checkDeliveryAlerts(): void {
    if (this.alertsShown) return;
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

  ngOnDestroy(): void {
    this.chartProfitExpense?.destroy();
  }

  private initCharts(): void {
    if (this.chartProfitExpenseRef?.nativeElement) {
      this.chartProfitExpense = new Chart(
        this.chartProfitExpenseRef.nativeElement,
        this.getProfitExpenseChartConfig()
      );
    }
  }

  private getProfitExpenseChartConfig(): ChartConfiguration<'line'> {
    const data = this.profitExpenseData();
    const labels = data.map((d) => d.label);
    const profitData = data.map((d) => d.profit);
    const expenseData = data.map((d) => d.expense);
    const debtData = data.map((d) => d.debt);
    
    // Calcular o valor máximo real dos dados (lucro, despesa e dívidas)
    const maxProfit = Math.max(...profitData, 0);
    const maxExpense = Math.max(...expenseData, 0);
    const maxDebt = Math.max(...debtData, 0);
    const maxValue = Math.max(maxProfit, maxExpense, maxDebt);
    
    // Arredondar para cima para o próximo múltiplo de 100 ou 1000
    let maxYAxis: number;
    if (maxValue === 0) {
      maxYAxis = 1000; // Valor padrão se não houver dados
    } else if (maxValue < 100) {
      maxYAxis = 100; // Se máximo é menor que 100, vai até 100
    } else if (maxValue < 1000) {
      // Arredondar para o próximo múltiplo de 100
      maxYAxis = Math.ceil(maxValue / 100) * 100;
    } else {
      // Arredondar para o próximo múltiplo de 1000
      maxYAxis = Math.ceil(maxValue / 1000) * 1000;
    }
    
    // Calcular step size para distribuir os valores de forma equilibrada
    // Dividir em aproximadamente 5 intervalos
    let stepSize: number;
    if (maxYAxis <= 100) {
      stepSize = 20; // Para valores até 100, intervalos de 20
    } else if (maxYAxis <= 1000) {
      // Para valores até 1000, dividir em 5 partes e arredondar para múltiplo de 50
      stepSize = Math.ceil(maxYAxis / 5 / 50) * 50;
    } else {
      // Para valores maiores que 1000, dividir em 5 partes e arredondar para múltiplo de 200
      stepSize = Math.ceil(maxYAxis / 5 / 200) * 200;
    }

    return {
      type: 'line',
      plugins: [dataLabelsPlugin],
      data: {
        labels,
        datasets: [
          {
            label: 'Lucro',
            data: profitData,
            borderColor: '#059669', // Verde do sistema (--success)
            backgroundColor: 'rgba(5, 150, 105, 0.08)',
            borderWidth: 3,
            tension: 0.4, // Linha suave
            fill: false,
            pointRadius: 0, // Pontos invisíveis por padrão
            pointHoverRadius: 5, // Aparece apenas no hover
            pointBackgroundColor: '#059669',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#047857',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          },
          {
            label: 'Despesa',
            data: expenseData,
            borderColor: '#dc2626', // Vermelho do sistema (--danger)
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            borderWidth: 3,
            tension: 0.4, // Linha suave
            fill: false,
            pointRadius: 0, // Pontos invisíveis por padrão
            pointHoverRadius: 5, // Aparece apenas no hover
            pointBackgroundColor: '#dc2626',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#b91c1c',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          },
          {
            label: 'Dívidas',
            data: debtData,
            borderColor: '#d97706', // Laranja (--warning)
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: '#d97706',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#b45309',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 13,
                weight: 'normal',
              },
              color: 'var(--text)',
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
                // Mostrar a data completa no título do tooltip
                const index = contexts[0].dataIndex;
                const data = this.profitExpenseData();
                if (data[index]) {
                  const date = new Date(data[index].date);
                  return date.toLocaleDateString('pt-MZ', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  });
                }
                return '';
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
            grid: {
              display: true,
              color: 'rgba(148, 163, 184, 0.1)',
            },
            border: {
              display: false,
            },
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              font: {
                size: 11,
              },
              color: 'var(--text-muted)',
            },
          },
          y: {
            beginAtZero: true,
            max: maxYAxis,
            ticks: {
              stepSize: stepSize,
              font: {
                size: 11,
              },
              color: 'var(--text-muted)',
              callback: (value) => {
                const num = Number(value);
                if (num >= 1000) {
                  // Formatar valores maiores que 1000 de forma mais clara
                  const thousands = Math.floor(num / 1000);
                  const remainder = num % 1000;
                  if (remainder === 0) {
                    // Valor exato em milhares: mostrar "1 mil MZN", "2 mil MZN", etc.
                    return thousands + ' mil MZN';
                  } else {
                    // Valor com decimais: mostrar "1,5 mil MZN", "2,3 mil MZN", etc.
                    return (num / 1000).toFixed(1).replace('.', ',') + ' mil MZN';
                  }
                }
                // Valores menores que 1000: mostrar normalmente
                return num.toFixed(0) + ' MZN';
              },
            },
            grid: {
              display: true,
              color: 'rgba(226, 232, 240, 0.6)', // Grid mais suave harmonizado com --border
            },
            border: {
              display: false,
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart',
        },
      },
    };
  }

  private updateCharts(): void {
    if (this.chartProfitExpense && this.chartProfitExpenseRef?.nativeElement) {
      const data = this.profitExpenseData();
      this.chartProfitExpense.data.labels = data.map((d) => d.label);
      this.chartProfitExpense.data.datasets[0].data = data.map((d) => d.profit);
      this.chartProfitExpense.data.datasets[1].data = data.map((d) => d.expense);
      this.chartProfitExpense.data.datasets[2].data = data.map((d) => d.debt);

      const profitData = data.map((d) => d.profit);
      const expenseData = data.map((d) => d.expense);
      const debtData = data.map((d) => d.debt);
      const maxProfit = Math.max(...profitData, 0);
      const maxExpense = Math.max(...expenseData, 0);
      const maxDebt = Math.max(...debtData, 0);
      const maxValue = Math.max(maxProfit, maxExpense, maxDebt);

      let maxYAxis: number;
      if (maxValue === 0) maxYAxis = 1000;
      else if (maxValue < 100) maxYAxis = 100;
      else if (maxValue < 1000) maxYAxis = Math.ceil(maxValue / 100) * 100;
      else maxYAxis = Math.ceil(maxValue / 1000) * 1000;

      const scales = this.chartProfitExpense.options.scales as any;
      if (scales?.y) scales.y.max = maxYAxis;
      this.chartProfitExpense.update('active');
    }
  }
}
