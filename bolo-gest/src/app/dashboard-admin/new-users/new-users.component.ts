import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';
import { AdminStatsService } from '../../services/admin-stats.service';
import { IconComponent } from '../../ui/icon/icon.component';

/** Utilizador pendente ou rejeitado (licença pending). */
interface NovoUtilizador {
  id: string;
  fullName: string;
  phone: string;
  province?: string;
  email?: string;
  createdAt: string;
  licenseAmount?: number;
  licensePaymentReference?: string;
  rejectedAt?: string;
}

type TabFilter = 'pendentes' | 'rejeitados';

interface SimulatedPaymentPending {
  paymentId: string;
  userId: string;
  userFullName: string;
  userPhone: string;
  amount: number;
  durationMonths: number;
  transactionRef: string;
  createdAt: string;
  simulationChannel?: string;
}

@Component({
  selector: 'app-new-users',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, IconComponent],
  templateUrl: './new-users.component.html',
  styleUrl: './new-users.component.scss',
})
export class NewUsersComponent implements OnInit {
  private http = inject(HttpClient);
  private adminStats = inject(AdminStatsService);

  allLista = signal<NovoUtilizador[]>([]);
  loading = signal(true);
  error = signal('');
  aprovandoId = signal<string | null>(null);
  rejeitandoId = signal<string | null>(null);
  tabFilter = signal<TabFilter>('pendentes');
  searchQuery = signal('');

  pendentes = computed(() => this.allLista().filter((u) => !u.rejectedAt));
  rejeitados = computed(() => this.allLista().filter((u) => u.rejectedAt));
  listaActual = computed(() =>
    this.tabFilter() === 'pendentes' ? this.pendentes() : this.rejeitados()
  );

  filteredLista = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.listaActual();
    if (!q) return list;
    return list.filter((u) =>
      [u.fullName, u.phone, u.email ?? '', u.province ?? '', u.licensePaymentReference ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  });

  modalAprovar = signal<NovoUtilizador | null>(null);
  modalTransactionId = '';
  modalMonths = 1;
  modalError = signal('');

  simulatedPending = signal<SimulatedPaymentPending[]>([]);
  simulatedLoading = signal(false);
  simulatedError = signal('');
  aprovandoSimuladoId = signal<string | null>(null);

  readonly durationOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  ngOnInit(): void {
    this.carregar();
    this.carregarSimulados();
  }

  carregarSimulados(): void {
    this.simulatedLoading.set(true);
    this.simulatedError.set('');
    this.http.get<SimulatedPaymentPending[]>(`${API_URL}/admin/simulated-payments/pending`).subscribe({
      next: (rows) => {
        this.simulatedPending.set(
          (rows ?? []).map((r) => ({
            ...r,
            amount: typeof r.amount === 'number' ? r.amount : Number(r.amount),
          }))
        );
        this.simulatedLoading.set(false);
      },
      error: (err) => {
        this.simulatedError.set(err?.status === 403 ? 'Sem permissão.' : 'Erro ao carregar pagamentos simulados.');
        this.simulatedLoading.set(false);
      },
    });
  }

  aprovarSimulado(p: SimulatedPaymentPending): void {
    this.simulatedError.set('');
    this.aprovandoSimuladoId.set(p.paymentId);
    this.http.post<{ ok: boolean }>(`${API_URL}/admin/simulated-payments/${p.paymentId}/approve`, {}).subscribe({
      next: () => {
        this.simulatedPending.update((list) => list.filter((x) => x.paymentId !== p.paymentId));
        this.allLista.update((list) => list.filter((x) => x.id !== p.userId));
        this.aprovandoSimuladoId.set(null);
        this.adminStats.loadStats();
      },
      error: (err) => {
        this.simulatedError.set(err?.error?.message || 'Erro ao aprovar.');
        this.aprovandoSimuladoId.set(null);
      },
    });
  }

  carregar(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<NovoUtilizadorRaw[]>(`${API_URL}/admin/users`).subscribe({
      next: (users) => {
        const pending = users.filter((u) => !u.admin && u.licenseStatus === 'pending');
        this.allLista.set(
          pending.map((u) => ({
            id: u.id,
            fullName: u.fullName || u.phone || '—',
            phone: u.phone,
            province: u.province,
            email: u.email,
            createdAt: u.createdAt,
            licenseAmount: u.licenseAmount != null ? Number(u.licenseAmount) : undefined,
            licensePaymentReference: u.licensePaymentReference,
            rejectedAt: u.licenseRejectedAt,
          }))
        );
        this.loading.set(false);
        this.adminStats.loadStats();
      },
      error: (err) => {
        this.error.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar.');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: TabFilter): void {
    this.tabFilter.set(tab);
    this.searchQuery.set('');
  }

  abrirModalAprovar(u: NovoUtilizador): void {
    this.modalAprovar.set(u);
    this.modalTransactionId = '';
    this.modalMonths = 1;
    this.modalError.set('');
  }

  fecharModalAprovar(): void {
    this.modalAprovar.set(null);
    this.modalError.set('');
  }

  aprovar(): void {
    const u = this.modalAprovar();
    if (!u) return;
    const txId = this.modalTransactionId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (txId.length !== 18) {
      this.modalError.set('O ID da transacção deve ter exactamente 18 caracteres alfanuméricos (como no e-Mola).');
      return;
    }
    this.aprovandoId.set(u.id);
    this.modalError.set('');
    this.http
      .post<unknown>(`${API_URL}/admin/users/${u.id}/confirm-payment`, {
        eMolaTransactionId: txId,
        durationMonths: this.modalMonths,
      })
      .subscribe({
        next: () => {
          this.allLista.update((l) => l.filter((x) => x.id !== u.id));
          this.aprovandoId.set(null);
          this.fecharModalAprovar();
          this.adminStats.loadStats();
        },
        error: (err) => {
          this.modalError.set(err?.error?.message || err?.status === 400 ? 'ID inválido ou já utilizado.' : 'Erro ao aprovar.');
          this.aprovandoId.set(null);
        },
      });
  }

  rejeitar(u: NovoUtilizador): void {
    this.rejeitandoId.set(u.id);
    this.http.post<unknown>(`${API_URL}/admin/users/${u.id}/reject`, {}).subscribe({
      next: () => {
        this.carregar();
        this.rejeitandoId.set(null);
        this.adminStats.loadStats();
      },
      error: () => {
        this.rejeitandoId.set(null);
      },
    });
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatAmount(amount?: number): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('pt-MZ', { style: 'decimal' }).format(amount) + ' MZN';
  }

  canalSimuladoLabel(channel?: string): string {
    return channel === 'emola' ? 'e-Mola' : 'M-Pesa';
  }

  initials(name: string): string {
    return (name?.charAt(0) || '?').toUpperCase();
  }
}

interface NovoUtilizadorRaw {
  id: string;
  fullName?: string;
  phone: string;
  province?: string;
  email?: string;
  createdAt: string;
  licenseStatus: string;
  licenseAmount?: number | string;
  licensePaymentReference?: string;
  licenseRejectedAt?: string;
  admin?: boolean;
}
