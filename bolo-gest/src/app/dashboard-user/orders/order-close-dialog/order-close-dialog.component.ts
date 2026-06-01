import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Order,
  OrderClosureReason,
  OrderProductionStage,
  OrderRefundType,
} from '../../../models/order.model';
import { OrderCloseInput, OrdersService } from '../../../services/orders.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-order-close-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-close-dialog.component.html',
  styleUrl: './order-close-dialog.component.scss',
})
export class OrderCloseDialogComponent {
  order = input.required<Order>();
  closed = output<void>();
  dismissed = output<void>();

  readonly reasonOptions: { value: OrderClosureReason; label: string }[] = [
    { value: 'CLIENT_WITHDREW', label: 'Cliente desistiu' },
    { value: 'CANNOT_PRODUCE', label: 'Não produzi' },
    { value: 'REFUSED_AT_DELIVERY', label: 'Recusa na entrega' },
    { value: 'REGISTRATION_ERROR', label: 'Erro de registo' },
    { value: 'OTHER', label: 'Outro' },
  ];

  readonly productionOptions: { value: OrderProductionStage; label: string }[] = [
    { value: 'NOT_STARTED', label: 'Não produzi' },
    { value: 'PRODUCED', label: 'Já produzi' },
    { value: 'DELIVERED', label: 'Já entregue' },
  ];

  submitting = signal(false);
  closureReason = signal<OrderClosureReason | ''>('');
  closureNote = signal('');
  productionStage = signal<OrderProductionStage | ''>('');
  refundType = signal<OrderRefundType | ''>('');
  refundAmountInput = signal<number | null>(null);

  readonly clientPaid = computed(() => Math.max(0, this.order().valuePaid ?? 0));

  readonly showRefundChoice = computed(() => this.clientPaid() > 0);

  readonly previewRefund = computed(() => {
    const paid = this.clientPaid();
    const rt = this.refundType();
    if (!this.showRefundChoice() || rt === 'NONE' || !rt) return 0;
    if (rt === 'FULL') return paid;
    const raw = this.refundAmountInput();
    if (raw == null || !Number.isFinite(raw)) return 0;
    return Math.min(paid, Math.max(0, raw));
  });

  readonly previewValuePaid = computed(() => {
    return Math.max(0, this.clientPaid() - this.previewRefund());
  });

  readonly varExpensesTotal = computed(() =>
    (this.order().variableExpenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0)
  );

  readonly suggestedLoss = computed(() => {
    const o = this.order();
    const stage = this.productionStage();
    if (stage === 'NOT_STARTED' && o.costTotal <= 0) return 0;
    return Math.max(0, Math.round(o.costTotal + this.varExpensesTotal() - this.previewValuePaid()));
  });

  readonly canConfirm = computed(() => {
    if (!this.closureReason() || !this.productionStage()) return false;
    if (!this.showRefundChoice()) return true;
    const rt = this.refundType();
    if (!rt) return false;
    if (rt === 'PARTIAL') {
      const r = this.refundAmountInput();
      return r != null && Number.isFinite(r) && r > 0 && r <= this.clientPaid();
    }
    return true;
  });

  constructor(
    private orders: OrdersService,
    private notification: NotificationService
  ) {}

  onDismiss(): void {
    this.dismissed.emit();
  }

  selectReason(value: OrderClosureReason): void {
    this.closureReason.set(value);
  }

  selectProduction(value: OrderProductionStage): void {
    this.productionStage.set(value);
  }

  selectRefund(value: OrderRefundType): void {
    this.refundType.set(value);
    if (value === 'PARTIAL' && this.refundAmountInput() == null) {
      this.refundAmountInput.set(Math.round(this.clientPaid() / 2));
    }
  }

  async confirm(): Promise<void> {
    const reason = this.closureReason();
    const stage = this.productionStage();
    if (!reason || !stage) return;

    const rt: OrderRefundType = this.showRefundChoice()
      ? (this.refundType() as OrderRefundType)
      : 'NONE';
    if (this.showRefundChoice() && !rt) return;

    if (rt === 'PARTIAL') {
      const r = this.refundAmountInput();
      if (r == null || r <= 0 || r > this.clientPaid()) {
        this.notification.showError(
          `Indique quanto devolveu ao cliente (entre 1 e ${this.clientPaid()} MZN).`
        );
        return;
      }
    }

    const payload: OrderCloseInput = {
      closureReason: reason,
      closureNote: this.closureNote().trim() || undefined,
      productionStage: stage,
      refundType: rt,
      lossAmount: this.suggestedLoss(),
    };

    if (rt === 'PARTIAL') {
      payload.valuePaidAfterClose = this.previewValuePaid();
      payload.refundAmount = this.previewRefund();
    } else if (this.previewRefund() > 0) {
      payload.refundAmount = this.previewRefund();
    }

    this.submitting.set(true);
    const ok = await this.orders.closeOrder(this.order().id, payload);
    this.submitting.set(false);

    if (ok) {
      this.notification.showSuccess('Encomenda cancelada com sucesso.');
      this.closed.emit();
    } else {
      this.notification.showError(this.orders.apiError() ?? 'Não foi possível cancelar a encomenda.');
    }
  }
}
