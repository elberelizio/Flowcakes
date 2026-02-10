import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { API_URL } from '../core/api.config';
import { Order, OrderCategory, PaymentStatus, ProductSize } from '../models/order.model';

export interface OrderCreateInput {
  clientName: string;
  category: OrderCategory;
  subcategory: string;
  productName: string;
  size?: ProductSize;
  quantityKg?: number;
  unitsPerKg?: number;
  valueCharged: number;
  valuePaid: number;
  ingredients: { name: string; unitValue: number }[];
  energyCost: number;
  observations?: string;
}

/** DTO enviado para a API */
interface OrderRequest {
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
  ingredientIds: string[];
  observations?: string;
  cakeName?: string;
  cakeSize?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly orders = signal<Order[]>([]);
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);

  allOrders = computed(() => this.orders());
  isLoading = computed(() => this.loading());
  apiError = computed(() => this.error());

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http
      .get<OrderApi[]>(`${API_URL}/orders`)
      .subscribe({
        next: (list) => {
          this.orders.set(list.map(apiToOrder));
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || err?.message || 'Erro ao carregar pedidos');
          this.orders.set([]);
          this.loading.set(false);
        },
      });
  }

  create(input: OrderCreateInput): Promise<Order | null> {
    const costTotal =
      input.ingredients.reduce((s, i) => s + i.unitValue, 0) + (input.energyCost || 0);
    const profit = input.valueCharged - costTotal;
    const paymentStatus: PaymentStatus =
      input.valuePaid >= input.valueCharged
        ? 'pago'
        : input.valuePaid > 0
          ? 'parcial'
          : 'pendente';

    const body: OrderRequest = {
      clientName: input.clientName,
      category: input.category,
      subcategory: input.subcategory,
      productName: input.productName,
      size: input.size,
      quantityKg: input.quantityKg,
      unitsPerKg: input.unitsPerKg,
      valueCharged: input.valueCharged,
      valuePaid: input.valuePaid,
      costTotal,
      profit,
      paymentStatus,
      delivered: false,
      ingredientIds: [],
      observations: input.observations?.trim() || undefined,
    };

    return this.http
      .post<OrderApi>(`${API_URL}/orders`, body)
      .toPromise()
      .then((created) => {
        if (created) {
          const order = apiToOrder(created);
          this.orders.update((list) => [order, ...list]);
          return order;
        }
        return null;
      })
      .catch(() => null);
  }

  updatePayment(orderId: string, valuePaid: number): Promise<boolean> {
    const order = this.orders().find((o) => o.id === orderId);
    if (!order) return Promise.resolve(false);
    const paymentStatus: PaymentStatus =
      valuePaid >= order.valueCharged ? 'pago' : valuePaid > 0 ? 'parcial' : 'pendente';
    const body: OrderRequest = {
      clientName: order.clientName,
      category: order.category,
      subcategory: order.subcategory,
      productName: order.productName,
      size: order.size,
      quantityKg: order.quantityKg,
      unitsPerKg: order.unitsPerKg,
      valueCharged: order.valueCharged,
      valuePaid,
      costTotal: order.costTotal,
      profit: order.profit,
      paymentStatus,
      delivered: order.delivered,
      ingredientIds: order.ingredientIds || [],
      observations: order.observations,
      cakeName: order.cakeName,
      cakeSize: order.cakeSize,
    };
    return this.http
      .put<OrderApi>(`${API_URL}/orders/${orderId}`, body)
      .toPromise()
      .then((updated) => {
        if (updated) {
          this.orders.update((list) =>
            list.map((o) => (o.id === orderId ? apiToOrder(updated) : o))
          );
          return true;
        }
        return false;
      })
      .catch(() => false);
  }

  markDelivered(orderId: string): Promise<boolean> {
    const order = this.orders().find((o) => o.id === orderId);
    if (!order) return Promise.resolve(false);
    const body: OrderRequest = {
      clientName: order.clientName,
      category: order.category,
      subcategory: order.subcategory,
      productName: order.productName,
      size: order.size,
      quantityKg: order.quantityKg,
      unitsPerKg: order.unitsPerKg,
      valueCharged: order.valueCharged,
      valuePaid: order.valuePaid,
      costTotal: order.costTotal,
      profit: order.profit,
      paymentStatus: order.paymentStatus,
      delivered: true,
      ingredientIds: order.ingredientIds || [],
      observations: order.observations,
      cakeName: order.cakeName,
      cakeSize: order.cakeSize,
    };
    return this.http
      .put<OrderApi>(`${API_URL}/orders/${orderId}`, body)
      .toPromise()
      .then((updated) => {
        if (updated) {
          this.orders.update((list) =>
            list.map((o) => (o.id === orderId ? apiToOrder(updated) : o))
          );
          return true;
        }
        return false;
      })
      .catch(() => false);
  }

  getOrderById(id: string): Order | undefined {
    return this.orders().find((o) => o.id === id);
  }

  ordersOfDay(date: Date): Order[] {
    const day = date.toISOString().slice(0, 10);
    return this.orders().filter((o) => o.createdAt.startsWith(day));
  }

  ordersOfWeek(date: Date): Order[] {
    const d = new Date(date);
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return this.orders().filter((o) => {
      const created = new Date(o.createdAt);
      return created >= start && created <= end;
    });
  }

  ordersOfMonth(date: Date): Order[] {
    const y = date.getFullYear();
    const m = date.getMonth();
    return this.orders().filter((o) => {
      const created = new Date(o.createdAt);
      return created.getFullYear() === y && created.getMonth() === m;
    });
  }

  totalProfit(orders: Order[]): number {
    return orders.reduce((s, o) => s + o.profit, 0);
  }

  ordersWithPendingBalance(): Order[] {
    return this.orders().filter((o) => o.paymentStatus !== 'pago');
  }

  getLast7DaysStats(): { date: string; label: string; profit: number; count: number }[] {
    const result: { date: string; label: string; profit: number; count: number }[] = [];
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('pt-MZ', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const orders = this.ordersOfDay(d);
      result.push({
        date: d.toISOString().slice(0, 10),
        label: formatter.format(d),
        profit: this.totalProfit(orders),
        count: orders.length,
      });
    }
    return result;
  }

  getPaymentStatusCounts(): { pendente: number; parcial: number; pago: number } {
    const list = this.orders();
    return {
      pendente: list.filter((o) => o.paymentStatus === 'pendente').length,
      parcial: list.filter((o) => o.paymentStatus === 'parcial').length,
      pago: list.filter((o) => o.paymentStatus === 'pago').length,
    };
  }
}

/** Resposta da API de pedidos */
interface OrderApi {
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
  observations?: string;
  cakeName?: string;
  cakeSize?: string;
}

function apiToOrder(a: OrderApi): Order {
  return {
    id: a.id,
    createdAt: a.createdAt,
    clientName: a.clientName,
    category: a.category as Order['category'],
    subcategory: a.subcategory,
    productName: a.productName,
    size: a.size,
    quantityKg: a.quantityKg,
    unitsPerKg: a.unitsPerKg,
    valueCharged: a.valueCharged,
    valuePaid: a.valuePaid,
    costTotal: a.costTotal,
    profit: a.profit,
    paymentStatus: a.paymentStatus as Order['paymentStatus'],
    delivered: a.delivered,
    ingredientIds: a.ingredientIds || [],
    observations: a.observations,
    cakeName: a.cakeName,
    cakeSize: a.cakeSize,
  };
}
