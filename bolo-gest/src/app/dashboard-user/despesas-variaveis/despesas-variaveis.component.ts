import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { NotificationService } from '../../services/notification.service';
import { Order, VariableExpense, orderDisplayName, orderDisplaySize } from '../../models/order.model';

@Component({
  selector: 'app-despesas-variaveis',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './despesas-variaveis.component.html',
  styleUrl: './despesas-variaveis.component.scss',
})
export class DespesasVariaveisComponent implements OnInit {

  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);

  expenseForm: FormGroup;
  filterText = signal('');
  saving = signal(false);

  /** Modal: encomenda em edição */
  modalOrder = signal<Order | null>(null);
  /** Despesas em edição no modal (cópia para editar) */
  modalExpenses = signal<VariableExpense[]>([]);
  newExpenseName = signal('');
  newExpenseAmount = signal(0);

  orders = computed(() => {
    const all = this.ordersService.allOrders();
    return all.filter(o => {
      const cancelled = o.isCancelled === true || o.orderStatus === 'cancelled';
      const delivered = o.delivered === true || o.orderStatus === 'completed';
      return !cancelled && !delivered;
    });
  });

  filteredOrders = computed(() => {
    const list = this.orders();
    const q = (this.filterText() ?? '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(o => {
      const name = (o.clientName ?? '').toLowerCase();
      const product = (o.productName ?? o.cakeName ?? '').toLowerCase();
      return name.includes(q) || product.includes(q);
    });
  });

  displayName = orderDisplayName;
  displaySize = orderDisplaySize;

  constructor(
    private fb: FormBuilder,
    public ordersService: OrdersService
  ) {
    this.expenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      amount: [0, [Validators.required, Validators.min(0)]],
      orderId: [null as string | null],
    });
  }

  ngOnInit(): void {
    this.ordersService.loadOrders();
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      if (orderId) {
        this.expenseForm.patchValue({ orderId });
        setTimeout(() => {
          const order = this.ordersService.getOrderById(orderId);
          if (order) this.openModalForOrder(order);
        }, 400);
      }
    });
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

  onOrderSelectChange(): void {
    const orderId = this.expenseForm.get('orderId')?.value;
    const order = orderId ? this.orders().find(o => o.id === orderId) ?? null : null;
    if (order) this.expenseForm.patchValue({ orderId: order.id });
  }

  submitExpense(): void {
    if (this.expenseForm.invalid) return;
    const orderId = this.expenseForm.get('orderId')?.value;
    const name = (this.expenseForm.get('name')?.value ?? '').trim();
    const amount = Number(this.expenseForm.get('amount')?.value) || 0;
    if (!orderId || !name) return;

    const order = this.ordersService.getOrderById(orderId);
    if (!order) return;

    const current = order.variableExpenses || [];
    const updated: VariableExpense[] = [...current, { name, amount }];

    this.saving.set(true);
    this.ordersService.updateOrder(orderId, { variableExpenses: updated }).then((ok) => {
      this.saving.set(false);
      if (ok) {
        this.notificationService.showSuccess('Despesa registada com sucesso.');
        this.expenseForm.patchValue({ name: '', amount: 0 });
      } else {
        this.notificationService.showError('Não foi possível registar a despesa.');
      }
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
    this.modalExpenses.update(list => [...list, { name, amount }]);
    this.newExpenseName.set('');
    this.newExpenseAmount.set(0);
  }

  removeExpenseInModal(index: number): void {
    this.modalExpenses.update(list => list.filter((_, i) => i !== index));
  }

  getModalExpensesTotal(): number {
    return this.modalExpenses().reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  saveModalExpenses(): void {
    const order = this.modalOrder();
    if (!order) return;
    const varExpenses = this.modalExpenses();

    this.saving.set(true);
    this.ordersService.updateOrder(order.id, { variableExpenses: varExpenses }).then((ok) => {
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

  getVariableExpensesDisplay(order: Order): string {
    const total = this.getTotalVariableExpenses(order);
    if (total === 0) return '—';
    const fmt = new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(total);
    const names = order.variableExpenses?.map(e => e.name).filter(n => n).join(', ');
    return `${fmt} MZN${names ? ` (${names})` : ''}`;
  }

  hasVariableExpenses(order: Order): boolean {
    return (order.variableExpenses?.length ?? 0) > 0;
  }
}
