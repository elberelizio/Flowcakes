import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';

export type LicenseStatusFilter = 'active' | 'pending' | 'expired' | 'none';

export interface ProfileRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  admin: boolean;
  licenseStatus: LicenseStatusFilter;
  validUntil: string | null;
  blocked: boolean;
  createdAt: string;
}

type RoleFilter = 'all' | 'users' | 'admins';
type AccountStateFilter = 'all' | 'active' | 'blocked';
type LicenseFilter = 'all' | 'active' | 'pending' | 'expired';

@Component({
  selector: 'app-profile-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile-management.component.html',
  styleUrl: './profile-management.component.scss',
})
export class ProfileManagementComponent implements OnInit {
  private http = inject(HttpClient);

  rows = signal<ProfileRow[]>([]);
  loading = signal(true);
  error = signal('');
  searchQuery = signal('');
  openProfile = signal<ProfileRow | null>(null);
  actionLoadingId = signal<string | null>(null);

  filterRole = signal<RoleFilter>('all');
  filterAccountState = signal<AccountStateFilter>('all');
  filterLicense = signal<LicenseFilter>('all');
  startDate = signal('');
  endDate = signal('');

  filteredList = computed(() => {
    let list = this.rows();
    const q = this.searchQuery().trim().toLowerCase();
    const role = this.filterRole();
    const accountState = this.filterAccountState();
    const license = this.filterLicense();
    const rangeStart = this.startDate().trim();
    const rangeEnd = this.endDate().trim();

    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
          (p.email && p.email.toLowerCase().includes(q)),
      );
    }

    if (role === 'users') list = list.filter((p) => !p.admin);
    if (role === 'admins') list = list.filter((p) => p.admin);

    if (accountState === 'active') list = list.filter((p) => !p.blocked);
    if (accountState === 'blocked') list = list.filter((p) => p.blocked);

    if (license === 'active') list = list.filter((p) => p.licenseStatus === 'active');
    if (license === 'pending') list = list.filter((p) => p.licenseStatus === 'pending');
    if (license === 'expired') list = list.filter((p) => p.licenseStatus === 'expired');

    if (rangeStart) {
      const start = new Date(rangeStart).setHours(0, 0, 0, 0);
      list = list.filter((p) => new Date(p.createdAt).getTime() >= start);
    }
    if (rangeEnd) {
      const end = new Date(rangeEnd).setHours(23, 59, 59, 999);
      list = list.filter((p) => new Date(p.createdAt).getTime() <= end);
    }

    return list;
  });

  clearFilters(): void {
    this.filterRole.set('all');
    this.filterAccountState.set('all');
    this.filterLicense.set('all');
    this.startDate.set('');
    this.endDate.set('');
    this.searchQuery.set('');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<AdminUserRaw[]>(`${API_URL}/admin/users`).subscribe({
      next: (users) => {
        this.rows.set(users.map((u) => this.toProfileRow(u)));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar.');
        this.loading.set(false);
      },
    });
  }

  private toProfileRow(u: AdminUserRaw): ProfileRow {
    let licenseStatus: LicenseStatusFilter = 'none';
    let validUntil: string | null = null;
    if (!u.admin && u.licenseStatus) {
      const validUntilMs = u.licenseValidUntil ? new Date(u.licenseValidUntil).getTime() : null;
      const now = Date.now();
      if (u.licenseStatus === 'paid' || u.licenseStatus === 'trial') {
        if (validUntilMs && validUntilMs > now) licenseStatus = 'active';
        else if (validUntilMs && validUntilMs <= now) licenseStatus = 'expired';
        else licenseStatus = 'active';
      } else {
        licenseStatus = 'pending';
      }
      if (u.licenseValidUntil) validUntil = u.licenseValidUntil;
    }
    return {
      id: u.id,
      name: u.fullName || u.phone || '—',
      phone: u.phone,
      email: u.email || '',
      admin: !!u.admin,
      licenseStatus,
      validUntil,
      blocked: !!u.blocked,
      createdAt: u.createdAt || new Date().toISOString(),
    };
  }

  showProfile(p: ProfileRow): void {
    this.openProfile.set(p);
  }

  closeProfile(): void {
    this.openProfile.set(null);
  }

  blockUser(p: ProfileRow): void {
    if (p.admin) return;
    this.actionLoadingId.set(p.id);
    this.http.post<unknown>(`${API_URL}/admin/users/${p.id}/block`, {}).subscribe({
      next: () => {
        this.rows.update((l) => l.map((u) => (u.id === p.id ? { ...u, blocked: true } : u)));
        this.openProfile.update((d) => (d?.id === p.id ? { ...d, blocked: true } : d));
        this.actionLoadingId.set(null);
      },
      error: () => this.actionLoadingId.set(null),
    });
  }

  unblockUser(p: ProfileRow): void {
    this.actionLoadingId.set(p.id);
    this.http.post<unknown>(`${API_URL}/admin/users/${p.id}/unblock`, {}).subscribe({
      next: () => {
        this.rows.update((l) => l.map((u) => (u.id === p.id ? { ...u, blocked: false } : u)));
        this.openProfile.update((d) => (d?.id === p.id ? { ...d, blocked: false } : d));
        this.actionLoadingId.set(null);
      },
      error: () => this.actionLoadingId.set(null),
    });
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getLicenseLabel(status: LicenseStatusFilter): string {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'pending':
        return 'Pendente';
      case 'expired':
        return 'Expirada';
      default:
        return '—';
    }
  }
}

interface AdminUserRaw {
  id: string;
  fullName?: string;
  phone: string;
  email?: string;
  admin?: boolean;
  licenseStatus?: string;
  licenseValidUntil?: string;
  blocked?: boolean;
  createdAt?: string;
}
