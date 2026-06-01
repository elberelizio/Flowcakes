import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../ui/icon/icon.component';
import type { IconName } from '../../ui/icon/icon-names';
import {
  AdminTreasuryService,
  type OperationalExpense,
  type TreasuryBillingEntry,
  type TreasuryBillingPeriod,
  type TreasuryInvestment,
  type TreasurySuggestion,
  type TreasurySummary,
  type TreasuryTab,
} from '../services/admin-treasury.service';

interface TreasuryTabConfig {
  id: TreasuryTab;
  label: string;
  icon: IconName;
  description: string;
}

@Component({
  selector: 'app-tesouraria',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DecimalPipe, IconComponent],
  templateUrl: './tesouraria.component.html',
  styleUrl: './tesouraria.component.scss',
})
export class TesourariaComponent implements OnInit {
  private readonly treasury = inject(AdminTreasuryService);

  readonly Math = Math;

  activeTab = signal<TreasuryTab>('overview');
  summary = signal<TreasurySummary | null>(null);
  billing = signal<TreasuryBillingEntry[]>([]);
  billingPeriods = signal<TreasuryBillingPeriod[]>([]);
  investments = signal<TreasuryInvestment[]>([]);
  suggestions = signal<TreasurySuggestion[]>([]);
  expenses = signal<OperationalExpense[]>([]);
  payroll = signal<OperationalExpense[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');

  billingYear = signal(new Date().getFullYear());
  billingMonth = signal<number | null>(null);
  billingSearch = signal('');
  expenseSearch = signal('');
  payrollSearch = signal('');
  investmentSearch = signal('');

  expenseForm = {
    title: '',
    category: 'geral',
    amount: 0,
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: '',
  };

  payrollForm = {
    employeeName: '',
    amount: 0,
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: '',
  };

  investmentForm = {
    amount: 0,
    investedAt: new Date().toISOString().slice(0, 10),
    notes: '',
  };

  settingsForm = {
    accountBalance: 50000,
    maintenancePercent: 40,
    fixedExpensesPercent: 15,
    reservePercent: 15,
    payrollPercent: 20,
    toolsPercent: 10,
    payrollHeadcount: 2,
  };

  suggestionEdits = signal<Record<string, Record<string, number>>>({});

  readonly tabs: TreasuryTabConfig[] = [
    { id: 'overview', label: 'Visão geral', icon: 'dashboard', description: 'Métricas e resumo' },
    { id: 'billing', label: 'Faturamento', icon: 'receipt', description: 'Licenças pagas' },
    { id: 'investments', label: 'Investimentos', icon: 'wallet', description: 'Capital injectado' },
    { id: 'allocations', label: 'Alocações', icon: 'percent', description: 'Distribuição do saldo' },
    { id: 'expenses', label: 'Despesas', icon: 'file-text', description: 'Custos operacionais' },
    { id: 'payroll', label: 'Salários', icon: 'user', description: 'Pagamentos da equipa' },
    { id: 'suggestions', label: 'Sugestões', icon: 'alert-circle', description: 'Ajustes automáticos' },
  ];

  readonly bucketLabels: Record<string, string> = {
    maintenance: 'Manutenção / backups',
    fixed: 'Despesas fixas',
    reserve: 'Reserva',
    payroll: 'Salários',
    tools: 'Ferramentas',
  };

  readonly bucketAccents: Record<string, string> = {
    maintenance: 'teal',
    fixed: 'slate',
    reserve: 'amber',
    payroll: 'indigo',
    tools: 'violet',
  };

  readonly categories = [
    { id: 'geral', label: 'Geral' },
    { id: 'hosting', label: 'Hosting / Infra' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'suporte', label: 'Suporte' },
    { id: 'salarios', label: 'Salários' },
    { id: 'impostos', label: 'Impostos' },
    { id: 'outro', label: 'Outro' },
  ];

  readonly monthOptions = [
    { value: null, label: 'Todos os meses' },
    ...['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((label, i) => ({
      value: i + 1,
      label,
    })),
  ];

  readonly billingYears = computed(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  });

  allocationPercentSum = computed(() => {
    const f = this.settingsForm;
    return f.maintenancePercent + f.fixedExpensesPercent + f.reservePercent + f.payrollPercent + f.toolsPercent;
  });

  filteredBilling = computed(() => this.filterRows(this.billing(), this.billingSearch(), (b) =>
    [b.invoiceNumber, b.customerName, b.customerPhone, b.paymentReference].join(' ')
  ));

  filteredExpenses = computed(() => this.filterRows(this.expenses(), this.expenseSearch(), (e) =>
    [e.title, this.categoryLabel(e.category), e.notes ?? ''].join(' ')
  ));

  filteredPayroll = computed(() => this.filterRows(this.payroll(), this.payrollSearch(), (e) =>
    [e.title, e.notes ?? ''].join(' ')
  ));

  filteredInvestments = computed(() => this.filterRows(this.investments(), this.investmentSearch(), (inv) =>
    [inv.notes ?? '', inv.investedAt, String(inv.amount)].join(' ')
  ));

  needsSetup = computed(() => {
    const s = this.summary();
    return !!s && s.accountBalance <= 0 && s.totalInvested <= 0;
  });

  ngOnInit(): void {
    this.reload();
  }

  setTab(tab: TreasuryTab): void {
    this.activeTab.set(tab);
    this.error.set('');
    if (tab === 'billing') this.loadBilling();
    if (tab === 'suggestions') this.loadSuggestions(true);
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.treasury.getSummary().subscribe({
      next: (s) => {
        this.summary.set(s);
        this.applySettingsFromSummary(s);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar tesouraria.');
        this.loading.set(false);
      },
    });
    this.treasury.listInvestments().subscribe({
      next: (list) => this.investments.set(list ?? []),
    });
    this.treasury.listExpenses().subscribe({
      next: (list) => this.expenses.set(list ?? []),
    });
    this.treasury.listExpenses('salarios').subscribe({
      next: (list) => this.payroll.set(list ?? []),
    });
    this.loadBilling();
    this.loadSuggestions(false);
  }

  applySettingsFromSummary(s: TreasurySummary): void {
    this.settingsForm.accountBalance = s.accountBalance;
    this.settingsForm.payrollHeadcount = s.payrollHeadcount;
    const buckets = s.allocationBuckets ?? [];
    const pct = (key: string, fallback: number) => buckets.find((b) => b.key === key)?.percent ?? fallback;
    this.settingsForm.maintenancePercent = pct('maintenance', 40);
    this.settingsForm.fixedExpensesPercent = pct('fixed', 15);
    this.settingsForm.reservePercent = pct('reserve', 15);
    this.settingsForm.payrollPercent = pct('payroll', 20);
    this.settingsForm.toolsPercent = pct('tools', 10);
  }

  loadBilling(): void {
    const year = this.billingYear();
    const month = this.billingMonth();
    this.treasury.listBilling(year, month ?? undefined).subscribe({
      next: (list) => this.billing.set(list ?? []),
    });
    this.treasury.listBillingPeriods(year).subscribe({
      next: (list) => this.billingPeriods.set(list ?? []),
    });
  }

  onBillingFilterChange(): void {
    this.loadBilling();
  }

  loadSuggestions(refresh: boolean): void {
    this.treasury.listSuggestions(refresh).subscribe({
      next: (list) => {
        this.suggestions.set(list ?? []);
        const edits: Record<string, Record<string, number>> = {};
        for (const s of list ?? []) {
          edits[s.id] = { ...s.proposedAllocations };
        }
        this.suggestionEdits.set(edits);
      },
    });
  }

  saveSettings(): void {
    if (this.allocationPercentSum() > 100) {
      this.error.set('A soma das percentagens não pode exceder 100%.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.treasury.updateSettings({ ...this.settingsForm }).subscribe({
      next: () => {
        this.saving.set(false);
        this.reload();
      },
      error: () => {
        this.error.set('Erro ao guardar alocações.');
        this.saving.set(false);
      },
    });
  }

  submitInvestment(): void {
    if (this.investmentForm.amount <= 0) {
      this.error.set('Indique o valor do investimento.');
      return;
    }
    this.saving.set(true);
    this.treasury
      .createInvestment({
        amount: this.investmentForm.amount,
        investedAt: this.investmentForm.investedAt,
        notes: this.investmentForm.notes.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.investmentForm.amount = 0;
          this.investmentForm.notes = '';
          this.saving.set(false);
          this.reload();
        },
        error: () => {
          this.error.set('Erro ao registar investimento.');
          this.saving.set(false);
        },
      });
  }

  deleteInvestment(id: string): void {
    if (!confirm('Eliminar este investimento?')) return;
    this.treasury.deleteInvestment(id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Erro ao eliminar investimento.'),
    });
  }

  approveSuggestion(s: TreasurySuggestion): void {
    const edits = this.suggestionEdits()[s.id] ?? s.proposedAllocations;
    this.treasury.approveSuggestion(s.id, edits).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Erro ao aprovar sugestão.'),
    });
  }

  rejectSuggestion(id: string): void {
    this.treasury.rejectSuggestion(id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Erro ao rejeitar sugestão.'),
    });
  }

  getSuggestionAlloc(s: TreasurySuggestion, key: string): number {
    return this.suggestionEdits()[s.id]?.[key] ?? s.proposedAllocations[key] ?? 0;
  }

  setSuggestionAlloc(s: TreasurySuggestion, key: string, value: number): void {
    const current = { ...this.suggestionEdits() };
    current[s.id] = { ...(current[s.id] ?? s.proposedAllocations), [key]: value };
    this.suggestionEdits.set(current);
  }

  submitExpense(): void {
    if (!this.expenseForm.title.trim() || this.expenseForm.amount <= 0) {
      this.error.set('Preencha descrição e valor.');
      return;
    }
    this.saving.set(true);
    this.treasury
      .createExpense({
        title: this.expenseForm.title.trim(),
        category: this.expenseForm.category,
        amount: this.expenseForm.amount,
        expenseDate: this.expenseForm.expenseDate,
        notes: this.expenseForm.notes.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.expenseForm.title = '';
          this.expenseForm.amount = 0;
          this.expenseForm.notes = '';
          this.saving.set(false);
          this.reload();
        },
        error: () => {
          this.error.set('Não foi possível registar a despesa.');
          this.saving.set(false);
        },
      });
  }

  submitPayroll(): void {
    if (!this.payrollForm.employeeName.trim() || this.payrollForm.amount <= 0) {
      this.error.set('Preencha colaborador e valor.');
      return;
    }
    this.saving.set(true);
    const name = this.payrollForm.employeeName.trim();
    this.treasury
      .createExpense({
        title: `Salário — ${name}`,
        category: 'salarios',
        amount: this.payrollForm.amount,
        expenseDate: this.payrollForm.expenseDate,
        notes: this.payrollForm.notes.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.payrollForm.employeeName = '';
          this.payrollForm.amount = 0;
          this.payrollForm.notes = '';
          this.saving.set(false);
          this.reload();
        },
        error: () => {
          this.error.set('Não foi possível registar o pagamento.');
          this.saving.set(false);
        },
      });
  }

  deleteExpense(id: string): void {
    if (!confirm('Eliminar este registo?')) return;
    this.treasury.deleteExpense(id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Erro ao eliminar.'),
    });
  }

  bucketAccent(key: string): string {
    return this.bucketAccents[key] ?? 'slate';
  }

  bucketSpentPct(allocated: number, spent: number): number {
    if (allocated <= 0) return 0;
    return Math.min(100, Math.round((spent / allocated) * 100));
  }

  formatMonth(ym: string | null | undefined): string {
    if (!ym || ym.length < 7) return '—';
    const [, m] = ym.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(m, 10) - 1] ?? m} ${ym.slice(0, 4)}`;
  }

  profitClass(v: number): string {
    return v >= 0 ? 'positive' : 'negative';
  }

  roiLabel(status: string): string {
    if (status === 'profit') return 'Lucrativo';
    if (status === 'break_even') return 'Ponto de equilíbrio';
    return 'Em prejuízo';
  }

  roiClass(status: string): string {
    if (status === 'profit') return 'roi-profit';
    if (status === 'break_even') return 'roi-even';
    return 'roi-loss';
  }

  categoryLabel(id: string): string {
    return this.categories.find((c) => c.id === id)?.label ?? id;
  }

  bucketLabel(key: string): string {
    return this.bucketLabels[key] ?? key;
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso.includes('T') ? iso : iso + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatDateTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private filterRows<T>(rows: T[], query: string, textFn: (row: T) => string): T[] {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => textFn(row).toLowerCase().includes(q));
  }
}
