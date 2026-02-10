import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  orders: AdminOrder[] = [];
  loading = true;
  error = '';

  /** Converte para Order para usar orderDisplayName/orderDisplaySize (exigem ingredientIds). */
  toOrder(o: AdminOrder): Order {
    return { ...o, ingredientIds: o.ingredientIds ?? [] } as Order;
  }

  displayName = orderDisplayName;
  displaySize = orderDisplaySize;

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
