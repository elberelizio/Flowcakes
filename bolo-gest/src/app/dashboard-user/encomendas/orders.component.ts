import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { NotificationService } from '../../services/notification.service';
import { Order, orderDisplayName, orderDisplaySize, getOrderStatusLabel } from '../../models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  filterClient = signal('');
  filterCategory = signal('');
  filterStatus = signal('');
  filterPayment = signal('');

  allOrders = computed(() => {
    const all = this.ordersService.allOrders();
    const active = all.filter(o => !(o.isCancelled === true || o.orderStatus === 'cancelled'));
    const cancelled = all.filter(o => o.isCancelled === true || o.orderStatus === 'cancelled');
    return { active, cancelled };
  });

  filteredOrders = computed(() => {
    const { active, cancelled } = this.allOrders();
    const client = this.filterClient().trim().toLowerCase();
    const status = this.filterStatus();
    const payment = this.filterPayment();
    const category = this.filterCategory();

    const list = status === 'cancelled' ? cancelled : active;
    let result = list.filter(o => {
      if (client && !o.clientName.toLowerCase().includes(client)) return false;
      if (category && (o.category || '') !== category) return false;
      if (status && status !== 'cancelled' && (o.orderStatus || 'ordered') !== status) return false;
      if (payment && o.paymentStatus !== payment) return false;
      return true;
    });

    if (status !== 'cancelled') {
      result = result.sort((a, b) => {
        const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Number.MAX_SAFE_INTEGER;
        return dateA - dateB;
      });
    } else {
      result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  });

  get isShowingCancelled(): boolean {
    return this.filterStatus() === 'cancelled';
  }

  orderToCancel = signal<Order | null>(null);
  orderToConfirmDelivery = signal<Order | null>(null);
  /** Valor digitado pelo utilizador para pagamento parcial na entrega */
  partialPaymentInput = signal<number>(0);

  private notification = inject(NotificationService);

  constructor(public ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }

  getSaldo(order: Order): number {
    return Math.max(0, order.valueCharged - order.valuePaid);
  }

  getPaymentLabel(status: string): string {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'parcial': return 'Parcial';
      case 'pago': return 'Pago';
      default: return status || '—';
    }
  }

  markDelivered(order: Order): void {
    const saldo = this.getSaldo(order);
    if (saldo > 0) {
      this.orderToConfirmDelivery.set(order);
      this.partialPaymentInput.set(0);
    } else {
      this.ordersService.markDelivered(order.id);
    }
  }

  /** Confirma entrega e marca o valor pendente como recebido (atualiza para pago total) */
  async confirmDeliveryAndReceivePayment(): Promise<void> {
    const order = this.orderToConfirmDelivery();
    if (!order) return;
    const ok = await this.ordersService.updateOrder(order.id, { valuePaid: order.valueCharged });
    if (ok) {
      await this.ordersService.markDelivered(order.id);
      this.notification.showSuccess('Entrega confirmada e valor registado como pago.');
    } else {
      this.notification.showError('Não foi possível atualizar a encomenda.');
    }
    this.closeConfirmDeliveryModal();
  }

  /** Confirma entrega mas mantém como dívida (não atualiza o valor pago) */
  async confirmDeliveryAsDebt(): Promise<void> {
    const order = this.orderToConfirmDelivery();
    if (!order) return;
    const ok = await this.ordersService.markDelivered(order.id);
    if (ok) this.notification.showSuccess('Entrega confirmada.');
    else this.notification.showError('Não foi possível confirmar a entrega.');
    this.closeConfirmDeliveryModal();
  }

  closeConfirmDeliveryModal(): void {
    this.orderToConfirmDelivery.set(null);
    this.partialPaymentInput.set(0);
  }

  cancelOrder(order: Order): void {
    this.orderToCancel.set(order);
  }

  confirmCancelOrder(): void {
    const order = this.orderToCancel();
    if (order) {
      this.ordersService.cancelOrder(order.id).then((ok) => {
        if (ok) this.notification.showSuccess('Encomenda cancelada.');
        else this.notification.showError('Não foi possível cancelar a encomenda.');
      });
      this.closeCancelModal();
    }
  }

  closeCancelModal(): void {
    this.orderToCancel.set(null);
  }

  clearFilters(): void {
    this.filterClient.set('');
    this.filterCategory.set('');
    this.filterStatus.set('');
    this.filterPayment.set('');
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

  displayName = orderDisplayName;
  displaySize = orderDisplaySize;
  getOrderStatusLabel = getOrderStatusLabel;

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /** Atualiza o valor digitado para pagamento parcial na entrega */
  onPartialPaymentInput(raw: string): void {
    const v = Number(raw);
    this.partialPaymentInput.set(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  /** Confirma entrega e adiciona um valor extra ao que já foi pago (pagamento parcial na entrega) */
  async confirmDeliveryWithPartialPayment(): Promise<void> {
    const order = this.orderToConfirmDelivery();
    if (!order) return;
    const extra = this.partialPaymentInput();
    if (!Number.isFinite(extra) || extra <= 0) {
      this.notification.showError('Indique quantos meticais o cliente lhe entregou neste momento (valor maior que zero).');
      return;
    }
    const newPaid = order.valuePaid + extra;
    const ok = await this.ordersService.updateOrder(order.id, { valuePaid: newPaid });
    if (ok) {
      await this.ordersService.markDelivered(order.id);
      this.notification.showSuccess('Pagamento registado e entrega confirmada.');
    } else {
      this.notification.showError('Não foi possível atualizar o pagamento.');
    }
    this.closeConfirmDeliveryModal();
  }

  /** Pré-visualização do saldo após registar o pagamento parcial (texto para o modal). */
  getPartialPaymentPreviewText(order: Order): string {
    const extra = this.partialPaymentInput();
    if (!Number.isFinite(extra) || extra <= 0) return '';
    const newPaid = order.valuePaid + extra;
    const remaining = order.valueCharged - newPaid;
    const r = Math.round(remaining);
    if (r > 0) {
      return `Após confirmar, ficarão ${r} MZN por pagar nesta encomenda.`;
    }
    if (r === 0) {
      return 'Após confirmar, a encomenda fica como paga na totalidade.';
    }
    const excess = Math.round(-remaining);
    return `O total pago fica acima do valor da encomenda em ${excess} MZN (por exemplo gorjeta ou pagamento a mais).`;
  }

}
