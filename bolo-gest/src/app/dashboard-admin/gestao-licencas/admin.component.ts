import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';
import { isPaidOrTrialStatus, licenseStatusLabelPt } from '../../core/license/license-status';

export interface AdminStats {
  totalUsers: number;
  licensesPaid: number;
  /** EN: Active trial licenses. Pt: Licenças em teste activas. */
  licensesTrial?: number;
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
  licensePaidAt?: string; // ISO — para calcular período (X meses)
  blocked?: boolean;
  admin?: boolean;
}

export interface AdminUserDetail {
  id: string;
  fullName?: string;
  phone: string;
  documentType?: string;
  documentNumber?: string;
  province?: string;
  email?: string;
  createdAt: string;
  licenseStatus?: string;
  licenseToken?: string;
  licenseActivationToken?: string;
  licenseValidUntil?: string;
  licensePaidAt?: string;
  licensePaymentReference?: string;
  licenseCreatedAt?: string;
  totalLogins?: number;
  firstLoginAt?: string;
  lastLoginAt?: string;
  blocked?: boolean;
}

export interface ExpiringLicenseRow {
  userId: string;
  fullName?: string;
  phone?: string;
  validUntil?: string;
  daysRemaining?: number;
}

type FilterTab = 'activas' | 'expiradas' | 'expiring' | 'admins';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  /** Expor funções ao template (EN: avoid method boilerplate). */
  readonly licenseStatusLabelPt = licenseStatusLabelPt;
  readonly isPaidOrTrialStatus = isPaidOrTrialStatus;

  stats: AdminStats | null = null;
  users = signal<AdminUserRow[]>([]);
  filterTab = signal<FilterTab>('activas');
  loading = true;
  error = '';
  copiedForUserId: string | null = null;
  /** Modal estender prazo */
  extendUser: AdminUserRow | null = null;
  extendMonths = 1;
  extendError = '';
  extendingUserId: string | null = null;
  readonly extendOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24];
  actionLoadingId: string | null = null;

  expiringLicenses = signal<ExpiringLicenseRow[]>([]);
  expiringLoading = signal(false);

  selectedUserDetail = signal<AdminUserDetail | null>(null);
  detailLoading = signal(false);
  detailError = signal('');

  adminUsers = computed(() => this.users().filter((u) => u.admin));

  filteredUsers = computed(() => {
    const list = this.users();
    const tab = this.filterTab();
    const now = new Date();
    if (tab === 'admins') {
      return list.filter((u) => u.admin);
    }
    if (tab === 'activas') {
      return list.filter(
        (u) =>
          !u.admin &&
          isPaidOrTrialStatus(u.licenseStatus) &&
          (!u.licenseValidUntil || new Date(u.licenseValidUntil) > now)
      );
    }
    if (tab === 'expiradas') {
      return list.filter(
        (u) =>
          !u.admin &&
          isPaidOrTrialStatus(u.licenseStatus) &&
          u.licenseValidUntil &&
          new Date(u.licenseValidUntil) <= now
      );
    }
    return list.filter((u) => !u.admin);
  });

  expiredCount = computed(() => {
    const now = new Date();
    return this.users().filter(
      (u) =>
        !u.admin &&
        isPaidOrTrialStatus(u.licenseStatus) &&
        u.licenseValidUntil &&
        new Date(u.licenseValidUntil) <= now
    ).length;
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
    this.loadExpiringLicenses();
  }

  loadExpiringLicenses(): void {
    this.expiringLoading.set(true);
    this.http.get<ExpiringLicenseRow[]>(`${API_URL}/admin/licenses-expiring?days=10`).subscribe({
      next: (rows) => {
        this.expiringLicenses.set(rows);
        this.expiringLoading.set(false);
      },
      error: () => {
        this.expiringLoading.set(false);
      },
    });
  }

  setFilter(tab: FilterTab): void {
    this.filterTab.set(tab);
  }

  openExtendModal(user: AdminUserRow): void {
    this.extendUser = user;
    this.extendMonths = 1;
    this.extendError = '';
  }

  /** Abre o modal de estender prazo a partir do utilizador em detalhe (evita object literal no template). */
  openExtendModalFromDetail(): void {
    const d = this.selectedUserDetail();
    if (!d) return;
    this.extendUser = {
      id: d.id,
      phone: d.phone,
      fullName: d.fullName,
      createdAt: d.createdAt,
      licenseStatus: d.licenseStatus ?? '',
      licenseToken: d.licenseToken,
      licenseValidUntil: d.licenseValidUntil,
      licensePaidAt: d.licensePaidAt,
      blocked: d.blocked,
    };
    this.extendMonths = 1;
    this.extendError = '';
  }

  blockUserById(userId: string): void {
    this.blockUser({ id: userId, blocked: false } as AdminUserRow);
  }

  unblockUserById(userId: string): void {
    this.unblockUser({ id: userId, blocked: true } as AdminUserRow);
  }

  closeExtendModal(): void {
    this.extendUser = null;
    this.extendError = '';
  }

  submitExtendLicense(): void {
    const user = this.extendUser;
    if (!user) return;
    const months = this.extendMonths >= 1 && this.extendMonths <= 24 ? this.extendMonths : 1;
    this.extendError = '';
    this.extendingUserId = user.id;
    this.http.post<AdminUserRow>(`${API_URL}/admin/users/${user.id}/extend-license`, { months }).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        const detail = this.selectedUserDetail();
        if (detail?.id === updated.id) {
          this.http.get<AdminUserDetail>(`${API_URL}/admin/users/${updated.id}`).subscribe({
            next: (d) => this.selectedUserDetail.set(d),
          });
        }
        this.extendingUserId = null;
        this.closeExtendModal();
      },
      error: (err) => {
        this.extendingUserId = null;
        this.extendError = err?.error?.message ?? 'Erro ao estender prazo.';
      },
    });
  }

  blockUser(user: AdminUserRow): void {
    if (user.blocked) return;
    this.actionLoadingId = user.id;
    this.http.post<AdminUserRow>(`${API_URL}/admin/users/${user.id}/block`, {}).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        if (this.selectedUserDetail()?.id === user.id) {
          this.http.get<AdminUserDetail>(`${API_URL}/admin/users/${user.id}`).subscribe({
            next: (d) => this.selectedUserDetail.set(d),
          });
        }
        this.actionLoadingId = null;
      },
      error: () => { this.actionLoadingId = null; },
    });
  }

  unblockUser(user: AdminUserRow): void {
    if (!user.blocked) return;
    this.actionLoadingId = user.id;
    this.http.post<AdminUserRow>(`${API_URL}/admin/users/${user.id}/unblock`, {}).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        if (this.selectedUserDetail()?.id === user.id) {
          this.http.get<AdminUserDetail>(`${API_URL}/admin/users/${user.id}`).subscribe({
            next: (d) => this.selectedUserDetail.set(d),
          });
        }
        this.actionLoadingId = null;
      },
      error: () => { this.actionLoadingId = null; },
    });
  }

  formatDate(iso: string | undefined): string {
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
  copyActivationLink(user: AdminUserRow | AdminUserDetail | null): void {
    if (!user?.licenseActivationToken) return;
    const link = this.buildActivationLink(user.licenseActivationToken);
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.copiedForUserId = user.id;
      setTimeout(() => (this.copiedForUserId = null), 2500);
    }).catch(() => {});
  }

  openUserDetail(user: AdminUserRow): void {
    this.detailLoading.set(true);
    this.detailError.set('');
    this.selectedUserDetail.set(null);
    this.http.get<AdminUserDetail>(`${API_URL}/admin/users/${user.id}`).subscribe({
      next: (d) => {
        this.selectedUserDetail.set(d);
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.detailError.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar.');
        this.detailLoading.set(false);
      },
    });
  }

  closeUserDetail(): void {
    this.selectedUserDetail.set(null);
    this.detailError.set('');
  }

  formatDateTime(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  daysSince(first: string | undefined, last: string | undefined): string {
    if (!first || !last) return '—';
    const a = new Date(first).getTime();
    const b = new Date(last).getTime();
    const days = Math.floor((b - a) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Menos de 1 dia';
    if (days === 1) return '1 dia';
    return `${days} dias`;
  }

  /** Período da licença: "1 mês", "2 meses", etc., a partir de paidAt e validUntil. */
  formatLicensePeriod(paidAt: string | undefined, validUntil: string | undefined): string {
    if (!paidAt || !validUntil) return '—';
    const start = new Date(paidAt).getTime();
    const end = new Date(validUntil).getTime();
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (days <= 0) return '—';
    const months = Math.round(days / 30);
    if (months <= 0) return 'Menos de 1 mês';
    if (months === 1) return '1 mês';
    return `${months} meses`;
  }

  /** Ciclo de renovação: data do pagamento e período (ex: "Pago em 04/03/2026 · 1 mês"). */
  formatRenewalCycle(paidAt: string | undefined, validUntil: string | undefined): string {
    if (!paidAt || !validUntil) return '—';
    const paid = this.formatDate(paidAt);
    const period = this.formatLicensePeriod(paidAt, validUntil);
    return `${paid} · ${period}`;
  }

  /** Quanto tempo falta para a licença expirar; "Expirada" se já passou. */
  formatTimeRemaining(validUntil: string | undefined): string {
    if (!validUntil) return '—';
    const end = new Date(validUntil).getTime();
    const now = Date.now();
    const ms = end - now;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expirada';
    if (days === 0) return 'Expira hoje';
    if (days === 1) return '1 dia';
    if (days < 30) return `${days} dias`;
    const months = Math.floor(days / 30);
    if (months === 1) return '1 mês';
    return `${months} meses`;
  }
}
