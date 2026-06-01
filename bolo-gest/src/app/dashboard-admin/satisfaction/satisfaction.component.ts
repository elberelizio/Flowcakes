import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserFeedbackService, type UserFeedbackItem } from '../../services/user-feedback.service';

@Component({
  selector: 'app-satisfaction',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './satisfaction.component.html',
  styleUrl: './satisfaction.component.scss',
})
export class SatisfactionComponent implements OnInit {
  private readonly feedback = inject(UserFeedbackService);

  readonly items = signal<UserFeedbackItem[]>([]);
  readonly averageRating = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly recommendYesCount = computed(() =>
    this.items().filter((i) => i.wouldRecommend === true).length,
  );

  readonly recommendNoCount = computed(() =>
    this.items().filter((i) => i.wouldRecommend === false).length,
  );

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [list, avg] = await Promise.all([
        this.feedback.listForAdmin(),
        this.feedback.getAverageForAdmin(),
      ]);
      this.items.set(list);
      this.averageRating.set(Math.round(avg * 10) / 10);
    } catch (err: unknown) {
      const e = err as { status?: number };
      this.error.set(e?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar avaliações.');
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  recommendLabel(value: boolean | null): string {
    if (value === true) return 'Sim';
    if (value === false) return 'Não';
    return '—';
  }

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating));
  }
}
