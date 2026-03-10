import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/api.config';

export interface PerfilRow {
  id: string;
  nome: string;
  contacto: string;
  email: string;
  admin: boolean;
  licencaEstado: 'activa' | 'pendente' | 'expirada' | 'nula';
  validaAte: string | null;
  bloqueado: boolean;
  createdAt: string;
}

type FiltroTipo = 'todos' | 'utilizadores' | 'administradores';
type FiltroEstado = 'todos' | 'activo' | 'bloqueado';
type FiltroLicenca = 'todos' | 'activa' | 'pendente' | 'expirada';

@Component({
  selector: 'app-gestao-perfis',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './gestao-perfis.component.html',
  styleUrl: './gestao-perfis.component.scss',
})
export class GestaoPerfisComponent implements OnInit {
  private http = inject(HttpClient);

  lista = signal<PerfilRow[]>([]);
  loading = signal(true);
  error = signal('');
  pesquisa = signal('');
  perfilAberto = signal<PerfilRow | null>(null);
  actionLoadingId = signal<string | null>(null);

  filtroTipo = signal<FiltroTipo>('todos');
  filtroEstado = signal<FiltroEstado>('todos');
  filtroLicenca = signal<FiltroLicenca>('todos');
  dataInicial = signal('');
  dataFim = signal('');

  filteredList = computed(() => {
    let list = this.lista();
    const q = this.pesquisa().trim().toLowerCase();
    const tipo = this.filtroTipo();
    const estado = this.filtroEstado();
    const licenca = this.filtroLicenca();
    const dataIni = this.dataInicial().trim();
    const dataFim = this.dataFim().trim();

    if (q) {
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.contacto.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
          (p.email && p.email.toLowerCase().includes(q))
      );
    }

    if (tipo === 'utilizadores') list = list.filter((p) => !p.admin);
    if (tipo === 'administradores') list = list.filter((p) => p.admin);

    if (estado === 'activo') list = list.filter((p) => !p.bloqueado);
    if (estado === 'bloqueado') list = list.filter((p) => p.bloqueado);

    if (licenca === 'activa') list = list.filter((p) => p.licencaEstado === 'activa');
    if (licenca === 'pendente') list = list.filter((p) => p.licencaEstado === 'pendente');
    if (licenca === 'expirada') list = list.filter((p) => p.licencaEstado === 'expirada');

    if (dataIni) {
      const ini = new Date(dataIni).setHours(0, 0, 0, 0);
      list = list.filter((p) => new Date(p.createdAt).getTime() >= ini);
    }
    if (dataFim) {
      const fim = new Date(dataFim).setHours(23, 59, 59, 999);
      list = list.filter((p) => new Date(p.createdAt).getTime() <= fim);
    }

    return list;
  });

  limparFiltros(): void {
    this.filtroTipo.set('todos');
    this.filtroEstado.set('todos');
    this.filtroLicenca.set('todos');
    this.dataInicial.set('');
    this.dataFim.set('');
    this.pesquisa.set('');
  }

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<AdminUserRaw[]>(`${API_URL}/admin/users`).subscribe({
      next: (users) => {
        this.lista.set(users.map((u) => this.toPerfilRow(u)));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar.');
        this.loading.set(false);
      },
    });
  }

  private toPerfilRow(u: AdminUserRaw): PerfilRow {
    let licencaEstado: PerfilRow['licencaEstado'] = 'nula';
    let validaAte: string | null = null;
    if (!u.admin && u.licenseStatus) {
      const validUntil = u.licenseValidUntil ? new Date(u.licenseValidUntil).getTime() : null;
      const now = Date.now();
      if (u.licenseStatus === 'paid') {
        if (validUntil && validUntil > now) licencaEstado = 'activa';
        else if (validUntil && validUntil <= now) licencaEstado = 'expirada';
        else licencaEstado = 'activa';
      } else {
        licencaEstado = 'pendente';
      }
      if (u.licenseValidUntil) validaAte = u.licenseValidUntil;
    }
    return {
      id: u.id,
      nome: u.fullName || u.phone || '—',
      contacto: u.phone,
      email: u.email || '',
      admin: !!u.admin,
      licencaEstado,
      validaAte,
      bloqueado: !!u.blocked,
      createdAt: u.createdAt || new Date().toISOString(),
    };
  }

  abrirPerfil(p: PerfilRow): void {
    this.perfilAberto.set(p);
  }

  fecharPerfil(): void {
    this.perfilAberto.set(null);
  }

  bloquear(p: PerfilRow): void {
    if (p.admin) return;
    this.actionLoadingId.set(p.id);
    this.http.post<unknown>(`${API_URL}/admin/users/${p.id}/block`, {}).subscribe({
      next: () => {
        this.lista.update((l) => l.map((u) => (u.id === p.id ? { ...u, bloqueado: true } : u)));
        this.perfilAberto.update((d) => (d?.id === p.id ? { ...d, bloqueado: true } : d));
        this.actionLoadingId.set(null);
      },
      error: () => this.actionLoadingId.set(null),
    });
  }

  desbloquear(p: PerfilRow): void {
    this.actionLoadingId.set(p.id);
    this.http.post<unknown>(`${API_URL}/admin/users/${p.id}/unblock`, {}).subscribe({
      next: () => {
        this.lista.update((l) => l.map((u) => (u.id === p.id ? { ...u, bloqueado: false } : u)));
        this.perfilAberto.update((d) => (d?.id === p.id ? { ...d, bloqueado: false } : d));
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

  getLicencaLabel(estado: PerfilRow['licencaEstado']): string {
    switch (estado) {
      case 'activa': return 'Activa';
      case 'pendente': return 'Pendente';
      case 'expirada': return 'Expirada';
      default: return '—';
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
