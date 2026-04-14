import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreSettingsService } from '../../services/store-settings.service';
import { StoreContextService } from '../../services/store-context.service';
import { WEB_STORE_URL_SEGMENT } from './web-store.routes.const';

interface OrderStatus {
  id: string;
  status: string;
  items: string[];
  total: string;
  date: string;
  estimatedDelivery: string;
  customerPhone: string;
  deliveryAddress: string;
  timeline: { status: string; time: string; completed: boolean }[];
}

@Component({
  selector: 'app-web-store-track-order',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './web-store-track-order.component.html',
  styleUrl: './web-store-track-order.component.scss',
})
export class WebStoreTrackOrderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storeSettings = inject(StoreSettingsService);
  storeContext = inject(StoreContextService);

  orderId = '';
  order = signal<OrderStatus | null>(null);
  error = signal('');
  isSearching = signal(false);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? this.route.snapshot.parent?.paramMap.get('slug');
    if (slug) {
      this.storeSettings.getStoreBySlug(slug).then(s => this.storeContext.setStore(s)).catch(() => this.storeContext.setStore(null));
    } else {
      this.storeContext.setStore(null);
    }
  }

  private mockOrders: Record<string, OrderStatus> = {
    PED001: {
      id: 'PED001',
      status: 'preparando',
      items: ['Bolo de Morango - 1kg', 'Brigadeiros - 20 unidades'],
      total: 'R$ 139,80',
      date: '07/03/2026',
      estimatedDelivery: '08/03/2026 - 14:00',
      customerPhone: '(11) 99999-9999',
      deliveryAddress: 'Rua dos Doces, 123 - Centro, São Paulo - SP',
      timeline: [
        { status: 'Pedido Recebido', time: '07/03 - 09:30', completed: true },
        { status: 'Em Preparação', time: '07/03 - 10:00', completed: true },
        { status: 'Pronto para Entrega', time: 'Previsto: 08/03 - 12:00', completed: false },
        { status: 'Saiu para Entrega', time: 'Previsto: 08/03 - 13:00', completed: false },
        { status: 'Entregue', time: 'Previsto: 08/03 - 14:00', completed: false },
      ],
    },
    PED002: {
      id: 'PED002',
      status: 'pronto',
      items: ['Cupcakes - 12 unidades', 'Coxinhas - 50 unidades'],
      total: 'R$ 234,50',
      date: '06/03/2026',
      estimatedDelivery: '07/03/2026 - 10:00',
      customerPhone: '(11) 98888-8888',
      deliveryAddress: 'Av. Paulista, 1000 - São Paulo - SP',
      timeline: [
        { status: 'Pedido Recebido', time: '06/03 - 14:00', completed: true },
        { status: 'Em Preparação', time: '06/03 - 15:00', completed: true },
        { status: 'Pronto para Entrega', time: '07/03 - 08:00', completed: true },
        { status: 'Saiu para Entrega', time: 'Previsto: 07/03 - 09:00', completed: false },
        { status: 'Entregue', time: 'Previsto: 07/03 - 10:00', completed: false },
      ],
    },
    PED003: {
      id: 'PED003',
      status: 'entregue',
      items: ['Bolo de Chocolate - 2kg', 'Docinhos - 100 unidades'],
      total: 'R$ 359,90',
      date: '05/03/2026',
      estimatedDelivery: '06/03/2026 - 16:00',
      customerPhone: '(11) 97777-7777',
      deliveryAddress: 'Rua Augusta, 500 - São Paulo - SP',
      timeline: [
        { status: 'Pedido Recebido', time: '05/03 - 10:00', completed: true },
        { status: 'Em Preparação', time: '05/03 - 11:00', completed: true },
        { status: 'Pronto para Entrega', time: '06/03 - 14:00', completed: true },
        { status: 'Saiu para Entrega', time: '06/03 - 15:00', completed: true },
        { status: 'Entregue', time: '06/03 - 15:45', completed: true },
      ],
    },
  };

  publicStoreBasePath(): string[] {
    const slug = this.storeContext.storeSlug();
    const root = `/${WEB_STORE_URL_SEGMENT}`;
    return slug ? [root, slug] : [root];
  }

  contactRoute(): string[] {
    const slug = this.storeContext.storeSlug();
    const root = `/${WEB_STORE_URL_SEGMENT}`;
    return slug ? [root, slug, 'contato'] : [root, 'contato'];
  }

  search(e: Event): void {
    e.preventDefault();
    this.isSearching.set(true);
    this.error.set('');
    this.order.set(null);
    const id = this.orderId.trim().toUpperCase();
    setTimeout(() => {
      const found = this.mockOrders[id];
      if (found) this.order.set(found);
      else this.error.set('Pedido não encontrado. Verifique o número e tente novamente.');
      this.isSearching.set(false);
    }, 1000);
  }

  progress(status: string): number {
    const map: Record<string, number> = { recebido: 20, preparando: 40, pronto: 60, entregue: 100 };
    return map[status] ?? 0;
  }

  statusText(status: string): string {
    const map: Record<string, string> = {
      recebido: 'Pedido Recebido',
      preparando: 'Em Preparação',
      pronto: 'Pronto para Entrega',
      entregue: 'Entregue',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      recebido: 'bg-blue',
      preparando: 'bg-yellow',
      pronto: 'bg-purple',
      entregue: 'bg-green',
    };
    return map[status] ?? 'bg-gray';
  }
}
