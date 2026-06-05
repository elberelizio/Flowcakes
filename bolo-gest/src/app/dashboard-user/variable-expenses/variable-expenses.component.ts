import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { NotificationService } from '../../services/notification.service';
import { Order, VariableExpense, orderDisplayName, orderDisplaySize } from '../../models/order.model';

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

  filterText = signal('');
  saving = signal(false);

  modalOrder = signal<Order | null>(null);
  modalExpenses = signal<VariableExpense[]>([]);
  newExpenseName = signal('');
  newExpenseAmount = signal(0);

  orders = computed(() => {
    const all = this.ordersService.allOrders();
    return all.filter((o) => {
      const cancelled = o.isCancelled === true || o.orderStatus === 'cancelled';
      const delivered = o.delivered === true || o.orderStatus === 'completed';
      return !cancelled && !delivered;
    });
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

  displayName = orderDisplayName;
  displaySize = orderDisplaySize;

  constructor(public ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.loadOrders();
    this.route.queryParams.subscribe((params) => {
      const orderId = params['orderId'];
      if (!orderId) return;
      setTimeout(() => {
        const order = this.ordersService.getOrderById(orderId);
        if (order && this.isActiveOrder(order)) {
          this.openModalForOrder(order);
        }
      }, 400);
    });
  }

  private isActiveOrder(order: Order): boolean {
    const cancelled = order.isCancelled === true || order.orderStatus === 'cancelled';
    const delivered = order.delivered === true || order.orderStatus === 'completed';
    return !cancelled && !delivered;
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
    this.ordersService.updateOrder(order.id, { variableExpenses: this.modalExpenses() }).then((ok) => {
      this.saving.set(false);
      if (ok) {
        this.notificationService.showSuccess('Despesas guardadas com sucesso.');
        this.closeModal();
      } else {
        this.notificationService.showError('Não foi possível guardar as despesas.');
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
}
