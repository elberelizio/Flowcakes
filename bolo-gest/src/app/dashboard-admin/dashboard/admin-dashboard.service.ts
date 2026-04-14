import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/config/api.config';
import type { AdminStats, RevenueByMonthDto } from './models';

/**
 * Serviço de dados do painel de administração.
 * Concentra todas as chamadas à API desta página para facilitar testes e reutilização.
 */
@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${API_URL}/admin/stats`);
  }

  getRevenueByMonth(): Observable<RevenueByMonthDto[]> {
    return this.http.get<RevenueByMonthDto[]>(`${API_URL}/admin/revenue-by-month`);
  }
}
