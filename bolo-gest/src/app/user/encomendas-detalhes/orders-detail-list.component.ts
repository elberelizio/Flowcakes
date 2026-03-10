import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { Order, orderDisplayName, orderDisplaySize, getOrderStatusLabel } from '../../models/order.model';

@Component({
  selector: 'app-orders-detail-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders-detail-list.component.html',
  styleUrl: './orders-detail-list.component.scss',
})
export class OrdersDetailListComponent implements OnInit {
  filterClient = signal('');
  filterCategory = signal('');
  filterStatus = signal('');

  orders = computed(() => {
    const all = this.ordersService.allOrders();
    return all
      .filter(o => !o.isCancelled && o.orderStatus !== 'cancelled')
      .sort((a, b) => {
        const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Number.MAX_SAFE_INTEGER;
        return dateA - dateB;
      });
  });

  filteredOrders = computed(() => {
    const list = this.orders();
    const client = this.filterClient().trim().toLowerCase();
    const category = this.filterCategory();
    const status = this.filterStatus();

    return list.filter(o => {
      if (client && !o.clientName.toLowerCase().includes(client)) return false;
      if (category && (o.category || '') !== category) return false;
      if (status && (o.orderStatus || 'ordered') !== status) return false;
      return true;
    });
  });

  displayName = orderDisplayName;
  displaySize = orderDisplaySize;

  constructor(public ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getCategoryLabel(cat: string | undefined): string {
    if (!cat) return '—';
    return cat === 'doces' ? 'Doces' : cat === 'salgados' ? 'Salgados' : cat;
  }

  getDeliveryLocation(order: Order): string {
    if (!order.observations) {
      return order.hasDelivery ? 'Entrega' : 'Recolha do cliente';
    }
    const obs = order.observations;
    const matchEnt = obs.match(/Local entrega:\s*([^|]+)/);
    if (matchEnt) return matchEnt[1].trim();
    const matchAddr = obs.match(/Endereço:\s*([^|]+)/);
    if (matchAddr) return order.hasDelivery ? 'Entrega' : matchAddr[1].trim();
    return order.hasDelivery ? 'Entrega' : 'Recolha do cliente';
  }

  getOrderStatusLabel = getOrderStatusLabel;

  getPaymentStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'parcial': return 'Parcial';
      case 'pago': return 'Pago';
      default: return status ?? '—';
    }
  }

  getVariableExpensesTotal(order: Order): number {
    if (!order.variableExpenses?.length) return 0;
    return order.variableExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  }

  saldo(order: Order): number {
    return Math.max(0, order.valueCharged - order.valuePaid);
  }

  clearFilters(): void {
    this.filterClient.set('');
    this.filterCategory.set('');
    this.filterStatus.set('');
  }
}
