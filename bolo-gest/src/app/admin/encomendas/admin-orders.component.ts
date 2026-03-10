import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api.config';
import { Order, orderDisplayName, orderDisplaySize } from '../../models/order.model';

export interface AdminOrder {
  id: string;
  createdAt: string;
  clientName: string;
  category?: string;
  subcategory?: string;
  productName?: string;
  size?: string;
  quantityKg?: number;
  unitsPerKg?: number;
  valueCharged: number;
  valuePaid: number;
  costTotal: number;
  profit: number;
  paymentStatus: string;
  delivered: boolean;
  ingredientIds?: string[];
  userPhone?: string;
  userFullName?: string;
  cakeName?: string;
  cakeSize?: string;
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  orders: AdminOrder[] = [];
  loading = true;
  error = '';

  /** Filtros */
  filterUser = signal('');
  filterMonth = signal<number>(0); // 0 = todos
  filterYear = signal<number>(0);  // 0 = todos
  filterProduct = signal('');

  /** Converte para Order para usar orderDisplayName/orderDisplaySize (exigem ingredientIds). */
  toOrder(o: AdminOrder): Order {
    return { ...o, ingredientIds: o.ingredientIds ?? [] } as Order;
  }

  displayName = orderDisplayName;
  displaySize = orderDisplaySize;

  /** Chave única do utilizador (para agrupamento) */
  userKey(o: AdminOrder): string {
    const label = this.userLabel(o);
    return label || '—';
  }

  /** Lista de utilizadores únicos para o filtro */
  readonly uniqueUsers = computed(() => {
    const set = new Set<string>();
    this.orders.forEach(o => {
      const k = this.userKey(o);
      if (k && k !== '—') set.add(k);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  /** Lista de produtos únicos para o filtro */
  readonly uniqueProducts = computed(() => {
    const set = new Set<string>();
    this.orders.forEach(o => {
      const name = this.displayName(this.toOrder(o));
      if (name && name !== '—') set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  /** Encomendas filtradas */
  readonly filteredOrders = computed(() => {
    let list = this.orders;
    const user = this.filterUser().trim();
    if (user) {
      list = list.filter(o => this.userKey(o) === user);
    }
    const month = this.filterMonth();
    const year = this.filterYear();
    if (month > 0 || year > 0) {
      list = list.filter(o => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        if (year > 0 && d.getFullYear() !== year) return false;
        if (month > 0 && d.getMonth() + 1 !== month) return false;
        return true;
      });
    }
    const product = this.filterProduct().trim();
    if (product) {
      list = list.filter(o => this.displayName(this.toOrder(o)) === product);
    }
    return list;
  });

  /** Estatísticas sobre encomendas filtradas */
  readonly stats = computed(() => {
    const list = this.filteredOrders();
    const totalDespesas = list.reduce((s, o) => s + (Number(o.costTotal) || 0), 0);
    const byUser = new Map<string, number>();
    const byProduct = new Map<string, number>();
    const byUserThisMonth = new Map<string, number>();
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    list.forEach(o => {
      const uk = this.userKey(o);
      byUser.set(uk, (byUser.get(uk) ?? 0) + 1);
      const pn = this.displayName(this.toOrder(o));
      byProduct.set(pn, (byProduct.get(pn) ?? 0) + 1);
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
          byUserThisMonth.set(uk, (byUserThisMonth.get(uk) ?? 0) + 1);
        }
      }
    });

    let userWithMostSales = '';
    let maxCount = 0;
    byUser.forEach((count, u) => {
      if (count > maxCount) {
        maxCount = count;
        userWithMostSales = u;
      }
    });

    let productMostSold = '';
    let maxProd = 0;
    byProduct.forEach((count, p) => {
      if (count > maxProd) {
        maxProd = count;
        productMostSold = p;
      }
    });

    let userOfMonth = '';
    let maxMonth = 0;
    byUserThisMonth.forEach((count, u) => {
      if (count > maxMonth) {
        maxMonth = count;
        userOfMonth = u;
      }
    });

    return {
      totalDespesas,
      userWithMostSales: userWithMostSales || '—',
      totalVendasUser: maxCount,
      productMostSold: productMostSold || '—',
      productMostSoldCount: maxProd,
      userOfMonth: userOfMonth || '—',
      userOfMonthCount: maxMonth,
    };
  });

  /** Meses para o filtro */
  readonly months = [
    { v: 0, label: 'Todos os meses' },
    { v: 1, label: 'Janeiro' }, { v: 2, label: 'Fevereiro' }, { v: 3, label: 'Março' },
    { v: 4, label: 'Abril' }, { v: 5, label: 'Maio' }, { v: 6, label: 'Junho' },
    { v: 7, label: 'Julho' }, { v: 8, label: 'Agosto' }, { v: 9, label: 'Setembro' },
    { v: 10, label: 'Outubro' }, { v: 11, label: 'Novembro' }, { v: 12, label: 'Dezembro' },
  ];

  /** Anos presentes nos dados para o filtro */
  readonly years = computed(() => {
    const set = new Set<number>();
    this.orders.forEach(o => {
      if (o.createdAt) set.add(new Date(o.createdAt).getFullYear());
    });
    return [0, ...Array.from(set).sort((a, b) => b - a)];
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.http.get<AdminOrder[]>(`${API_URL}/admin/orders`).subscribe({
      next: (list) => {
        this.orders = list || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar encomendas.';
        this.loading = false;
      },
    });
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  userLabel(o: AdminOrder): string {
    if (o.userFullName?.trim()) return `${o.userFullName} (${o.userPhone || '—'})`;
    return o.userPhone || '—';
  }
}
