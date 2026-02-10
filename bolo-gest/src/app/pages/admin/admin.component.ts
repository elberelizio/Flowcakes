import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api.config';

export interface AdminStats {
  totalUsers: number;
  licensesPaid: number;
  licensesPending: number;
}

export interface AdminUserRow {
  id: string;
  fullName?: string;
  phone: string;
  documentType?: string;
  documentNumber?: string;
  province?: string;
  email?: string;
  createdAt: string;
  licenseStatus: string;
  licenseToken?: string;
  licenseActivationToken?: string;
  licenseValidUntil?: string; // ISO
}

type FilterTab = 'activas' | 'bloqueados' | 'expiradas';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  stats: AdminStats | null = null;
  users = signal<AdminUserRow[]>([]);
  filterTab = signal<FilterTab>('activas');
  loading = true;
  error = '';
  confirmingUserId: string | null = null;
  /** Utilizador para o qual se está a abrir o modal de confirmar pagamento (ID transação e-Mola). */
  confirmPaymentUser: AdminUserRow | null = null;
  confirmPaymentTxId = '';
  confirmPaymentDurationMonths = 1;
  confirmPaymentError = '';
  copiedForUserId: string | null = null;
  readonly durationOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  filteredUsers = computed(() => {
    const list = this.users();
    const tab = this.filterTab();
    const now = new Date();
    if (tab === 'bloqueados') return list.filter((u) => u.licenseStatus === 'pending');
    if (tab === 'activas') return list.filter((u) => u.licenseStatus === 'paid' && (!u.licenseValidUntil || new Date(u.licenseValidUntil) > now));
    if (tab === 'expiradas') return list.filter((u) => u.licenseStatus === 'paid' && u.licenseValidUntil && new Date(u.licenseValidUntil) <= now);
    return list;
  });

  expiredCount = computed(() => {
    const now = new Date();
    return this.users().filter((u) => u.licenseStatus === 'paid' && u.licenseValidUntil && new Date(u.licenseValidUntil) <= now).length;
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.http.get<AdminStats>(`${API_URL}/admin/stats`).subscribe({
      next: (s) => {
        this.stats = s;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar.';
        this.loading = false;
      },
    });
    this.http.get<AdminUserRow[]>(`${API_URL}/admin/users`).subscribe({
      next: (u) => this.users.set(u),
      error: () => {},
    });
  }

  setFilter(tab: FilterTab): void {
    this.filterTab.set(tab);
  }

  openConfirmPaymentModal(user: AdminUserRow): void {
    if (user.licenseStatus === 'paid') return;
    this.confirmPaymentUser = user;
    this.confirmPaymentTxId = '';
    this.confirmPaymentDurationMonths = 1;
    this.confirmPaymentError = '';
  }

  closeConfirmPaymentModal(): void {
    this.confirmPaymentUser = null;
    this.confirmPaymentTxId = '';
    this.confirmPaymentError = '';
  }

  submitConfirmPayment(): void {
    const user = this.confirmPaymentUser;
    if (!user) return;
    const txId = this.confirmPaymentTxId.trim();
    if (!txId) {
      this.confirmPaymentError = 'Introduza o ID da transacção e-Mola.';
      return;
    }
    this.confirmPaymentError = '';
    this.confirmingUserId = user.id;
    const months = this.confirmPaymentDurationMonths >= 1 && this.confirmPaymentDurationMonths <= 12 ? this.confirmPaymentDurationMonths : 1;
    this.http
      .post<AdminUserRow>(`${API_URL}/admin/users/${user.id}/confirm-payment`, {
        eMolaTransactionId: txId,
        durationMonths: months,
      })
      .subscribe({
        next: (updated) => {
          this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
          this.confirmingUserId = null;
          this.closeConfirmPaymentModal();
        },
        error: (err) => {
          this.confirmingUserId = null;
          this.confirmPaymentError =
            err?.error?.message || err?.status === 400
              ? 'ID inválido ou já utilizado.'
              : 'Erro ao confirmar. Tente novamente.';
        },
      });
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /** Gera o URL do link de ativação. Na URL vai só o token opaco (t=), nunca o código da licença. */
  buildActivationLink(activationToken: string): string {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const path = '/ativar-licenca';
    const t = encodeURIComponent(activationToken.trim());
    return `${origin}${path}?t=${t}`;
  }

  /** Copia o link (URL com token opaco). O cliente ao abrir o link vê o nome e o código na página (código só na resposta da API). */
  copyActivationLink(user: AdminUserRow): void {
    if (!user?.licenseActivationToken) return;
    const link = this.buildActivationLink(user.licenseActivationToken);
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.copiedForUserId = user.id;
      setTimeout(() => (this.copiedForUserId = null), 2500);
    }).catch(() => {});
  }
}
