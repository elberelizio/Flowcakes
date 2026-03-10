import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';

export interface ClientSummary {
  name: string;
  orderCount: number;
  types: Set<'doces' | 'salgados'>;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent implements OnInit {
  filterClient = signal('');
  filterType = signal<'doces' | 'salgados' | ''>('');

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
      } else {
        const types = new Set<'doces' | 'salgados'>();
        if (cat) types.add(cat);
        map.set(name, { name, orderCount: 1, types });
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
}
