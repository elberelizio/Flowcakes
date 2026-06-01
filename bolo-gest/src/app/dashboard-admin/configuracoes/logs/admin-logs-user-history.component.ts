import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { API_URL } from '../../../core/config/api.config';
import type { AccessLogUserSummary } from './admin-logs.component';

export interface UserActivityHistoryRow {
  id: string;
  sessionId?: string;
  activityType: string;
  label?: string;
  pagePath?: string;
  operation?: string;
  detail?: string;
  ipAddress?: string;
  sessionStartedAt?: string;
  createdAt?: string;
}

export interface UserActivityHistoryPage {
  items: UserActivityHistoryRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface AdminUserDetail {
  id: string;
  fullName?: string;
  phone?: string;
  totalLogins?: number;
  firstLoginAt?: string;
  lastLoginAt?: string;
}

@Component({
  selector: 'app-admin-logs-user-history',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-logs-user-history.component.html',
  styleUrls: ['./admin-logs.component.scss', './admin-logs-user-history.component.scss'],
})
export class AdminLogsUserHistoryComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  userId = signal('');
  user = signal<AccessLogUserSummary | null>(null);

  dateFrom = signal('');
  dateTo = signal('');
  activityType = signal('');

  rows = signal<UserActivityHistoryRow[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  pageSize = signal(50);

  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('userId') ?? '';
    this.userId.set(id);

    const state = history.state as { user?: AccessLogUserSummary } | undefined;
    if (state?.user && state.user.userId === id) {
      this.user.set(state.user);
    }

    const today = this.toDateInputValue(new Date());
    const monthAgo = this.toDateInputValue(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    this.dateFrom.set(monthAgo);
    this.dateTo.set(today);

    if (!this.user()) {
      this.loadUserMeta(id);
    }
    this.loadHistory();
  }

  private loadUserMeta(userId: string): void {
    this.http.get<AdminUserDetail>(`${API_URL}/admin/users/${userId}`).subscribe({
      next: (d) => {
        this.user.set({
          userId: d.id,
          userFullName: d.fullName,
          userPhone: d.phone,
          admin: false,
          totalLogins: d.totalLogins ?? 0,
          firstLoginAt: d.firstLoginAt,
          lastLoginAt: d.lastLoginAt,
        });
      },
      error: () => {},
    });
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set('');

    let params = new HttpParams()
      .set('page', String(this.currentPage()))
      .set('size', String(this.pageSize()));

    const from = this.dateFrom().trim();
    const to = this.dateTo().trim();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    const type = this.activityType().trim();
    if (type) params = params.set('type', type);

    this.http
      .get<UserActivityHistoryPage>(`${API_URL}/admin/users/${this.userId()}/activity-history`, { params })
      .subscribe({
        next: (page) => {
          this.rows.set(page?.items ?? []);
          this.totalElements.set(page?.totalElements ?? 0);
          this.totalPages.set(page?.totalPages ?? 0);
          this.loading.set(false);
        },
        error: (err) => {
          if (err?.status === 404) {
            this.error.set('Endpoint não encontrado. Reinicia o backend.');
          } else if (err?.status === 403) {
            this.error.set('Acesso negado.');
          } else {
            this.error.set('Erro ao carregar histórico.');
          }
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.currentPage.set(0);
    this.loadHistory();
  }

  setPreset(days: number | 'today' | 'month'): void {
    const end = new Date();
    let start: Date;
    if (days === 'today') {
      start = new Date(end);
    } else if (days === 'month') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else {
      start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    }
    this.dateFrom.set(this.toDateInputValue(start));
    this.dateTo.set(this.toDateInputValue(end));
    this.applyFilters();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.loadHistory();
  }

  handlePageSizeChange(event: Event): void {
    const value = +(event.target as HTMLSelectElement)?.value || 50;
    this.onPageSizeChange(value);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadHistory();
    }
  }

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const max = 7;
    if (total <= max) return Array.from({ length: total }, (_, i) => i);
    const pages: number[] = [];
    const start = Math.max(0, current - 3);
    const end = Math.min(total - 1, start + max - 1);
    if (start > 0) pages.push(0);
    if (start > 1) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 2) pages.push(-1);
    if (end < total - 1) pages.push(total - 1);
    return pages;
  });

  userDisplayName(): string {
    const u = this.user();
    return u?.userFullName?.trim() || u?.userPhone || 'Utilizador';
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  formatDateOnly(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatIp(ip?: string): string {
    if (!ip) return '—';
    if (ip === '0:0:0:0:0:0:0:1' || ip === '127.0.0.1' || ip === '::1') return 'localhost';
    return ip;
  }

  activityTypeLabel(type: string): string {
    switch (type) {
      case 'LOGIN':
        return 'Entrada';
      case 'LOGOUT':
        return 'Saída';
      case 'PAGE_VIEW':
        return 'Página';
      case 'OPERATION':
        return 'Operação';
      default:
        return type;
    }
  }

  typeBadgeClass(type: string): string {
    return `al-type al-type--${(type || '').toLowerCase().replace('_', '-')}`;
  }

  private toDateInputValue(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
