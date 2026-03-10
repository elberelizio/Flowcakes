import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api.config';

export interface RankingRow {
  rank: number;
  userId: string;
  fullName: string;
  phone: string;
  orderCount: number;
  totalRevenue?: number;
  averageRating?: number;
}

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss',
})
export class RankingComponent implements OnInit {
  private http = inject(HttpClient);

  ranking = signal<RankingRow[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    // Endpoint de ranking pode ser criado no backend; por agora usa mock ou API se existir
    this.http.get<RankingRow[]>(`${API_URL}/admin/ranking`).subscribe({
      next: (list) => {
        this.ranking.set(list ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        // 404 = endpoint ainda não existe; tratar como lista vazia
        if (err?.status === 404) {
          this.ranking.set([]);
        } else {
          this.error.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar.');
        }
        this.loading.set(false);
      },
    });
  }
}
