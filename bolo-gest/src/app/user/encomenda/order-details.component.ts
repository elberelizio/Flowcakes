import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { Order, orderDisplayName, orderDisplaySize, getOrderStatusLabel } from '../../models/order.model';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss',
})
export class OrderDetailsComponent implements OnInit {
  order = signal<Order | null>(null);
  notFound = signal(false);

  displayName = orderDisplayName;
  displaySize = orderDisplaySize;

  constructor(
    private route: ActivatedRoute,
    private ordersService: OrdersService,
    private auth: AuthService
  ) {}

  /** ID curto da encomenda (8 primeiros caracteres) */
  getOrderIdShort(o: Order): string {
    if (!o?.id) return '—';
    return o.id.slice(0, 8).toUpperCase();
  }

  /** Nome do utilizador que registou (como só vemos as nossas encomendas, é o utilizador atual) */
  getRegistadoPor(): string {
    return this.auth.getDisplayName() || '—';
  }

  /** Extrai contacto das observações (formato "Contacto: xxx") */
  getContactFromOrder(o: Order): string {
    const obs = o.observations ?? '';
    const m = obs.match(/Contacto:\s*([^|]+)/);
    return m ? m[1].trim() : '—';
  }

  async ngOnInit(): Promise<void> {
    await this.ordersService.loadOrders();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.ordersService.getOrderById(id);
      if (found) {
        this.order.set(found);
      } else {
        this.notFound.set(true);
      }
    } else {
      this.notFound.set(true);
    }
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'parcial': return 'Parcial';
      case 'pago': return 'Pago';
      default: return status;
    }
  }

  getOrderStatusLabel = getOrderStatusLabel;

  getVariableExpensesTotal(order: Order): number {
    if (!order.variableExpenses?.length) return 0;
    return order.variableExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  }

  getCategoryLabel(cat: string | undefined): string {
    if (!cat) return '—';
    return cat === 'doces' ? 'Doces' : cat === 'salgados' ? 'Salgados' : cat;
  }

  getDeliveryLocation(order: Order): string {
    if (order.deliveryAddress) return order.deliveryAddress;
    if (!order.observations) return order.hasDelivery ? 'Entrega' : 'Recolha do cliente';
    const obs = order.observations;
    const matchEnt = obs.match(/Local entrega:\s*([^|]+)/);
    if (matchEnt) return matchEnt[1].trim();
    return order.hasDelivery ? 'Entrega' : 'Recolha do cliente';
  }

  /** Despesas variáveis totais (despesas extras do cadastro) */
  getDespesasExtrasTotal(o: Order): number {
    return this.getVariableExpensesTotal(o);
  }

  saldo(order: Order): number {
    return Math.max(0, order.valueCharged - order.valuePaid);
  }

  /** Nome do assistente inteligente */
  readonly assistantName = 'ChefAssist';

  /** Verifica dados em falta e retorna as mensagens do assistente */
  getAssistantWarnings(o: Order): string[] {
    const avisos: string[] = [];
    const contacto = this.getContactFromOrder(o);
    const dataEntrega = this.formatDate(o.deliveryDate);
    const localEntrega = this.getDeliveryLocation(o);
    const produto = this.displayName(o);
    const subcategoria = o.subcategory?.trim();

    if (contacto === '—' || !contacto?.trim()) {
      avisos.push('Falta o contacto do cliente. Adicione nas observações.');
    }
    if (dataEntrega === '—' || !o.deliveryDate) {
      avisos.push('Falta a data de entrega.');
    }
    if (o.hasDelivery && (!o.deliveryAddress || localEntrega === 'Entrega' || localEntrega === 'Recolha do cliente')) {
      avisos.push('Entrega ao cliente marcada mas falta o local de entrega.');
    }
    if (!produto || produto === '—') {
      avisos.push('Falta o nome do produto.');
    }
    if (!subcategoria || subcategoria === '—') {
      avisos.push('Falta o tipo de produto (categoria).');
    }
    if (!o.clientAddress?.trim() && !o.observations?.includes('Endereço:')) {
      avisos.push('Falta o endereço do cliente.');
    }

    return avisos;
  }

  /** Controla se o popup do assistente está visível */
  assistantPopupVisible = signal(true);

  closeAssistantPopup(): void {
    this.assistantPopupVisible.set(false);
  }

  /** Retorna true se a encomenda tem dívida (valor em falta) */
  hasDebt(o: Order): boolean {
    return this.saldo(o) > 0;
  }

  /** Mensagem do assistente sobre o estado da dívida */
  getAssistantDebtMessage(o: Order): string {
    const saldo = this.saldo(o);
    if (saldo > 0) {
      return `Esta encomenda tem dívida de ${saldo.toLocaleString('pt-MZ')} MZN.`;
    }
    return 'Esta encomenda está paga na totalidade.';
  }
}
