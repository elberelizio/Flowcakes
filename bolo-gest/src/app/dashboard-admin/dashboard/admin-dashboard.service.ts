import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/config/api.config';
import type { AdminRankingRow, AdminStats, RevenueByMonthDto } from './models';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${API_URL}/admin/stats`);
  }

  getRevenueByMonth(): Observable<RevenueByMonthDto[]> {
    return this.http.get<RevenueByMonthDto[]>(`${API_URL}/admin/revenue-by-month`);
  }

  getLicenseRevenueByMonth(): Observable<RevenueByMonthDto[]> {
    return this.http.get<RevenueByMonthDto[]>(`${API_URL}/admin/license-revenue-by-month`);
  }

  getRanking(limit = 10): Observable<AdminRankingRow[]> {
    return this.http.get<AdminRankingRow[]>(`${API_URL}/admin/ranking`, { params: { limit } });
  }
}
