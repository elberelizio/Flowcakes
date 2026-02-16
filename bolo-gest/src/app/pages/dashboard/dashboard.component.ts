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
import { Chart, ChartConfiguration, registerables, Plugin } from 'chart.js';
import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { orderDisplayName, orderDisplaySize } from '../../models/order.model';
import { API_URL } from '../../core/api.config';
import { SnackbarComponent } from '../../components/snackbar/snackbar.component';
import { NotificationService } from '../../services/notification.service';

Chart.register(...registerables);

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
  imports: [CommonModule, RouterLink, SnackbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartProfitExpense') chartProfitExpenseRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartRevenueMonth') chartRevenueMonthRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild(SnackbarComponent) snackbar!: SnackbarComponent;

  private orders = inject(OrdersService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

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

  // Encomendas por entregar (não entregues, ordenadas por data de entrega)
  upcomingDeliveries = computed(() => {
    const allOrders = this.orders.allOrders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allOrders
      .filter(o => {
        if (o.delivered || o.isCancelled) return false;
        if (!o.deliveryDate) return false;
        const deliveryDate = new Date(o.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate >= today; // Apenas entregas futuras ou hoje
      })
      .sort((a, b) => {
        const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
        const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
        return dateA - dateB; // Mais próximas primeiro
      });
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

  revenueThisMonth = computed(() => {
    const list = this.revenueByMonth();
    const [y, m] = [this.today.getFullYear(), String(this.today.getMonth() + 1).padStart(2, '0')];
    const key = `${y}-${m}`;
    const found = list.find((x) => x.month === key);
    return found ? found.revenue : 0;
  });

  getProductName = orderDisplayName;
  getProductSize = orderDisplaySize;

  private chartProfitExpense: Chart<'line'> | null = null;
  private chartRevenueMonth: Chart<'bar'> | null = null;

  // Dados para gráfico Lucro vs Despesa
  profitExpenseData = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMinutes(0, 0, 0);
    today.setSeconds(0, 0);
    today.setMilliseconds(0);
    const result: { date: string; label: string; profit: number; expense: number }[] = [];
    
    // Últimos 30 dias começando de ontem (-1) até 30 dias atrás (-30)
    // Isso garante que o primeiro dia mostrado seja ontem, não hoje
    for (let i = 30; i >= 1; i--) {
      // Criar a data usando componentes locais para evitar problemas de timezone
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      
      // Extrair ano, mês e dia no timezone local
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth(); // 0-11
      const day = targetDate.getDate(); // 1-31
      
      // Criar string de data no formato YYYY-MM-DD (timezone local)
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Criar uma data UTC a partir dos componentes locais
      // Usar meio-dia UTC para garantir que quando convertida para ISO, mantenha o mesmo dia
      // Isso evita problemas quando o timezone local é diferente de UTC
      let dateForQuery = new Date(Date.UTC(year, month, day, 12, 0, 0));
      
      // Verificar se a data convertida para ISO corresponde ao dia local
      // Se não corresponder, ajustar (isso pode acontecer em timezones extremos)
      const isoDate = dateForQuery.toISOString().slice(0, 10);
      if (isoDate !== dateString) {
        // Se houver diferença, criar a data a partir da string diretamente
        // Isso garante que a data corresponda exatamente ao dia desejado
        dateForQuery = new Date(dateString + 'T12:00:00Z');
      }
      
      const orders = this.orders.ordersOfDay(dateForQuery);
      // Calcular lucro considerando despesas variáveis
      const profit = orders.reduce((sum, o) => {
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
      
      // Despesa: custo total inicial + despesas variáveis
      const expense = orders.reduce((sum, o) => {
        const baseExpense = o.costTotal;
        const varExpenses = o.variableExpenses?.reduce((s, e) => s + e.amount, 0) || 0;
        return sum + baseExpense + varExpenses;
      }, 0);
      
      // Usar o dia local para o label (garantindo que corresponde aos dados)
      const label = String(day).padStart(2, '0');
      
      result.push({
        date: dateString, // String de data no formato YYYY-MM-DD (timezone local)
        label: label, // Dia do mês (1-31) que corresponde exatamente aos dados buscados
        profit,
        expense,
      });
    }
    
    return result;
  });

  private alertsShown = false;

  constructor() {
    this.isAdmin = this.auth.isAdmin();
    effect(() => {
      this.profitExpenseData();
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
    // Carregar pedidos quando o dashboard inicializar (se o utilizador estiver autenticado)
    if (this.auth.isLoggedIn() && !this.isAdmin) {
      this.orders.loadOrders();
    }
    
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
    if (!this.isAdmin) {
      this.initCharts();
    }
    // Configurar snackbar após view init (para utilizadores normais e admin)
    // Usar múltiplas tentativas para garantir que o snackbar seja encontrado
    const initSnackbar = () => {
      if (this.snackbar) {
        this.notificationService.setSnackbar(this.snackbar);
        // Verificar alertas apenas para utilizadores normais (que têm encomendas)
        if (!this.isAdmin) {
          // Aguardar um pouco para garantir que os pedidos foram carregados
          setTimeout(() => {
            this.checkDeliveryAlerts();
          }, 500);
        }
        return true;
      }
      return false;
    };

    // Tentar inicializar imediatamente
    if (!initSnackbar()) {
      // Se não funcionar, tentar após 100ms
      setTimeout(() => {
        if (!initSnackbar()) {
          // Última tentativa após 500ms
          setTimeout(() => {
            initSnackbar();
          }, 500);
        }
      }, 100);
    }
  }

  private checkDeliveryAlerts(): void {
    if (this.alertsShown) return;
    
    // Verificar alertas após um pequeno delay para garantir que os dados estão carregados
    setTimeout(() => {
      if (!this.snackbar) return;
      
      this.notificationService.setSnackbar(this.snackbar);
      const alerts = this.deliveryAlerts();
      
      // Adicionar todas as notificações na fila (serão mostradas sequencialmente)
      // Mostrar apenas os 3 mais urgentes
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
    }, 1000);
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
    this.chartRevenueMonth?.destroy();
  }

  private initCharts(): void {
    if (this.chartProfitExpenseRef?.nativeElement) {
      this.chartProfitExpense = new Chart(
        this.chartProfitExpenseRef.nativeElement,
        this.getProfitExpenseChartConfig()
      );
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

  private getProfitExpenseChartConfig(): ChartConfiguration<'line'> {
    const data = this.profitExpenseData();
    const labels = data.map((d) => d.label);
    const profitData = data.map((d) => d.profit);
    const expenseData = data.map((d) => d.expense);
    
    // Calcular o valor máximo real dos dados (lucro e despesa)
    const maxProfit = Math.max(...profitData, 0);
    const maxExpense = Math.max(...expenseData, 0);
    const maxValue = Math.max(maxProfit, maxExpense);
    
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
      
      // Recalcular o eixo Y baseado nos novos dados
      const profitData = data.map((d) => d.profit);
      const expenseData = data.map((d) => d.expense);
      const maxProfit = Math.max(...profitData, 0);
      const maxExpense = Math.max(...expenseData, 0);
      const maxValue = Math.max(maxProfit, maxExpense);
      
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
      
      // Atualizar a configuração do eixo Y usando type assertion para evitar erros de TypeScript
      const scales = this.chartProfitExpense.options.scales as any;
      if (scales && scales['y']) {
        scales['y'].max = maxYAxis;
        // O Chart.js calculará os ticks automaticamente baseado no max
      }
      
      this.chartProfitExpense.update('active');
    }
  }
}
