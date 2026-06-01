import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { Order, orderDisplayName, orderDisplaySize } from '../../models/order.model';

export interface ClientSummary {
  name: string;
  orderCount: number;
  types: Set<'doces' | 'salgados'>;
  totalCharged: number;
  totalPaid: number;
  totalDebt: number;
  paidOrders: number;
  debtOrders: number;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent implements OnInit {
  displayName = orderDisplayName;
  displaySize = orderDisplaySize;
  filterClient = signal('');
  filterType = signal<'doces' | 'salgados' | ''>('');
  selectedClientName = signal<string | null>(null);

  clients = computed(() => {
    const orders = this.ordersService.allOrders();
    const active = orders.filter(o => !(o.isCancelled === true || o.orderStatus === 'cancelled'));

    const map = new Map<string, ClientSummary>();
    for (const o of active) {
      const name = (o.clientName || '').trim();
      if (!name) continue;
      const existing = map.get(name);
      const cat = o.category === 'doces' || o.category === 'salgados' ? o.category : null;
      if (existing) {
        existing.orderCount++;
        if (cat) existing.types.add(cat);
        existing.totalCharged += o.valueCharged;
        existing.totalPaid += o.valuePaid;
        existing.totalDebt += Math.max(0, o.valueCharged - o.valuePaid);
        if (Math.max(0, o.valueCharged - o.valuePaid) === 0) existing.paidOrders++;
        else existing.debtOrders++;
      } else {
        const types = new Set<'doces' | 'salgados'>();
        if (cat) types.add(cat);
        const debt = Math.max(0, o.valueCharged - o.valuePaid);
        map.set(name, {
          name,
          orderCount: 1,
          types,
          totalCharged: o.valueCharged,
          totalPaid: o.valuePaid,
          totalDebt: debt,
          paidOrders: debt === 0 ? 1 : 0,
          debtOrders: debt > 0 ? 1 : 0,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.orderCount - a.orderCount);
  });

  filteredClients = computed(() => {
    const list = this.clients();
    const name = this.filterClient().toLowerCase().trim();
    const type = this.filterType();
    if (!name && !type) return list;
    return list.filter(c => {
      if (name && !c.name.toLowerCase().includes(name)) return false;
      if (type && !c.types.has(type)) return false;
      return true;
    });
  });

  readonly clientsWithDebt = computed(() => this.filteredClients().filter((c) => c.totalDebt > 0).length);

  readonly totalOutstandingDebt = computed(() =>
    this.filteredClients().reduce((sum, c) => sum + c.totalDebt, 0),
  );

  clearFilters(): void {
    this.filterClient.set('');
    this.filterType.set('');
  }

  constructor(public ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }

  getTypesLabel(types: Set<'doces' | 'salgados'>): string {
    const arr = Array.from(types);
    if (arr.length === 0) return '—';
    if (arr.length === 2) return 'Doces, Salgados';
    return arr[0] === 'doces' ? 'Doces' : 'Salgados';
  }

  getPaymentRate(c: ClientSummary): number {
    if (c.totalCharged <= 0) return 100;
    return Math.max(0, Math.min(100, (c.totalPaid / c.totalCharged) * 100));
  }

  getClientProfile(c: ClientSummary): string {
    if (c.totalDebt <= 0) return 'Excelente';
    const paymentRate = this.getPaymentRate(c);
    if (paymentRate >= 85 && c.debtOrders <= 1) return 'Bom';
    if (paymentRate >= 60) return 'Atenção';
    return 'Risco';
  }

  openClientDetails(name: string): void {
    this.selectedClientName.set(name);
  }

  closeClientDetails(): void {
    this.selectedClientName.set(null);
  }

  getClientOrders(name: string): Order[] {
    const normalized = (name || '').trim().toLowerCase();
    return this.ordersService
      .allOrders()
      .filter(o => (o.clientName || '').trim().toLowerCase() === normalized)
      .sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());
  }

  getOrdersTotalCharged(orders: Order[]): number {
    let total = 0;
    for (const o of orders) total += o.valueCharged;
    return total;
  }

  getOrdersTotalPaid(orders: Order[]): number {
    let total = 0;
    for (const o of orders) total += o.valuePaid;
    return total;
  }

  getOrdersTotalDebt(orders: Order[]): number {
    let total = 0;
    for (const o of orders) total += Math.max(0, o.valueCharged - o.valuePaid);
    return total;
  }

  getOrderDebt(order: Order): number {
    return Math.max(0, order.valueCharged - order.valuePaid);
  }
}
