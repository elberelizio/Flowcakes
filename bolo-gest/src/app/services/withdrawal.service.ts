import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Withdrawal, WithdrawalCreate } from '../models/withdrawal.model';
import { API_URL } from '../core/api.config';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WithdrawalService {
  private readonly items = signal<Withdrawal[]>([]);

  withdrawals = computed(() => this.items());

  totalWithdrawn = computed(() =>
    this.items().reduce((sum, w) => sum + (w.amount ?? 0), 0)
  );

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  loadWithdrawals(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.items.set([]);
      return Promise.resolve();
    }
    return this.http
      .get<Withdrawal[]>(`${API_URL}/withdrawals`)
      .toPromise()
      .then((list) => {
        this.items.set(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.warn('WithdrawalService: erro ao carregar retiradas', err);
        this.items.set([]);
      });
  }

  fetchTotal(): Promise<number> {
    if (!this.auth.isLoggedIn()) return Promise.resolve(0);
    return this.http
      .get<{ total: number }>(`${API_URL}/withdrawals/total`)
      .toPromise()
      .then((res) => (res?.total ?? 0))
      .catch(() => 0);
  }

  add(data: WithdrawalCreate): Promise<Withdrawal> {
    return this.http
      .post<Withdrawal>(`${API_URL}/withdrawals`, data)
      .toPromise()
      .then((w) => {
        if (w) this.items.update((list) => [w, ...list]);
        return w!;
      });
  }

  remove(id: string): Promise<void> {
    return this.http
      .delete<void>(`${API_URL}/withdrawals/${id}`)
      .toPromise()
      .then(() => {
        this.items.update((list) => list.filter((w) => w.id !== id));
      });
  }
}
