import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Withdrawal, WithdrawalCreate } from '../models/withdrawal.model';
import { API_URL } from '../core/config/api.config';
import { AuthService } from './auth.service';

export interface WithdrawalSummary {
  totalProfit: number;
  totalWithdrawn: number;
  availableProfit: number;
}

@Injectable({ providedIn: 'root' })
export class WithdrawalService {
  private readonly items = signal<Withdrawal[]>([]);
  private readonly summary = signal<WithdrawalSummary>({
    totalProfit: 0,
    totalWithdrawn: 0,
    availableProfit: 0,
  });

  withdrawals = computed(() => this.items());

  totalWithdrawn = computed(() => this.summary().totalWithdrawn);

  totalProfit = computed(() => this.summary().totalProfit);

  availableProfit = computed(() => this.summary().availableProfit);

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  loadWithdrawals(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.items.set([]);
      this.summary.set({ totalProfit: 0, totalWithdrawn: 0, availableProfit: 0 });
      return Promise.resolve();
    }
    return Promise.all([this.fetchList(), this.fetchSummary()]).then(() => undefined);
  }

  private fetchList(): Promise<void> {
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

  fetchSummary(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.summary.set({ totalProfit: 0, totalWithdrawn: 0, availableProfit: 0 });
      return Promise.resolve();
    }
    return this.http
      .get<WithdrawalSummary>(`${API_URL}/withdrawals/summary`)
      .toPromise()
      .then((res) => {
        this.summary.set({
          totalProfit: res?.totalProfit ?? 0,
          totalWithdrawn: res?.totalWithdrawn ?? 0,
          availableProfit: res?.availableProfit ?? 0,
        });
      })
      .catch((err) => {
        console.warn('WithdrawalService: erro ao carregar resumo', err);
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
        if (w) {
          this.items.update((list) => [w, ...list]);
          void this.fetchSummary();
        }
        return w!;
      });
  }

  remove(id: string): Promise<void> {
    return this.http
      .delete<void>(`${API_URL}/withdrawals/${id}`)
      .toPromise()
      .then(() => {
        this.items.update((list) => list.filter((w) => w.id !== id));
        void this.fetchSummary();
      });
  }
}
