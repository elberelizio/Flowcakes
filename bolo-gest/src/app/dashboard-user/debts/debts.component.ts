import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { NotificationService } from '../../services/notification.service';
import {
  Order,
  orderDisplayName,
  orderDisplaySize,
  getOrderStatusLabel,
  orderActiveDebt,
} from '../../models/order.model';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './debts.component.html',
  styleUrl: './debts.component.scss',
})
export class DebtsComponent implements OnInit {
  displayName = orderDisplayName;
  displaySize = orderDisplaySize;
  getOrderStatusLabel = getOrderStatusLabel;

  filterClient = signal('');
  filterCategory = signal('');
  filterStatus = signal('');
  filterPayment = signal('');
  showFilters = signal(false);

  /** Ordem para a qual vamos mostrar popup de confirmar pagamento */
  orderToConfirmPaid = signal<Order | null>(null);
  paymentAmountInput = signal<number>(0);

  /** Encomendas com valor em falta (dívidas) - não canceladas */
  ordersWithDebt = computed(() => {
    const all = this.ordersService.allOrders();
    return all.filter(o => {
      if (o.isCancelled || o.orderStatus === 'cancelled') return false;
      const saldo = Math.max(0, o.valueCharged - o.valuePaid);
      return saldo > 0;
    });
  });

  filteredOrdersWithDebt = computed(() => {
    const client = this.filterClient().trim().toLowerCase();
    const category = this.filterCategory();
    const status = this.filterStatus();
    const payment = this.filterPayment();

    return this.ordersWithDebt().filter(o => {
      if (client && !o.clientName.toLowerCase().includes(client)) return false;
      if (category && (o.category || '') !== category) return false;
      if (status && (o.orderStatus || 'ordered') !== status) return false;
      if (payment && o.paymentStatus !== payment) return false;
      return true;
    });
  });

  totalDebt = computed(() => {
    return this.ordersWithDebt().reduce((s, o) => s + Math.max(0, o.valueCharged - o.valuePaid), 0);
  });

  readonly debtOrderCount = computed(() => this.ordersWithDebt().length);

  readonly totalPaidOnDebtOrders = computed(() =>
    this.ordersWithDebt().reduce((s, o) => s + (o.valuePaid ?? 0), 0),
  );

  readonly totalChargedOnDebtOrders = computed(() =>
    this.ordersWithDebt().reduce((s, o) => s + (o.valueCharged ?? 0), 0),
  );

  private notification = inject(NotificationService);

  constructor(public ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }

  clearFilters(): void {
    this.filterClient.set('');
    this.filterCategory.set('');
    this.filterStatus.set('');
    this.filterPayment.set('');
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  getSaldo(o: Order): number {
    return orderActiveDebt(o);
  }

  getPaymentLabel(status: string): string {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'parcial': return 'Parcial';
      case 'pago': return 'Pago';
      default: return status || '—';
    }
  }

  getCategoryLabel(cat: string | undefined): string {
    if (!cat) return '—';
    return cat === 'doces' ? 'Doces' : cat === 'salgados' ? 'Salgados' : cat;
  }

  getDeliveryLocation(o: Order): string {
    if (o.deliveryAddress) return o.deliveryAddress;
    if (!o.observations) return o.hasDelivery ? 'Entrega' : 'Recolha do cliente';
    const m = o.observations.match(/Local entrega:\s*([^|]+)/);
    return m ? m[1].trim() : (o.hasDelivery ? 'Entrega' : 'Recolha do cliente');
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /** Abre popup para confirmar pagamento */
  openConfirmPaid(order: Order): void {
    this.orderToConfirmPaid.set(order);
    this.paymentAmountInput.set(this.getSaldo(order));
  }

  closeConfirmPaid(): void {
    this.orderToConfirmPaid.set(null);
    this.paymentAmountInput.set(0);
  }

  onPaymentAmountInput(raw: string): void {
    const n = Number(raw);
    this.paymentAmountInput.set(Number.isFinite(n) ? n : 0);
  }

  isPaymentAmountValid(): boolean {
    const order = this.orderToConfirmPaid();
    if (!order) return false;
    return this.paymentAmountInput() > 0;
  }

  /** Pré-visualização do resultado após registar o pagamento. */
  getPaymentPreviewText(order: Order): string {
    const amount = this.paymentAmountInput();
    if (!Number.isFinite(amount) || amount <= 0) return '';

    const nextPaid = order.valuePaid + amount;
    const remaining = order.valueCharged - nextPaid;

    if (remaining > 0) {
      return `Após confirmar, ficarão ${Math.round(remaining).toLocaleString('pt-MZ')} MZN por pagar.`;
    }
    if (remaining === 0) {
      return 'Após confirmar, a encomenda fica paga na totalidade.';
    }
    const excess = Math.round(-remaining);
    return `O cliente paga ${excess.toLocaleString('pt-MZ')} MZN a mais (gorjeta). Esse valor entra no lucro — sem dívida pendente.`;
  }

  /** Regista o recebimento de um montante (parcial, total ou a mais). */
  async confirmMarkPaid(): Promise<void> {
    const order = this.orderToConfirmPaid();
    if (!order) return;
    const amount = this.paymentAmountInput();
    if (amount <= 0) {
      this.notification.showError('Introduza um valor válido para pagamento.');
      return;
    }

    const nextValuePaid = order.valuePaid + amount;
    const overpayment = Math.max(0, nextValuePaid - order.valueCharged);
    const result = await this.ordersService.updateOrder(order.id, { valuePaid: nextValuePaid });
    if (result.ok) {
      const remaining = Math.max(0, order.valueCharged - nextValuePaid);
      if (overpayment > 0) {
        this.notification.showSuccess(
          `Pagamento registado. Encomenda paga. Gorjeta de ${overpayment.toLocaleString('pt-MZ')} MZN associada a ${order.clientName} e incluída no lucro.`,
        );
      } else if (remaining === 0) {
        this.notification.showSuccess('Pagamento registado. Encomenda paga na totalidade.');
      } else {
        this.notification.showSuccess(`Pagamento parcial registado. Saldo em falta: ${remaining.toLocaleString('pt-MZ')} MZN.`);
      }
    } else {
      this.notification.showError('Não foi possível atualizar o pagamento.');
    }
    this.closeConfirmPaid();
  }
}
