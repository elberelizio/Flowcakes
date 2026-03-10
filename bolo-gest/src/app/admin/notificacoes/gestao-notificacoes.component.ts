import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api.config';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  active: boolean;
}

@Component({
  selector: 'app-gestao-notificacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gestao-notificacoes.component.html',
  styleUrl: './gestao-notificacoes.component.scss',
})
export class GestaoNotificacoesComponent implements OnInit {
  private http = inject(HttpClient);

  notifications = signal<SystemNotification[]>([]);
  loading = signal(true);
  error = signal('');
  creating = signal(false);
  createError = signal('');

  title = '';
  message = '';
  type = 'info';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<SystemNotification[]>(`${API_URL}/admin/notifications`).subscribe({
      next: (list) => {
        this.notifications.set(list ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar.');
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    const title = this.title?.trim();
    const message = this.message?.trim();
    if (!title || !message) {
      this.createError.set('Preencha o título e a mensagem.');
      return;
    }
    this.creating.set(true);
    this.createError.set('');
    this.http
      .post<SystemNotification>(`${API_URL}/admin/notifications`, {
        title,
        message,
        type: this.type || 'info',
      })
      .subscribe({
        next: () => {
          this.title = '';
          this.message = '';
          this.type = 'info';
          this.creating.set(false);
          this.load();
        },
        error: (err) => {
          this.createError.set(err?.error?.message ?? 'Erro ao enviar.');
          this.creating.set(false);
        },
      });
  }

  deactivate(id: string): void {
    this.http.patch(`${API_URL}/admin/notifications/${id}/deactivate`, {}).subscribe({
      next: () => this.load(),
      error: () => {},
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
}
