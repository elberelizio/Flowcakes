import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { Order, orderDisplayName, orderDisplaySize } from '../../models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  orders = computed(() => [...this.ordersService.allOrders()].reverse());

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

  displayName = orderDisplayName;
  displaySize = orderDisplaySize;

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
