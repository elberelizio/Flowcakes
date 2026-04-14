import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { NotificationService } from '../../services/notification.service';
import { Order, orderDisplayName, orderDisplaySize, getOrderStatusLabel } from '../../models/order.model';

@Component({
  selector: 'app-dividas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dividas.component.html',
  styleUrl: './dividas.component.scss',
})
export class DividasComponent implements OnInit {
  displayName = orderDisplayName;
  displaySize = orderDisplaySize;
  getOrderStatusLabel = getOrderStatusLabel;

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

  totalDebt = computed(() => {
    return this.ordersWithDebt().reduce((s, o) => s + Math.max(0, o.valueCharged - o.valuePaid), 0);
  });

  private notification = inject(NotificationService);

  constructor(public ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }

  getSaldo(o: Order): number {
    return Math.max(0, o.valueCharged - o.valuePaid);
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
    const amount = this.paymentAmountInput();
    const saldo = this.getSaldo(order);
    return amount > 0 && amount <= saldo;
  }

  /** Regista o recebimento de um montante (parcial ou total) */
  async confirmMarkPaid(): Promise<void> {
    const order = this.orderToConfirmPaid();
    if (!order) return;
    const amount = this.paymentAmountInput();
    const saldo = this.getSaldo(order);
    if (amount <= 0 || amount > saldo) {
      this.notification.showError('Introduza um valor válido para pagamento.');
      return;
    }

    const nextValuePaid = order.valuePaid + amount;
    const ok = await this.ordersService.updateOrder(order.id, { valuePaid: nextValuePaid });
    if (ok) {
      const remaining = Math.max(0, order.valueCharged - nextValuePaid);
      if (remaining === 0) this.notification.showSuccess('Pagamento registado. Encomenda paga na totalidade.');
      else this.notification.showSuccess(`Pagamento parcial registado. Saldo em falta: ${remaining.toLocaleString('pt-MZ')} MZN.`);
    } else {
      this.notification.showError('Não foi possível atualizar o pagamento.');
    }
    this.closeConfirmPaid();
  }
}
