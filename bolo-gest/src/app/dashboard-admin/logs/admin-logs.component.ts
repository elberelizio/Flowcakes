import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';

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
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-logs.component.html',
  styleUrl: './admin-logs.component.scss',
})
export class AdminLogsComponent implements OnInit {
  private http = inject(HttpClient);

  logs = signal<AccessLog[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<AccessLog[]>(`${API_URL}/admin/access-logs?limit=200`).subscribe({
      next: (list) => {
        this.logs.set(list ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar logs.');
        this.loading.set(false);
      },
    });
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  userLabel(log: AccessLog): string {
    if (log.userFullName?.trim()) return `${log.userFullName} (${log.userPhone || '—'})`;
    return log.userPhone || log.userId || '—';
  }
}
