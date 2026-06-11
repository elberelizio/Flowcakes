import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { API_URL } from '../../core/config/api.config';

export interface LandingSuggestion {
  id: string;
  personName: string;
  message: string;
  deviceId: string;
  pageUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  message: string;
  pageUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

type SuggestionsTab = 'landing' | 'contact';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './suggestions.component.html',
  styleUrl: './suggestions.component.scss',
})
export class SuggestionsComponent implements OnInit {
  private http = inject(HttpClient);

  activeTab = signal<SuggestionsTab>('landing');
  allSuggestions = signal<LandingSuggestion[]>([]);
  allContactMessages = signal<ContactMessage[]>([]);
  loading = signal(true);
  error = signal('');

  searchTerm = signal('');
  pageSize = signal(10);
  currentPage = signal(1);
  sortBy = signal<'date' | 'name'>('date');
  sortOrder = signal<'asc' | 'desc'>('desc');

  filteredSuggestions = computed(() => {
    let filtered = [...this.allSuggestions()];
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      filtered = filtered.filter(
        (s) =>
          s.personName.toLowerCase().includes(term) ||
          s.message.toLowerCase().includes(term) ||
          s.pageUrl?.toLowerCase().includes(term),
      );
    }
    return this.sortItems(filtered, (a, b) => a.personName.localeCompare(b.personName));
  });

  filteredContactMessages = computed(() => {
    let filtered = [...this.allContactMessages()];
    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      filtered = filtered.filter(
        (s) =>
          s.fullName.toLowerCase().includes(term) ||
          s.message.toLowerCase().includes(term) ||
          s.email?.toLowerCase().includes(term) ||
          s.phone?.toLowerCase().includes(term) ||
          s.pageUrl?.toLowerCase().includes(term),
      );
    }
    return this.sortItems(filtered, (a, b) => a.fullName.localeCompare(b.fullName));
  });

  activeList = computed(() =>
    this.activeTab() === 'landing' ? this.filteredSuggestions() : this.filteredContactMessages(),
  );

  paginatedItems = computed(() => {
    const filtered = this.activeList();
    const pageIdx = this.currentPage() - 1;
    const start = pageIdx * this.pageSize();
    return filtered.slice(start, start + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.activeList().length / this.pageSize()) || 1);

  totalResults = computed(() => this.activeList().length);

  ngOnInit(): void {
    this.load();
  }

  setTab(tab: SuggestionsTab): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    if (this.activeTab() === 'landing') {
      this.http.get<LandingSuggestion[]>(`${API_URL}/admin/landing-suggestions`).subscribe({
        next: (list) => {
          this.allSuggestions.set(list ?? []);
          this.currentPage.set(1);
          this.loading.set(false);
        },
        error: (err) => this.handleError(err),
      });
      return;
    }

    this.http.get<ContactMessage[]>(`${API_URL}/admin/contact-messages`).subscribe({
      next: (list) => {
        this.allContactMessages.set(list ?? []);
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: (err) => this.handleError(err),
    });
  }

  private handleError(err: HttpErrorResponse): void {
    if (err.status === 403) {
      this.error.set('Acesso negado. Verifica se és administrador.');
    } else if (err.status === 401) {
      this.error.set('Não autenticado. Faz login novamente.');
    } else if (err.status === 404) {
      this.error.set('Endpoint não encontrado. Atualize o backend em produção.');
    } else if (err.status === 0) {
      this.error.set('Erro de conexão com o servidor. Verifica se o backend está em execução.');
    } else {
      this.error.set(`Erro ${err.status}: ${err.message}`);
    }
    this.loading.set(false);
  }

  private sortItems<T extends { createdAt: string }>(items: T[], nameCompare: (a: T, b: T) => number): T[] {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let compareValue = 0;
      if (this.sortBy() === 'name') {
        compareValue = nameCompare(a, b);
      } else {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return this.sortOrder() === 'asc' ? compareValue : -compareValue;
    });
    return sorted;
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

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  handleSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value || '';
    this.onSearch(value);
  }

  handlePageSizeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement)?.value || '10';
    this.onPageSizeChange(+value);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  toggleSort(field: 'date' | 'name'): void {
    if (this.sortBy() === field) {
      this.sortOrder.update((v) => (v === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('desc');
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const max = 5;

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + max - 1);

    if (start > 1) pages.push(1);
    if (start > 2) pages.push(-1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) pages.push(-1);
    if (end < total) pages.push(total);

    return pages;
  }
}
