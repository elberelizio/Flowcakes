import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reminder } from '../models/reminder.model';
import { API_URL } from '../core/config/api.config';
import { AuthService } from './auth.service';

function normalizeReminder(r: Reminder): Reminder {
  return {
    ...r,
    notifyDaysBefore:
      typeof r.notifyDaysBefore === 'number' && Number.isFinite(r.notifyDaysBefore)
        ? r.notifyDaysBefore
        : 5,
  };
}

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly items = signal<Reminder[]>([]);

  reminders = computed(() => this.items());

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  /** Carrega lembretes da API. Chamar após login ou ao abrir lembretes/dashboard. */
  loadReminders(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.items.set([]);
      return Promise.resolve();
    }
    return this.http
      .get<Reminder[]>(`${API_URL}/reminders`)
      .toPromise()
      .then((list) => {
        const raw = Array.isArray(list) ? list : [];
        this.items.set(raw.map((r) => normalizeReminder(r)));
      })
      .catch((err) => {
        console.warn('ReminderService: erro ao carregar lembretes', err);
        this.items.set([]);
      });
  }

  /** Dias até à data do lembrete (0 = hoje; negativo = já passou). */
  daysUntilDelivery(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr + 'T12:00:00');
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Lembretes na janela de aviso: hoje até N dias antes da data, conforme `notifyDaysBefore` de cada um.
   * Usado no popup após login e no cartão do dashboard.
   */
  remindersInNotifyWindow(): Reminder[] {
    return this.items()
      .filter((r) => {
        const daysUntil = this.daysUntilDelivery(r.deliveryDate);
        const n = r.notifyDaysBefore ?? 5;
        return daysUntil >= 0 && daysUntil <= n;
      })
      .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
  }

  /** Lembretes com data entre hoje e hoje+daysAhead. */
  upcomingReminders(daysAhead: number): Reminder[] {
    const list = this.items();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(today.getDate() + daysAhead);
    end.setHours(23, 59, 59, 999);

    return list.filter((r) => {
      const d = new Date(r.deliveryDate + 'T12:00:00');
      return d >= today && d <= end;
    });
  }

  getByDate(dateStr: string): Reminder[] {
    return this.items().filter((r) => r.deliveryDate === dateStr);
  }

  getCountForDate(dateStr: string): number {
    return this.getByDate(dateStr).length;
  }

  add(save: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder> {
    const notify =
      typeof save.notifyDaysBefore === 'number' && Number.isFinite(save.notifyDaysBefore)
        ? save.notifyDaysBefore
        : 5;
    return this.http
      .post<Reminder>(`${API_URL}/reminders`, {
        clientName: save.clientName,
        address: save.address ?? '',
        deliveryDate: save.deliveryDate,
        description: save.description ?? '',
        notifyDaysBefore: notify,
      })
      .toPromise()
      .then((created) => {
        if (created) {
          const c = normalizeReminder(created);
          this.items.update((list) => [...list, c]);
          return c;
        }
        throw new Error('Resposta vazia');
      });
  }

  update(
    id: string,
    body: Omit<Reminder, 'id' | 'createdAt'>
  ): Promise<Reminder> {
    const notify =
      typeof body.notifyDaysBefore === 'number' && Number.isFinite(body.notifyDaysBefore)
        ? body.notifyDaysBefore
        : 5;
    return this.http
      .put<Reminder>(`${API_URL}/reminders/${id}`, {
        clientName: body.clientName,
        address: body.address ?? '',
        deliveryDate: body.deliveryDate,
        description: body.description ?? '',
        notifyDaysBefore: notify,
      })
      .toPromise()
      .then((updated) => {
        if (updated) {
          const u = normalizeReminder(updated);
          this.items.update((list) => list.map((r) => (r.id === id ? u : r)));
          return u;
        }
        throw new Error('Resposta vazia');
      });
  }

  remove(id: string): Promise<void> {
    return this.http
      .delete(`${API_URL}/reminders/${id}`)
      .toPromise()
      .then(() => {
        this.items.update((list) => list.filter((r) => r.id !== id));
      });
  }
}
