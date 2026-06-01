import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { API_URL } from '../../../core/config/api.config';

export interface AccessLogUserSummary {
  userId: string;
  userPhone?: string;
  userFullName?: string;
  admin: boolean;
  totalLogins: number;
  firstLoginAt?: string;
  lastLoginAt?: string;
  lastIpAddress?: string;
}

export interface AccessLogUsersPage {
  items: AccessLogUserSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AccessLog {
  id: string;
  userId: string;
  userPhone?: string;
  userFullName?: string;
  admin: boolean;
  ipAddress?: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-logs.component.html',
  styleUrl: './admin-logs.component.scss',
})
export class AdminLogsComponent implements OnInit {
  private http = inject(HttpClient);

  users = signal<AccessLogUserSummary[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  loading = signal(true);
  error = signal('');

  searchTerm = signal('');
  pageSize = signal(15);
  currentPage = signal(0);

  detailOpen = signal(false);
  detailLoading = signal(false);
  detailError = signal('');
  detailUser = signal<AccessLogUserSummary | null>(null);
  detailLogs = signal<AccessLog[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    let params = new HttpParams()
      .set('page', String(this.currentPage()))
      .set('size', String(this.pageSize()));

    const term = this.searchTerm().trim();
    if (term) {
      params = params.set('search', term);
    }

    this.http.get<AccessLogUsersPage>(`${API_URL}/admin/access-logs/users`, { params }).subscribe({
      next: (page) => {
        this.users.set(page?.items ?? []);
        this.totalElements.set(page?.totalElements ?? 0);
        this.totalPages.set(page?.totalPages ?? 0);
        this.loading.set(false);
      },
      error: (err) => {
        if (err?.status === 403) {
          this.error.set('Acesso negado.');
        } else if (err?.status === 404) {
          this.error.set('Endpoint não encontrado. Reinicia o backend para aplicar as alterações.');
        } else if (err?.status === 0) {
          this.error.set('Sem ligação ao servidor. Verifica se o backend está a correr.');
        } else {
          this.error.set(`Erro ao carregar utilizadores (${err?.status ?? 'desconhecido'}).`);
        }
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(0);
    this.load();
  }

  handleSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.onSearch(value);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.load();
  }

  handlePageSizeChange(event: Event): void {
    const value = +(event.target as HTMLSelectElement)?.value || 15;
    this.onPageSizeChange(value);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.load();
    }
  }

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const max = 5;

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const pages: number[] = [];
    const start = Math.max(0, current - 2);
    const end = Math.min(total - 1, start + max - 1);

    if (start > 0) pages.push(0);
    if (start > 1) pages.push(-1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 2) pages.push(-1);
    if (end < total - 1) pages.push(total - 1);

    return pages;
  });

  openDetails(user: AccessLogUserSummary): void {
    this.detailUser.set(user);
    this.detailOpen.set(true);
    this.detailLoading.set(true);
    this.detailError.set('');
    this.detailLogs.set([]);

    this.http
      .get<AccessLog[]>(`${API_URL}/admin/users/${user.userId}/access-logs`, {
        params: new HttpParams().set('limit', '100'),
      })
      .subscribe({
        next: (logs) => {
          this.detailLogs.set(logs ?? []);
          this.detailLoading.set(false);
        },
        error: () => {
          this.detailError.set('Erro ao carregar histórico do utilizador.');
          this.detailLoading.set(false);
        },
      });
  }

  closeDetails(): void {
    this.detailOpen.set(false);
    this.detailUser.set(null);
    this.detailLogs.set([]);
    this.detailError.set('');
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatIp(ip?: string): string {
    if (!ip) return '—';
    if (ip === '0:0:0:0:0:0:0:1' || ip === '127.0.0.1' || ip === '::1') {
      return 'localhost';
    }
    return ip;
  }

  userDisplayName(user: AccessLogUserSummary): string {
    return user.userFullName?.trim() || user.userPhone || 'Utilizador';
  }

  initials(name: string): string {
    const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0]?.[0] ?? '?').toUpperCase();
  }
}
