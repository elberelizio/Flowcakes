import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../core/config/api.config';

export interface AdminStats {
  totalUsers: number;
  licensesPaid: number;
  licensesTrial?: number;
  licensesPending: number;
}

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private http = inject(HttpClient);
  private _pendingCount = signal(0);
  private _expiringLicensesCount = signal(0);

  readonly pendingCount = this._pendingCount.asReadonly();
  readonly expiringLicensesCount = this._expiringLicensesCount.asReadonly();

  loadStats(): void {
    this.http.get<AdminStats>(`${API_URL}/admin/stats`).subscribe({
      next: (s) => this._pendingCount.set(s.licensesPending ?? 0),
      error: () => this._pendingCount.set(0),
    });
    this.http.get<unknown[]>(`${API_URL}/admin/licenses-expiring?days=10`).subscribe({
      next: (list) => this._expiringLicensesCount.set(Array.isArray(list) ? list.length : 0),
      error: () => this._expiringLicensesCount.set(0),
    });
  }
}
