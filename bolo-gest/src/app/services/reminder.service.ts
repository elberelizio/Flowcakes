import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reminder } from '../models/reminder.model';
import { API_URL } from '../core/api.config';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly items = signal<Reminder[]>([]);

  reminders = computed(() => this.items());

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  /** Carrega lembretes da API. Chamar após login ou ao abrir calendário/lembretes/dashboard. */
  loadReminders(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.items.set([]);
      return Promise.resolve();
    }
    return this.http
      .get<Reminder[]>(`${API_URL}/reminders`)
      .toPromise()
      .then((list) => {
        this.items.set(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.warn('ReminderService: erro ao carregar lembretes', err);
        this.items.set([]);
      });
  }

  /** Lembretes com entrega nos próximos N dias (para notificações "compre material") */
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
    return this.http
      .post<Reminder>(`${API_URL}/reminders`, {
        clientName: save.clientName,
        address: save.address ?? '',
        deliveryDate: save.deliveryDate,
        description: save.description ?? '',
      })
      .toPromise()
      .then((created) => {
        if (created) {
          this.items.update((list) => [...list, created]);
          return created;
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
