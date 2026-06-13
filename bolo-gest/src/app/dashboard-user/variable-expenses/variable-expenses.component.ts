import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { OrdersService } from '../../services/orders.service';
import { NotificationService } from '../../services/notification.service';
import { Order, VariableExpense, orderDisplayName, orderDisplaySize } from '../../models/order.model';

export type VariableExpensesTab = 'register' | 'overview';

export interface TopExpenseEntry {
  name: string;
  amount: number;
  orderId: string;
  orderLabel: string;
  clientName: string;
  productLabel: string;
}

export interface RecurringExpenseSummary {
  name: string;
  orderCount: number;
  totalAmount: number;
  avgPerOrder: number;
}

@Component({
  selector: 'app-variable-expenses',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './variable-expenses.component.html',
  styleUrl: './variable-expenses.component.scss',
})
export class VariableExpensesComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  activeTab = signal<VariableExpensesTab>('register');
  filterText = signal('');
  overviewFilterText = signal('');
  saving = signal(false);

  modalOrder = signal<Order | null>(null);
  modalExpenses = signal<VariableExpense[]>([]);
  newExpenseName = signal('');
  newExpenseAmount = signal(0);

  viewOnlyOrder = signal<Order | null>(null);
  showFilters = signal(false);
  showOverviewFilters = signal(false);

  orders = computed(() => {
    const all = this.ordersService.allOrders();
    return all.filter((o) => this.isActiveOrder(o));
  });

  filteredOrders = computed(() => {
    const list = this.orders();
    const q = (this.filterText() ?? '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) => {
      const name = (o.clientName ?? '').toLowerCase();
      const product = (o.productName ?? o.cakeName ?? '').toLowerCase();
      return name.includes(q) || product.includes(q);
    });
  });

  activeOrderCount = computed(() => this.filteredOrders().length);

  ordersWithExpensesCount = computed(() => this.filteredOrders().filter((o) => this.hasVariableExpenses(o)).length);

  totalExtrasMzn = computed(() =>
    this.filteredOrders().reduce((sum, o) => sum + this.getTotalVariableExpenses(o), 0),
  );

  /** Todas as encomendas (excepto canceladas) com despesas registadas — só leitura */
  ordersWithRecordedExpenses = computed(() =>
    this.ordersService
      .allOrders()
      .filter((o) => !this.isCancelledOrder(o) && this.hasVariableExpenses(o))
      .sort((a, b) => this.getTotalVariableExpenses(b) - this.getTotalVariableExpenses(a)),
  );

  filteredOverviewOrders = computed(() => {
    const list = this.ordersWithRecordedExpenses();
    const q = (this.overviewFilterText() ?? '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) => {
      const client = (o.clientName ?? '').toLowerCase();
      const product = (o.productName ?? o.cakeName ?? '').toLowerCase();
      const expenses = (o.variableExpenses ?? []).some((e) => (e.name ?? '').toLowerCase().includes(q));
      return client.includes(q) || product.includes(q) || expenses;
    });
  });

  overviewTotalMzn = computed(() =>
    this.ordersWithRecordedExpenses().reduce((sum, o) => sum + this.getTotalVariableExpenses(o), 0),
  );

  /** Maiores despesas individuais (por valor) em qualquer encomenda */
  topExpenseEntries = computed((): TopExpenseEntry[] => {
    const rows: TopExpenseEntry[] = [];
    for (const order of this.ordersWithRecordedExpenses()) {
      for (const expense of order.variableExpenses ?? []) {
        const amount = expense.amount || 0;
        if (amount <= 0) continue;
        rows.push({
          name: expense.name?.trim() || 'Sem nome',
          amount,
          orderId: order.id,
          orderLabel: this.getOrderNumber(order),
          clientName: order.clientName,
          productLabel: orderDisplayName(order),
        });
      }
    }
    return rows.sort((a, b) => b.amount - a.amount).slice(0, 5);
  });

  /** Tipos de despesa que aparecem em 2+ encomendas */
  recurringExpenses = computed((): RecurringExpenseSummary[] => {
    const byKey = new Map<
      string,
      { displayName: string; orderIds: Set<string>; totalAmount: number }
    >();

    for (const order of this.ordersWithRecordedExpenses()) {
      const seenInOrder = new Set<string>();
      for (const expense of order.variableExpenses ?? []) {
        const displayName = expense.name?.trim() || 'Sem nome';
        const key = this.normalizeExpenseName(displayName);
        if (!key) continue;

        let row = byKey.get(key);
        if (!row) {
          row = { displayName, orderIds: new Set<string>(), totalAmount: 0 };
          byKey.set(key, row);
        }
        row.totalAmount += expense.amount || 0;
        if (!seenInOrder.has(key)) {
          seenInOrder.add(key);
          row.orderIds.add(order.id);
        }
      }
    }

    return [...byKey.values()]
      .filter((row) => row.orderIds.size >= 2)
      .map((row) => ({
        name: row.displayName,
        orderCount: row.orderIds.size,
        totalAmount: row.totalAmount,
        avgPerOrder: row.totalAmount / row.orderIds.size,
      }))
      .sort((a, b) => b.orderCount - a.orderCount || b.totalAmount - a.totalAmount)
      .slice(0, 6);
  });

  displayName = orderDisplayName;
  displaySize = orderDisplaySize;

  constructor(public ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.loadOrders();
    this.syncTabFromRoute();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.syncTabFromRoute());

    this.route.queryParams.subscribe((params) => {
      const orderId = params['orderId'];
      if (!orderId) return;
      setTimeout(() => {
        const order = this.ordersService.getOrderById(orderId);
        if (order && this.isActiveOrder(order)) {
          this.setTab('register');
          this.openModalForOrder(order);
        }
      }, 400);
    });
  }

  private syncTabFromRoute(): void {
    const url = this.router.url.split('?')[0];
    this.activeTab.set(url.includes('/variable-expenses/consultar') ? 'overview' : 'register');
  }

  setTab(tab: VariableExpensesTab): void {
    this.activeTab.set(tab);
    const target = tab === 'overview' ? '/variable-expenses/consultar' : '/variable-expenses';
    const current = this.router.url.split('?')[0];
    if (current !== target) {
      void this.router.navigate([target]);
    }
    if (tab === 'register') {
      this.closeViewModal();
    } else {
      this.closeModal();
    }
  }

  private isCancelledOrder(order: Order): boolean {
    return order.isCancelled === true || order.orderStatus === 'cancelled';
  }

  private isActiveOrder(order: Order): boolean {
    const delivered = order.delivered === true || order.orderStatus === 'completed';
    return !this.isCancelledOrder(order) && !delivered;
  }

  getOrderStatusLabel(order: Order): string {
    if (this.isCancelledOrder(order)) return 'Cancelada';
    if (order.delivered || order.orderStatus === 'completed') return 'Entregue';
    return 'Em curso';
  }

  getOrderStatusClass(order: Order): string {
    if (this.isCancelledOrder(order)) return 'vex-badge--cancelled';
    if (order.delivered || order.orderStatus === 'completed') return 'vex-badge--delivered';
    return 'vex-badge--active';
  }

  private normalizeExpenseName(name: string): string {
    return name.trim().toLowerCase();
  }

  openViewModal(order: Order): void {
    this.viewOnlyOrder.set(order);
  }

  closeViewModal(): void {
    this.viewOnlyOrder.set(null);
  }

  getOrderNumber(order: Order): string {
    if (order.orderNo != null) return String(order.orderNo).padStart(3, '0');
    return order.id.substring(0, 8).toUpperCase();
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  openModalForOrder(order: Order): void {
    this.modalOrder.set(order);
    this.modalExpenses.set(order.variableExpenses?.length ? [...order.variableExpenses] : []);
    this.newExpenseName.set('');
    this.newExpenseAmount.set(0);
  }

  closeModal(): void {
    this.modalOrder.set(null);
    this.modalExpenses.set([]);
  }

  addExpenseInModal(): void {
    const name = this.newExpenseName().trim();
    if (!name) return;
    const amount = this.newExpenseAmount() || 0;
    this.modalExpenses.update((list) => [...list, { name, amount }]);
    this.newExpenseName.set('');
    this.newExpenseAmount.set(0);
  }

  removeExpenseInModal(index: number): void {
    this.modalExpenses.update((list) => list.filter((_, i) => i !== index));
  }

  getModalExpensesTotal(): number {
    return this.modalExpenses().reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  saveModalExpenses(): void {
    const order = this.modalOrder();
    if (!order) return;

    this.saving.set(true);
    this.ordersService.updateOrder(order.id, { variableExpenses: this.modalExpenses() }).then((result) => {
      this.saving.set(false);
      if (result.ok) {
        this.notificationService.showSuccess('Despesas guardadas com sucesso.');
        this.closeModal();
      } else {
        this.notificationService.showError(result.error ?? 'Não foi possível guardar as despesas.');
      }
    });
  }

  getTotalVariableExpenses(order: Order): number {
    if (!order.variableExpenses?.length) return 0;
    return order.variableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  getExpenseNamesPreview(order: Order): string {
    const names = order.variableExpenses?.map((e) => e.name).filter(Boolean) ?? [];
    if (!names.length) return '';
    const text = names.join(', ');
    return text.length > 48 ? `${text.slice(0, 45)}…` : text;
  }

  hasVariableExpenses(order: Order): boolean {
    return (order.variableExpenses?.length ?? 0) > 0;
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  toggleOverviewFilters(): void {
    this.showOverviewFilters.update((v) => !v);
  }
}
