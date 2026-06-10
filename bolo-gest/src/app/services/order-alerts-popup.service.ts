import { Injectable, signal, inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { OrdersService } from './orders.service';
import { ReminderService } from './reminder.service';
import { Order } from '../models/order.model';
import { Reminder } from '../models/reminder.model';

export interface UpcomingReminderWithDays {
  reminder: Reminder;
  daysUntil: number;
}

/** Evita o mesmo resumo em cada refresh do browser até nova sessão de login (logout limpa). */
const SESSION_STORAGE_KEY = 'chefcontrol_order_alerts_popup_consumed';

/**
 * Controla o popup de alerta ao iniciar sessão (encomendas + lembretes).
 * Usa sessionStorage para não voltar a mostrar ao recarregar a página no mesmo login.
 */
@Injectable({ providedIn: 'root' })
export class OrderAlertsPopupService {
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  /** Evita múltiplas aberturas na mesma instância da app (sem refresh). */
  private popupAlreadyShown = signal(false);

  visible = signal(false);
  upcomingOrders = signal<Order[]>([]);
  upcomingRemindersWithDays = signal<UpcomingReminderWithDays[]>([]);

  private isConsumedInBrowserSession(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === '1';
  }

  private markConsumedInBrowserSession(): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, '1');
    } catch {
      /* quota / modo privado */
    }
  }

  /** Chamar ao fazer logout para o popup poder aparecer no próximo login. */
  resetForNextLogin(): void {
    this.popupAlreadyShown.set(false);
    this.visible.set(false);
    this.upcomingOrders.set([]);
    this.upcomingRemindersWithDays.set([]);
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * Mostra o popup no máximo uma vez por login no browser (sessionStorage + memória).
   * Ao fechar o popup também fica marcado como consumido para não reaparecer após refresh.
   */
  tryShowSessionPopup(): void {
    if (this.isConsumedInBrowserSession()) return;
    if (this.popupAlreadyShown()) return;

    const ordersService = this.injector.get(OrdersService);
    const reminderService = this.injector.get(ReminderService);
    const orders = ordersService.ordersByDeliveryDateRange(14).filter((o) => !o.delivered);
    const reminders = reminderService.remindersInNotifyWindow();
    const withDays: UpcomingReminderWithDays[] = reminders.map((r) => ({
      reminder: r,
      daysUntil: reminderService.daysUntilDelivery(r.deliveryDate),
    }));
    if (orders.length === 0 && withDays.length === 0) return;

    this.markConsumedInBrowserSession();
    this.popupAlreadyShown.set(true);
    this.upcomingOrders.set(orders);
    this.upcomingRemindersWithDays.set(withDays);
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
    this.markConsumedInBrowserSession();
    this.popupAlreadyShown.set(true);
  }

  goToOrders(): void {
    this.close();
    this.router.navigate(['/orders']);
  }

  goToReminders(): void {
    this.close();
    this.router.navigate(['/reminders']);
  }
}
