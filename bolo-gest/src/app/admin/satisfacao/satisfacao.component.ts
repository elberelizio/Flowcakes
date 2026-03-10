import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api.config';

export interface UserFeedback {
  id: string;
  userId: string;
  userPhone?: string;
  userFullName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

@Component({
  selector: 'app-satisfacao',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './satisfacao.component.html',
  styleUrl: './satisfacao.component.scss',
})
export class SatisfacaoComponent implements OnInit {
  private http = inject(HttpClient);

  feedbackList = signal<UserFeedback[]>([]);
  averageRating = signal(0);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<UserFeedback[]>(`${API_URL}/admin/feedback`).subscribe({
      next: (list) => {
        this.feedbackList.set(list ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar.');
        this.loading.set(false);
      },
    });
    this.http.get<number>(`${API_URL}/admin/feedback/average`).subscribe({
      next: (avg) => this.averageRating.set(avg ?? 0),
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

  userLabel(f: UserFeedback): string {
    if (f.userFullName?.trim()) return `${f.userFullName} (${f.userPhone || '—'})`;
    return f.userPhone || f.userId || '—';
  }

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  roundRating(value: number): number {
    return Math.round(value);
  }
}
