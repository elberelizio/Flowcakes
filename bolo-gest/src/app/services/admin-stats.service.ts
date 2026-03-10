import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../core/api.config';

export interface AdminStats {
  totalUsers: number;
  licensesPaid: number;
  licensesPending: number;
}

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private http = inject(HttpClient);
  private _pendingCount = signal(0);

  readonly pendingCount = this._pendingCount.asReadonly();

  loadStats(): void {
    this.http.get<AdminStats>(`${API_URL}/admin/stats`).subscribe({
      next: (s) => this._pendingCount.set(s.licensesPending ?? 0),
      error: () => this._pendingCount.set(0),
    });
  }
}
