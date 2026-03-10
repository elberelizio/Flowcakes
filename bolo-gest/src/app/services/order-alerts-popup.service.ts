import { Injectable, signal, inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { OrdersService } from './orders.service';
import { ReminderService } from './reminder.service';
import { UserSettingsService } from './user-settings.service';
import { Order } from '../models/order.model';
import { Reminder } from '../models/reminder.model';

export interface UpcomingReminderWithDays {
  reminder: Reminder;
  daysUntil: number;
}

/**
 * Controla o popup de alerta ao iniciar sessão (encomendas + lembretes).
 * Estado apenas em memória (signal) — nada é gravado no browser (sem localStorage/sessionStorage).
 * OrdersService e ReminderService são obtidos via Injector para evitar dependência circular com AuthService.
 */
@Injectable({ providedIn: 'root' })
export class OrderAlertsPopupService {
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly userSettings = inject(UserSettingsService);

  /** Flag em memória: popup já foi mostrado nesta sessão da app. Não persiste no browser. */
  private popupAlreadyShown = signal(false);

  visible = signal(false);
  upcomingOrders = signal<Order[]>([]);
  upcomingRemindersWithDays = signal<UpcomingReminderWithDays[]>([]);

  /** Chamar ao fazer logout para o popup poder aparecer no próximo login. */
  resetForNextLogin(): void {
    this.popupAlreadyShown.set(false);
    this.visible.set(false);
  }

  /** Chamar quando os dados estiverem carregados. Mostra o popup no máximo uma vez por sessão (em memória). */
  tryShowSessionPopup(): void {
    if (this.popupAlreadyShown()) return;
    const ordersService = this.injector.get(OrdersService);
    const reminderService = this.injector.get(ReminderService);
    const reminderDays = this.userSettings.getReminderDaysBefore();
    const orders = ordersService.ordersByDeliveryDateRange(Math.max(7, reminderDays)).filter(o => !o.delivered);
    const reminders = reminderService.upcomingReminders(reminderDays);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const withDays: UpcomingReminderWithDays[] = reminders.map((r) => {
      const d = new Date(r.deliveryDate + 'T12:00:00');
      d.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { reminder: r, daysUntil };
    });
    if (orders.length === 0 && withDays.length === 0) return;
    this.popupAlreadyShown.set(true);
    this.upcomingOrders.set(orders);
    this.upcomingRemindersWithDays.set(withDays);
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
  }

  goToOrders(): void {
    this.close();
    this.router.navigate(['/encomendas']);
  }

  goToCalendar(): void {
    this.close();
    this.router.navigate(['/calendario']);
  }
}
