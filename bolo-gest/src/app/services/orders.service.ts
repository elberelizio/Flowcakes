import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { API_URL } from '../core/config/api.config';
import {
  Order,
  OrderCategory,
  OrderClosureReason,
  OrderProductionStage,
  OrderRefundType,
  PaymentStatus,
  ProductSize,
  isOrderClosed,
} from '../models/order.model';

export interface OrderCloseInput {
  closureReason: OrderClosureReason;
  closureNote?: string;
  productionStage: OrderProductionStage;
  refundType: OrderRefundType;
  valuePaidAfterClose?: number;
  refundAmount?: number;
  lossAmount?: number;
}

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
  /** Desconto inicial concedido ao cliente (registado como despesa eventual) */
  discount?: number;
  ingredients: { name: string; unitValue: number }[];
  energyCost: number;
  deliveryDate?: string; // Data de entrega (ISO date)
  clientAddress?: string; // Endereço do cliente
  pickupAddress?: string; // Endereço de recolha
  deliveryAddress?: string; // Onde deixar (quando hasDelivery)
  hasDelivery?: boolean; // Entrega ao cliente (Sim) ou recolha (Não)
  deliveryCost?: number; // Preço da viagem (quando hasDelivery)
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
  deliveryDate?: string; // Data de entrega (ISO date)
  clientAddress?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  hasDelivery?: boolean; // Se tem transporte
  deliveryCost?: number; // Custo de transporte
  orderStatus?: string; // Estado do pedido
  isCancelled?: boolean; // Se foi cancelado
  observations?: string;
  cakeName?: string;
  cakeSize?: string;
  variableExpenses?: { name: string; amount: number }[]; // Despesas variáveis
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
    // Não carregar pedidos automaticamente - só quando o utilizador estiver autenticado
    // O loadOrders() será chamado após login bem-sucedido
  }

  async loadOrders(): Promise<void> {
    // Só carregar se o utilizador estiver autenticado
    if (!this.auth.isLoggedIn()) {
      this.orders.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Carregar apenas do backend (PostgreSQL)
    try {
      const list = await this.http.get<OrderApi[]>(`${API_URL}/orders`).toPromise();
      if (list) {
        this.orders.set(list.map(apiToOrder));
        this.loading.set(false);
      } else {
        this.orders.set([]);
        this.loading.set(false);
      }
    } catch (err: any) {
      // Se for erro 401 (não autenticado), não mostrar erro - é esperado
      if (err?.status === 401) {
        console.log('Utilizador não autenticado - pedidos não carregados');
        this.orders.set([]);
        this.loading.set(false);
        return;
      }
      console.error('Erro ao carregar pedidos do backend:', err);
      this.error.set('Erro ao carregar pedidos. Verifique se o backend está rodando.');
      this.orders.set([]);
      this.loading.set(false);
    }
  }

  create(input: OrderCreateInput): Promise<Order | null> {
    this.error.set(null);
    // Custo total inicial: apenas ingredientes + energia
    // Delivery NÃO entra aqui - será incluído nas despesas variáveis depois
    const costTotal =
      input.ingredients.reduce((s, i) => s + i.unitValue, 0) + (input.energyCost || 0);
    
    // Despesas variáveis: incluir delivery e outros custos eventuais (como desconto inicial)
    const variableExpenses: { name: string; amount: number }[] = [];
    if (input.hasDelivery && input.deliveryCost && input.deliveryCost > 0) {
      variableExpenses.push({
        name: 'Delivery',
        amount: input.deliveryCost,
      });
    }
    if (input.discount && input.discount > 0) {
      variableExpenses.push({
        name: 'Desconto',
        amount: input.discount,
      });
    }
    
    // Calcular lucro total (valor cobrado - custo total inicial)
    // Despesas variáveis serão adicionadas depois na edição
    const totalProfit = input.valueCharged - costTotal;
    
    // Lucro proporcional ao valor pago:
    // - Se não pagou nada: lucro = 0
    // - Se pagou parcialmente (ex: 50%): lucro = lucro_total * (valor_pago / valor_cobrado)
    // - Se pagou tudo: lucro = lucro_total
    let profit = 0;
    if (input.valuePaid > 0) {
      if (input.valuePaid >= input.valueCharged) {
        // Pagou tudo: lucro total (sem despesas variáveis ainda)
        profit = totalProfit;
      } else {
        // Pagou parcialmente: lucro proporcional
        const paymentRatio = input.valuePaid / input.valueCharged;
        profit = totalProfit * paymentRatio;
      }
    }
    
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
      deliveryDate: input.deliveryDate,
      clientAddress: input.clientAddress?.trim() || undefined,
      pickupAddress: input.pickupAddress?.trim() || undefined,
      deliveryAddress: input.deliveryAddress?.trim() || undefined,
      hasDelivery: input.hasDelivery || false,
      deliveryCost: input.hasDelivery && input.deliveryCost ? input.deliveryCost : 0,
      orderStatus: 'ordered', // Estado inicial: pedido feito
      observations: input.observations?.trim() || undefined,
      variableExpenses: variableExpenses.length > 0 ? variableExpenses : undefined,
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
      .catch((err) => {
        const body = err?.error;
        const msg = (typeof body === 'object' && body?.message)
          ? String(body.message)
          : (typeof body === 'string' ? body : err?.message ?? 'Erro ao criar encomenda');
        this.error.set(msg);
        return null;
      });
  }

  /** Lucro com despesas extras — inclui gorjeta quando valuePaid > valueCharged. */
  private computeProfitWithExtras(
    order: Order,
    valuePaid: number,
    variableExpenses: { name: string; amount: number }[]
  ): number {
    const varExpensesTotal = variableExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const charged = order.valueCharged ?? 0;
    const costTotal = order.costTotal ?? 0;
    let newProfit = 0;
    if (valuePaid > 0) {
      if (charged <= 0) {
        newProfit = valuePaid - costTotal - varExpensesTotal;
      } else if (valuePaid >= charged) {
        newProfit = valuePaid - costTotal - varExpensesTotal;
      } else {
        const paymentRatio = valuePaid / charged;
        newProfit = (charged - costTotal) * paymentRatio - varExpensesTotal * paymentRatio;
      }
    }
    return Math.max(0, newProfit);
  }

  private buildOrderRequestBody(order: Order, overrides: Partial<OrderRequest> = {}): OrderRequest {
    const valuePaid = overrides.valuePaid ?? order.valuePaid;
    const variableExpenses = overrides.variableExpenses ?? order.variableExpenses ?? [];
    const delivered = overrides.delivered ?? order.delivered;
    const paymentStatus =
      overrides.paymentStatus ??
      (valuePaid >= order.valueCharged ? 'pago' : valuePaid > 0 ? 'parcial' : 'pendente');

    return {
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
      profit: overrides.profit ?? this.computeProfitWithExtras(order, valuePaid, variableExpenses),
      paymentStatus,
      delivered,
      ingredientIds: order.ingredientIds || [],
      observations: overrides.observations ?? order.observations,
      cakeName: order.cakeName,
      cakeSize: order.cakeSize,
      deliveryDate: overrides.deliveryDate ?? order.deliveryDate,
      clientAddress: order.clientAddress,
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      hasDelivery: order.hasDelivery || false,
      deliveryCost: order.deliveryCost || 0,
      orderStatus: overrides.orderStatus ?? order.orderStatus ?? 'ordered',
      isCancelled: overrides.isCancelled ?? order.isCancelled ?? false,
      variableExpenses,
    };
  }

  updatePayment(orderId: string, valuePaid: number): Promise<boolean> {
    const order = this.orders().find((o) => o.id === orderId);
    if (!order) return Promise.resolve(false);

    const body = this.buildOrderRequestBody(order, { valuePaid });
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
    const body = this.buildOrderRequestBody(order, { delivered: true });
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

  closeOrder(orderId: string, input: OrderCloseInput): Promise<boolean> {
    return this.http
      .post<OrderApi>(`${API_URL}/orders/${orderId}/close`, input)
      .toPromise()
      .then((updated) => {
        if (updated) {
          const updatedOrder = apiToOrder(updated);
          this.orders.update((list) =>
            list.map((o) => (o.id === orderId ? updatedOrder : o))
          );
          return true;
        }
        return false;
      })
      .catch((err) => {
        const body = err?.error;
        const msg =
          typeof body === 'object' && body?.message
            ? String(body.message)
            : err?.message ?? 'Erro ao encerrar encomenda';
        this.error.set(msg);
        return false;
      });
  }

  updateOrder(orderId: string, updates: {
    deliveryDate?: string;
    observations?: string;
    orderStatus?: string;
    isCancelled?: boolean;
    variableExpenses?: { name: string; amount: number }[];
    valuePaid?: number;
  }): Promise<{ ok: boolean; error?: string }> {
    const order = this.orders().find((o) => o.id === orderId);
    if (!order) return Promise.resolve({ ok: false, error: 'Encomenda não encontrada.' });
    
    // Se está restaurando (isCancelled: false), garantir que orderStatus não seja 'cancelled'
    const newOrderStatus = updates.isCancelled === false 
      ? (updates.orderStatus || 'ordered')
      : (updates.orderStatus !== undefined ? updates.orderStatus : (order.orderStatus || 'ordered'));
    
    const body = this.buildOrderRequestBody(order, {
      valuePaid: updates.valuePaid,
      observations: updates.observations,
      deliveryDate: updates.deliveryDate,
      orderStatus: newOrderStatus,
      isCancelled: updates.isCancelled,
      variableExpenses: updates.variableExpenses,
      delivered: order.delivered,
    });

    if (updates.valuePaid !== undefined) {
      body.paymentStatus =
        body.valuePaid >= order.valueCharged ? 'pago' : body.valuePaid > 0 ? 'parcial' : 'pendente';
    }

    return this.http
      .put<OrderApi>(`${API_URL}/orders/${orderId}`, body)
      .toPromise()
      .then((updated) => {
        if (updated) {
          const updatedOrder = apiToOrder(updated);
          this.orders.update((list) =>
            list.map((o) => (o.id === orderId ? updatedOrder : o))
          );
          // Recarregar lista completa do backend para garantir sincronização
          this.loadOrders();
          return { ok: true };
        }
        return { ok: false, error: 'Resposta inválida do servidor.' };
      })
      .catch((error) => {
        console.error('Erro ao atualizar encomenda:', error);
        const body = error?.error;
        const msg =
          typeof body === 'object' && body?.message
            ? String(body.message)
            : error?.message ?? 'Erro ao atualizar encomenda.';
        return { ok: false, error: msg };
      });
  }

  getOrderById(id: string): Order | undefined {
    return this.orders().find((o) => o.id === id);
  }

  ordersOfDay(date: Date): Order[] {
    const day = date.toISOString().slice(0, 10);
    return this.orders().filter((o) => {
      // Usar date (backend) ou createdAt (fallback)
      const orderDate = o.date || o.createdAt.split('T')[0];
      return orderDate === day;
    });
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

  /** Encomendas por data de entrega (usa deliveryDate, sem duplicar dados) */
  ordersByDeliveryDate(date: Date): Order[] {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const day = `${y}-${m}-${d}`;
    return this.orders().filter((o) => {
      if (o.isCancelled) return false;
      const orderDay = o.deliveryDate?.split('T')[0];
      return orderDay === day;
    });
  }

  /** Encomendas com entrega nos próximos N dias (a partir de hoje) */
  ordersByDeliveryDateRange(daysAhead: number): Order[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(today.getDate() + daysAhead);
    end.setHours(23, 59, 59, 999);

    return this.orders()
      .filter((o) => {
        if (o.isCancelled) return false;
        if (!o.deliveryDate) return false;
        const d = new Date(o.deliveryDate);
        return d >= today && d <= end;
      })
      .sort((a, b) => {
        const tA = new Date(a.deliveryDate!).getTime();
        const tB = new Date(b.deliveryDate!).getTime();
        return tA - tB;
      });
  }

  /**
   * Encomendas por entregar: em atraso (data passada) + próximas na janela de dias.
   * Ordenação: atrasadas primeiro (mais antigas), depois próximas (mais urgentes).
   */
  getPendingDeliveries(daysAhead: number): Order[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(today.getDate() + daysAhead);
    end.setHours(23, 59, 59, 999);

    const pending = this.orders().filter((o) => {
      if (isOrderClosed(o)) return false;
      if (o.delivered) return false;
      if (!o.deliveryDate) return false;
      const d = new Date(o.deliveryDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() <= end.getTime();
    });

    const sortByDelivery = (a: Order, b: Order) =>
      new Date(a.deliveryDate!).getTime() - new Date(b.deliveryDate!).getTime();

    const overdue = pending.filter((o) => {
      const d = new Date(o.deliveryDate!);
      d.setHours(0, 0, 0, 0);
      return d.getTime() < today.getTime();
    });

    const upcoming = pending.filter((o) => {
      const d = new Date(o.deliveryDate!);
      return d >= today && d <= end;
    });

    return [...overdue.sort(sortByDelivery), ...upcoming.sort(sortByDelivery)];
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
  orderNo?: number;
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
  deliveryDate?: string; // Data de entrega (ISO date)
  clientAddress?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  hasDelivery?: boolean; // Se tem transporte
  deliveryCost?: number; // Custo de transporte
  orderStatus?: string; // Estado do pedido: ordered, in_progress, completed, cancelled
  isCancelled?: boolean;
  closedAt?: string;
  closureReason?: string;
  closureNote?: string;
  productionStage?: string;
  refundType?: string;
  refundAmount?: number;
  lossAmount?: number;
  variableExpenses?: { name: string; amount: number }[];
}

function apiToOrder(a: OrderApi): Order {
  return {
    id: a.id,
    createdAt: a.createdAt,
    orderNo: a.orderNo,
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
    deliveryDate: a.deliveryDate, // Data de entrega (ISO date)
    clientAddress: a.clientAddress,
    pickupAddress: a.pickupAddress,
    deliveryAddress: a.deliveryAddress,
    hasDelivery: a.hasDelivery || false, // Se tem transporte
    deliveryCost: a.deliveryCost || 0, // Custo de transporte
    orderStatus: (a.orderStatus as Order['orderStatus']) || 'ordered', // Estado do pedido
    // Mapear isCancelled explicitamente: se não vier da API, verificar orderStatus
    isCancelled: a.isCancelled !== undefined ? a.isCancelled : (a.orderStatus === 'cancelled'),
    closedAt: a.closedAt,
    closureReason: a.closureReason as Order['closureReason'],
    closureNote: a.closureNote,
    productionStage: a.productionStage as Order['productionStage'],
    refundType: a.refundType as Order['refundType'],
    refundAmount: a.refundAmount,
    lossAmount: a.lossAmount,
    variableExpenses: a.variableExpenses || [],
  };
}

