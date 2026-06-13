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
type MainTab = 'transferencias' | 'registos';

interface RejectionReasonOption {
  id: string;
  label: string;
}

interface SimulatedPaymentPending {
  paymentId: string;
  userId: string;
  userFullName: string;
  userPhone: string;
  amount: number;
  durationMonths: number;
  /** Ref. interna Flow Cakes (auto). */
  transactionRef: string;
  userTransferReference?: string;
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
  mainTab = signal<MainTab>('transferencias');
  tabFilter = signal<TabFilter>('pendentes');
  searchQuery = signal('');
  showFilters = signal(false);

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
  rejeitandoSimuladoId = signal<string | null>(null);
  modalRejeitarSim = signal<SimulatedPaymentPending | null>(null);
  modalAprovarSim = signal<SimulatedPaymentPending | null>(null);
  approveOperatorRef = '';
  approveSimModalError = signal('');
  rejectReasonId = signal('valor_nao_recebido');
  rejectReasonCustom = signal('');
  rejectModalError = signal('');

  readonly durationOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  /** Últimos dígitos do ID da transação no SMS M-Pesa / e-Mola. */
  readonly operatorSmsDigits = 6;
  readonly rejectionReasons: RejectionReasonOption[] = [
    { id: 'valor_nao_recebido', label: 'Valor não recebido na conta Flow Cakes' },
    { id: 'valor_incorreto', label: 'Valor transferido não corresponde ao pedido' },
    { id: 'referencia_invalida', label: 'Referência ou comprovativo inválido' },
    { id: 'outro', label: 'Outro motivo' },
  ];

  ngOnInit(): void {
    this.carregar();
    this.carregarSimulados();
  }

  setMainTab(tab: MainTab): void {
    this.mainTab.set(tab);
  }

  carregarSimulados(): void {
    this.simulatedLoading.set(true);
    this.simulatedError.set('');
    this.http.get<SimulatedPaymentPending[]>(`${API_URL}/admin/simulated-payments/pending`).subscribe({
      next: (rows) => {
        const list = (rows ?? []).map((r) => ({
          ...r,
          amount: typeof r.amount === 'number' ? r.amount : Number(r.amount),
        }));
        this.simulatedPending.set(list);
        if (list.length > 0) {
          this.mainTab.set('transferencias');
        }
        this.simulatedLoading.set(false);
      },
      error: (err) => {
        this.simulatedError.set(err?.status === 403 ? 'Sem permissão.' : 'Erro ao carregar pagamentos simulados.');
        this.simulatedLoading.set(false);
      },
    });
  }

  abrirRejeitarSimulado(p: SimulatedPaymentPending): void {
    this.modalRejeitarSim.set(p);
    this.rejectReasonId.set('valor_nao_recebido');
    this.rejectReasonCustom.set('');
    this.rejectModalError.set('');
  }

  fecharRejeitarSimulado(): void {
    this.modalRejeitarSim.set(null);
    this.rejectModalError.set('');
  }

  selectRejectReason(id: string): void {
    this.rejectReasonId.set(id);
    this.rejectModalError.set('');
  }

  private buildRejectReasonText(): string {
    const id = this.rejectReasonId();
    if (id === 'outro') {
      return this.rejectReasonCustom().trim();
    }
    return this.rejectionReasons.find((r) => r.id === id)?.label ?? '';
  }

  confirmarRejeitarSimulado(): void {
    const p = this.modalRejeitarSim();
    if (!p) return;
    const reason = this.buildRejectReasonText();
    if (!reason) {
      this.rejectModalError.set('Indique o motivo da rejeição.');
      return;
    }
    this.rejectModalError.set('');
    this.rejeitandoSimuladoId.set(p.paymentId);
    this.http
      .post<{ ok: boolean }>(`${API_URL}/admin/simulated-payments/${p.paymentId}/reject`, { reason })
      .subscribe({
        next: () => {
          this.simulatedPending.update((list) => list.filter((x) => x.paymentId !== p.paymentId));
          this.rejeitandoSimuladoId.set(null);
          this.fecharRejeitarSimulado();
          this.adminStats.loadStats();
        },
        error: (err) => {
          this.simulatedError.set(err?.error?.message || 'Erro ao rejeitar transferência.');
          this.rejeitandoSimuladoId.set(null);
        },
      });
  }

  abrirAprovarSimulado(p: SimulatedPaymentPending): void {
    this.modalAprovarSim.set(p);
    this.approveOperatorRef = '';
    this.approveSimModalError.set('');
  }

  fecharAprovarSimulado(): void {
    this.modalAprovarSim.set(null);
    this.approveSimModalError.set('');
  }

  /** Impede fechar o popup ao clicar no fundo escuro. */
  bloquearFecharBackdrop(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
  }

  onApproveOperatorRefChange(raw: string): void {
    const digits = raw.replace(/\D/g, '').slice(0, this.operatorSmsDigits);
    this.approveOperatorRef = digits;
    if (this.approveSimModalError()) {
      this.approveSimModalError.set('');
    }
  }

  confirmarAprovarSimulado(): void {
    const p = this.modalAprovarSim();
    if (!p) return;
    const digits = this.approveOperatorRef.replace(/\D/g, '');
    if (digits.length !== this.operatorSmsDigits) {
      this.approveSimModalError.set(`Indique exactamente ${this.operatorSmsDigits} dígitos (últimos do ID no SMS).`);
      return;
    }
    this.approveSimModalError.set('');
    this.aprovandoSimuladoId.set(p.paymentId);
    this.http
      .post<{ ok: boolean }>(`${API_URL}/admin/simulated-payments/${p.paymentId}/approve`, {
        operatorTransactionRef: digits,
      })
      .subscribe({
        next: () => {
          this.simulatedPending.update((list) => list.filter((x) => x.paymentId !== p.paymentId));
          this.allLista.update((list) => list.filter((x) => x.id !== p.userId));
          this.aprovandoSimuladoId.set(null);
          this.fecharAprovarSimulado();
          this.adminStats.loadStats();
        },
        error: (err) => {
          this.approveSimModalError.set(err?.error?.message || 'Erro ao aprovar.');
          this.aprovandoSimuladoId.set(null);
        },
      });
  }

  shortPaymentId(paymentId: string): string {
    const clean = paymentId.replace(/-/g, '').toUpperCase();
    return clean.length >= 8 ? clean.slice(0, 8) : clean;
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

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
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
