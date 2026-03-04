import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../services/orders.service';
import { Order, orderDisplayName, orderDisplaySize } from '../../models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  // Pedidos ativos (não cancelados), ordenados por data de entrega (mais próximo primeiro)
  orders = computed(() => {
    const all = this.ordersService.allOrders();
    // Filtrar explicitamente: apenas pedidos onde isCancelled NÃO é true
    // Também verificar orderStatus como fallback
    const active = all.filter(o => {
      const cancelled = o.isCancelled === true || o.orderStatus === 'cancelled';
      return !cancelled;
    });
    // Ordenar por data de entrega: mais próximo primeiro
    return active.sort((a, b) => {
      const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB; // Mais próximo primeiro
    });
  });

  // Pedidos cancelados
  cancelledOrders = computed(() => {
    const all = this.ordersService.allOrders();
    // Filtrar explicitamente: pedidos onde isCancelled é true OU orderStatus é 'cancelled'
    return all.filter(o => o.isCancelled === true || o.orderStatus === 'cancelled');
  });

  editingOrder = signal<Order | null>(null);
  editingDeliveryDate = signal<string>('');
  editingOrderStatus = signal<string>('');
  editingVariableExpenses = signal<{ name: string; amount: number }[]>([]);
  editingMarkAsCompleted = signal<boolean>(false);
  editingUpdatePayment = signal<boolean>(false);
  orderToCancel = signal<Order | null>(null);
  showCancelledOrders = signal<boolean>(false);
  orderToRestore = signal<Order | null>(null);
  restoringDeliveryDate = signal<string>('');

  constructor(public ordersService: OrdersService) {}

  saldo(order: Order): number {
    return Math.max(0, order.valueCharged - order.valuePaid);
  }

  updatePayment(order: Order, valuePaidStr: string): void {
    const valuePaid = Number(valuePaidStr);
    if (!Number.isFinite(valuePaid) || valuePaid < 0) return;
    this.ordersService.updatePayment(order.id, Math.min(valuePaid, order.valueCharged));
  }

  markDelivered(order: Order): void {
    this.ordersService.markDelivered(order.id);
  }

  cancelOrder(order: Order): void {
    this.orderToCancel.set(order);
  }

  confirmCancelOrder(): void {
    const order = this.orderToCancel();
    if (order) {
      this.ordersService.cancelOrder(order.id);
      this.closeCancelModal();
    }
  }

  closeCancelModal(): void {
    this.orderToCancel.set(null);
  }

  toggleCancelledOrders(): void {
    this.showCancelledOrders.update(v => !v);
  }

  startRestoreOrder(order: Order): void {
    this.orderToRestore.set(order);
    // Data padrão: hoje + 1 dia
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.restoringDeliveryDate.set(tomorrow.toISOString().split('T')[0]);
  }

  closeRestoreModal(): void {
    this.orderToRestore.set(null);
    this.restoringDeliveryDate.set('');
  }

  confirmRestoreOrder(): void {
    const order = this.orderToRestore();
    if (!order) return;

    const newDeliveryDate = this.restoringDeliveryDate();
    if (!newDeliveryDate) {
      alert('Por favor, selecione uma data de entrega.');
      return;
    }

    // Restaurar pedido: remover cancelamento e atualizar data de entrega
    this.ordersService.updateOrder(order.id, {
      orderStatus: 'ordered', // Voltar para estado inicial
      deliveryDate: newDeliveryDate,
      isCancelled: false, // Remover cancelamento
    });

    this.closeRestoreModal();
  }

  startEditOrder(order: Order): void {
    this.editingOrder.set(order);
    this.editingDeliveryDate.set(order.deliveryDate || '');
    this.editingOrderStatus.set(order.orderStatus || 'ordered');
    // Inicializar despesas variáveis: incluir delivery se houver, mais outras despesas
    const varExpenses: { name: string; amount: number }[] = [];
    if (order.hasDelivery && order.deliveryCost && order.deliveryCost > 0) {
      varExpenses.push({ name: 'Delivery', amount: order.deliveryCost });
    }
    if (order.variableExpenses && order.variableExpenses.length > 0) {
      // Adicionar outras despesas variáveis (excluindo delivery se já foi adicionado)
      order.variableExpenses.forEach(exp => {
        if (exp.name !== 'Delivery' || !order.hasDelivery) {
          varExpenses.push(exp);
        }
      });
    }
    this.editingVariableExpenses.set(varExpenses);
    this.editingMarkAsCompleted.set(false);
    this.editingUpdatePayment.set(false);
  }

  cancelEdit(): void {
    this.editingOrder.set(null);
    this.editingDeliveryDate.set('');
    this.editingOrderStatus.set('');
    this.editingVariableExpenses.set([]);
    this.editingMarkAsCompleted.set(false);
    this.editingUpdatePayment.set(false);
  }

  get remainingBalance(): number {
    const order = this.editingOrder();
    if (!order) return 0;
    return Math.max(0, order.valueCharged - order.valuePaid);
  }

  get totalVariableExpenses(): number {
    return this.editingVariableExpenses().reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }

  get newTotalPayment(): number {
    const order = this.editingOrder();
    if (!order || !this.editingUpdatePayment()) return order?.valuePaid || 0;
    // Se atualizar pagamento: valor pago atual + saldo restante + custos variáveis
    return order.valuePaid + this.remainingBalance + this.totalVariableExpenses;
  }

  addVariableExpense(): void {
    const current = this.editingVariableExpenses();
    this.editingVariableExpenses.set([...current, { name: '', amount: 0 }]);
  }

  removeVariableExpense(index: number): void {
    const current = this.editingVariableExpenses();
    this.editingVariableExpenses.set(current.filter((_, i) => i !== index));
  }

  updateVariableExpenseName(index: number, name: string): void {
    const current = this.editingVariableExpenses();
    const updated = [...current];
    updated[index] = { ...updated[index], name };
    this.editingVariableExpenses.set(updated);
  }

  updateVariableExpenseAmount(index: number, amount: number | string): void {
    const current = this.editingVariableExpenses();
    const updated = [...current];
    updated[index] = { ...updated[index], amount: Number(amount) || 0 };
    this.editingVariableExpenses.set(updated);
  }

  saveEdit(): void {
    const order = this.editingOrder();
    if (!order) return;
    
    const newDeliveryDate = this.editingDeliveryDate();
    const newOrderStatus = this.editingOrderStatus();
    const varExpenses = this.editingVariableExpenses();
    const updatePayment = this.editingUpdatePayment();
    const markAsCompleted = this.editingMarkAsCompleted();
    
    const updates: { 
      deliveryDate?: string; 
      orderStatus?: string;
      variableExpenses?: { name: string; amount: number }[];
      valuePaid?: number;
    } = {};
    
    if (newDeliveryDate && newDeliveryDate !== order.deliveryDate) {
      updates.deliveryDate = newDeliveryDate;
    }
    
    // Se atualizar pagamento: incluir saldo restante + custos variáveis
    if (updatePayment) {
      const newValuePaid = this.newTotalPayment;
      updates.valuePaid = Math.min(newValuePaid, order.valueCharged);
    }
    
    // Se marcar como concluída, atualizar status
    if (markAsCompleted) {
      updates.orderStatus = 'completed';
    } else if (newOrderStatus && newOrderStatus !== order.orderStatus) {
      updates.orderStatus = newOrderStatus;
    }
    
    // Atualizar despesas variáveis (sempre enviar, mesmo que vazio)
    // Comparar com as despesas atuais para detectar mudanças
    const currentVarExpenses = order.variableExpenses || [];
    const varExpensesChanged = JSON.stringify(varExpenses) !== JSON.stringify(currentVarExpenses);
    
    if (varExpensesChanged) {
      updates.variableExpenses = varExpenses;
    }
    
    if (Object.keys(updates).length > 0) {
      console.log('Enviando atualização:', updates);
      this.ordersService.updateOrder(order.id, updates).then((success) => {
        if (success) {
          console.log('Encomenda atualizada com sucesso');
        } else {
          console.error('Erro ao atualizar encomenda');
        }
      });
    }
    
    this.cancelEdit();
  }

  getOrderStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'ordered': return 'Encomenda feita';
      case 'in_progress': return 'Em processo';
      case 'completed': return 'Finalizada';
      case 'cancelled': return 'Cancelada';
      default: return 'Encomenda feita';
    }
  }

  getOrderStatusOptions(): { value: string; label: string }[] {
    return [
      { value: 'ordered', label: 'Encomenda feita' },
      { value: 'in_progress', label: 'Em processo' },
      { value: 'completed', label: 'Finalizada' },
    ];
  }

  displayName = orderDisplayName;
  displaySize = orderDisplaySize;

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getTotalVariableExpenses(order: Order): number {
    if (!order.variableExpenses || order.variableExpenses.length === 0) return 0;
    return order.variableExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }

  getVariableExpensesDisplay(order: Order): string {
    const total = this.getTotalVariableExpenses(order);
    if (total === 0) return '—';
    const formattedTotal = new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(total);
    if (order.variableExpenses && order.variableExpenses.length > 0) {
      const names = order.variableExpenses.map(e => e.name).filter(n => n).join(', ');
      return `${formattedTotal} MZN${names ? ` (${names})` : ''}`;
    }
    return `${formattedTotal} MZN`;
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
