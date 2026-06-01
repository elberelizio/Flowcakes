import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';
import { IconComponent } from '../../ui/icon/icon.component';

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
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss',
})
export class RankingComponent implements OnInit {
  private http = inject(HttpClient);

  ranking = signal<RankingRow[]>([]);
  loading = signal(true);
  error = signal('');
  searchQuery = signal('');

  totalOrders = computed(() => this.ranking().reduce((s, r) => s + (r.orderCount ?? 0), 0));
  totalRevenue = computed(() => this.ranking().reduce((s, r) => s + (r.totalRevenue ?? 0), 0));
  topThree = computed(() => this.ranking().slice(0, 3));

  filteredRanking = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.ranking();
    if (!q) return list;
    return list.filter((r) =>
      [r.fullName, r.phone, String(r.rank)].join(' ').toLowerCase().includes(q)
    );
  });

  leader = computed(() => this.ranking()[0] ?? null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<RankingRow[]>(`${API_URL}/admin/ranking`).subscribe({
      next: (list) => {
        this.ranking.set(list ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        if (err?.status === 404) {
          this.ranking.set([]);
        } else {
          this.error.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar.');
        }
        this.loading.set(false);
      },
    });
  }

  initials(name: string): string {
    return (name?.charAt(0) || '?').toUpperCase();
  }

  podiumClass(rank: number): string {
    if (rank === 1) return 'rk-podium--first';
    if (rank === 2) return 'rk-podium--second';
    return 'rk-podium--third';
  }

  rankBadgeClass(rank: number): string {
    if (rank === 1) return 'rk-rank-badge--first';
    if (rank === 2) return 'rk-rank-badge--second';
    if (rank === 3) return 'rk-rank-badge--third';
    return '';
  }
}
