import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';
import { IconComponent } from '../../ui/icon/icon.component';
import type { IconName } from '../../ui/icon/icon-names';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  audience?: string;
  createdAt: string;
  expiresAt?: string;
  maintenanceStartAt?: string;
  maintenanceEndAt?: string;
  active: boolean;
  maintenancePhase?: string;
}

type NotifyMode = 'maintenance';
type PageSection = 'broadcast' | 'operations';
export type MaintenanceTemplate = 'standard' | 'new_features';

export interface BroadcastTemplate {
  id: string;
  category: NotifyMode;
  title: string;
  message?: string;
  maintenanceTemplate?: MaintenanceTemplate;
  type?: string;
  maintenanceStartAt?: string;
  maintenanceEndAt?: string;
  source: 'history' | 'suggestion';
  label: string;
}

const MAINTENANCE_TITLE_PLACEHOLDER = 'Ex.: Manutenção do fluxo de pagamento das licenças';

const BUILT_IN_TEMPLATES: BroadcastTemplate[] = [
  {
    id: 'sug-maint-general',
    category: 'maintenance',
    title: 'Manutenção programada do sistema',
    maintenanceTemplate: 'standard',
    source: 'suggestion',
    label: 'Manutenção geral',
  },
  {
    id: 'sug-maint-features',
    category: 'maintenance',
    title: 'Novas funcionalidades',
    maintenanceTemplate: 'new_features',
    source: 'suggestion',
    label: 'Novas funcionalidades',
  },
  {
    id: 'sug-maint-payment',
    category: 'maintenance',
    title: 'Manutenção do fluxo de pagamento das licenças',
    maintenanceTemplate: 'standard',
    source: 'suggestion',
    label: 'Pagamento de licenças',
  },
];

const MAINTENANCE_MESSAGE_LABELS: Record<MaintenanceTemplate, string> = {
  standard: 'Manutenção do sistema — estaremos em manutenção',
  new_features: 'Novas funcionalidades — estamos a implementar melhorias pedidas',
};

const QUICK_CHIPS = BUILT_IN_TEMPLATES.filter((t) => t.category === 'maintenance');

@Component({
  selector: 'app-notification-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './notification-management.component.html',
  styleUrl: './notification-management.component.scss',
})
export class NotificationManagementComponent implements OnInit {
  private http = inject(HttpClient);

  readonly pageSize = 5;
  readonly quickChips = QUICK_CHIPS;

  pageSection = signal<PageSection>('broadcast');
  broadcasts = signal<SystemNotification[]>([]);
  operations = signal<SystemNotification[]>([]);
  expandedId = signal<string | null>(null);
  loading = signal(true);
  error = signal('');
  creating = signal(false);
  createError = signal('');

  broadcastPage = signal(1);
  operationsPage = signal(1);

  readonly titlePlaceholder = MAINTENANCE_TITLE_PLACEHOLDER;

  title = '';
  maintenanceStart = '';
  maintenanceEnd = '';
  maintenanceTemplate: MaintenanceTemplate = 'standard';

  readonly maintenanceMessageOptions = Object.entries(MAINTENANCE_MESSAGE_LABELS).map(([value, label]) => ({
    value: value as MaintenanceTemplate,
    label,
  }));

  readonly previewMessage = computed(() => {
    const start = this.maintenanceStart?.trim();
    const end = this.maintenanceEnd?.trim();
    if (!start || !end) return '';
    return this.buildMaintenancePreview(start, end, this.maintenanceTemplate);
  });

  readonly statsTotal = computed(() => this.broadcasts().length);
  readonly statsActive = computed(() => this.broadcasts().filter((n) => n.active).length);
  readonly publishedToday = computed(() => {
    const today = new Date().toDateString();
    return this.broadcasts().filter((n) => new Date(n.createdAt).toDateString() === today).length;
  });

  readonly activeOperations = computed(() => this.operations().filter((n) => n.active));

  readonly broadcastTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.broadcasts().length / this.pageSize))
  );

  readonly operationsTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.operations().length / this.pageSize))
  );

  readonly broadcastPageList = computed(() => this.pageList(this.broadcastTotalPages(), this.broadcastPage()));
  readonly operationsPageList = computed(() => this.pageList(this.operationsTotalPages(), this.operationsPage()));

  readonly paginatedBroadcasts = computed(() => {
    const start = (this.broadcastPage() - 1) * this.pageSize;
    return this.broadcasts().slice(start, start + this.pageSize);
  });

  readonly paginatedOperations = computed(() => {
    const start = (this.operationsPage() - 1) * this.pageSize;
    return this.operations().slice(start, start + this.pageSize);
  });

  readonly broadcastRangeLabel = computed(() =>
    this.paginationLabel(this.broadcasts().length, this.broadcastPage())
  );

  readonly operationsRangeLabel = computed(() =>
    this.paginationLabel(this.operations().length, this.operationsPage())
  );

  ngOnInit(): void {
    this.load();
  }

  get todayMin(): string {
    return this.todayInputValue();
  }

  get maintenanceEndMin(): string {
    const today = this.todayInputValue();
    const start = this.maintenanceStart?.trim();
    if (start && start >= today) return start;
    return today;
  }

  get maintenanceStartMax(): string | undefined {
    const end = this.maintenanceEnd?.trim();
    return end || undefined;
  }

  onMaintenanceStartChange(): void {
    this.normalizeMaintenanceDates();
    this.createError.set('');
  }

  onMaintenanceEndChange(): void {
    this.normalizeMaintenanceDates();
    this.createError.set('');
  }

  setPageSection(section: PageSection): void {
    this.pageSection.set(section);
    this.createError.set('');
    this.expandedId.set(null);
  }

  applyTemplate(template: BroadcastTemplate): void {
    this.createError.set('');
    this.title = template.title;
    if (template.maintenanceTemplate) {
      this.maintenanceTemplate = template.maintenanceTemplate;
    }
    if (template.maintenanceStartAt) {
      this.maintenanceStart = this.toDateInputValue(template.maintenanceStartAt);
    }
    if (template.maintenanceEndAt) {
      this.maintenanceEnd = this.toDateInputValue(template.maintenanceEndAt);
    } else if (!this.maintenanceStart) {
      this.maintenanceStart = this.todayInputValue();
      this.maintenanceEnd = this.addDaysInputValue(this.todayInputValue(), 1);
    }
    this.normalizeMaintenanceDates();
  }

  cancelForm(): void {
    this.title = '';
    this.maintenanceStart = '';
    this.maintenanceEnd = '';
    this.maintenanceTemplate = 'standard';
    this.createError.set('');
  }

  categoryIcon(n: SystemNotification): IconName {
    if (n.category === 'maintenance') return 'alert-circle';
    return 'file-text';
  }

  statusTone(n: SystemNotification): string {
    if (!n.active) return 'muted';
    if (n.category === 'maintenance') {
      if (n.maintenancePhase === 'active') return 'live';
      if (n.maintenancePhase === 'scheduled') return 'scheduled';
    }
    return n.active ? 'active' : 'muted';
  }

  goBroadcastPage(page: number): void {
    const p = Math.min(Math.max(1, page), this.broadcastTotalPages());
    this.broadcastPage.set(p);
    this.expandedId.set(null);
  }

  goOperationsPage(page: number): void {
    const p = Math.min(Math.max(1, page), this.operationsTotalPages());
    this.operationsPage.set(p);
    this.expandedId.set(null);
  }

  formatDateParts(iso: string): { date: string; time: string } {
    if (!iso) return { date: '—', time: '' };
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  formatPeriodParts(n: SystemNotification): { start: string; end: string } | null {
    if (!n.maintenanceStartAt || !n.maintenanceEndAt) return null;
    return {
      start: new Date(n.maintenanceStartAt).toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      end: new Date(n.maintenanceEndAt).toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    };
  }

  private pageList(totalPages: number, current: number): number[] {
    const pages: number[] = [];
    const start = Math.max(1, Math.min(current - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  private paginationLabel(total: number, page: number): string {
    if (total === 0) return 'Nenhum registo';
    const start = (page - 1) * this.pageSize + 1;
    const end = Math.min(page * this.pageSize, total);
    return `Mostrando ${start}–${end} de ${total} registos`;
  }

  private buildMaintenancePreview(start: string, end: string, template: MaintenanceTemplate): string {
    const fmt = (d: string) =>
      new Date(d + 'T12:00:00').toLocaleDateString('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' });
    const period = `${fmt(start)} a ${fmt(end)}`;
    if (template === 'new_features') {
      return `Estimados clientes, estaremos em manutenção de ${period} para implementar novas funcionalidades pedidas. Agradecemos a compreensão.`;
    }
    return `Estimados clientes, o Chef Control estará em manutenção de ${period}. Durante este período algumas funções podem ficar indisponíveis.`;
  }

  private toDateInputValue(iso: string): string {
    if (!iso) return '';
    if (iso.length >= 10) return iso.slice(0, 10);
    return '';
  }

  private todayInputValue(): string {
    return this.formatDateInput(new Date());
  }

  private addDaysInputValue(base: string, days: number): string {
    const d = this.parseDateInput(base);
    d.setDate(d.getDate() + days);
    return this.formatDateInput(d);
  }

  private formatDateInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseDateInput(value: string): Date {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private normalizeMaintenanceDates(): void {
    const today = this.todayInputValue();

    if (this.maintenanceStart && this.maintenanceStart < today) {
      this.maintenanceStart = today;
    }

    const endMin = this.maintenanceEndMin;
    if (this.maintenanceEnd && this.maintenanceEnd < endMin) {
      this.maintenanceEnd = endMin;
    }

    if (this.maintenanceStart && this.maintenanceEnd && this.maintenanceEnd < this.maintenanceStart) {
      this.maintenanceEnd = this.maintenanceStart;
    }
  }

  private validateMaintenanceDates(): string | null {
    if (!this.maintenanceStart?.trim() || !this.maintenanceEnd?.trim()) {
      return 'Indique o período de manutenção.';
    }

    const today = this.todayInputValue();
    if (this.maintenanceStart < today) {
      return 'A data de início não pode ser anterior a hoje.';
    }
    if (this.maintenanceEnd < today) {
      return 'A data de fim não pode ser anterior a hoje.';
    }
    if (this.maintenanceEnd < this.maintenanceStart) {
      return 'A data de fim não pode ser anterior à data de início.';
    }
    return null;
  }

  toggleExpand(id: string): void {
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  messagePreview(text: string, max = 90): string {
    const t = (text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return t.slice(0, max).trimEnd() + '…';
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<SystemNotification[]>(`${API_URL}/admin/notifications`).subscribe({
      next: (broadcasts) => {
        this.broadcasts.set(broadcasts ?? []);
        this.broadcastPage.set(1);
        this.http.get<SystemNotification[]>(`${API_URL}/admin/notifications/operations`).subscribe({
          next: (ops) => {
            this.operations.set(ops ?? []);
            this.operationsPage.set(1);
            this.loading.set(false);
          },
          error: () => {
            this.operations.set([]);
            this.operationsPage.set(1);
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.error.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar.');
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    this.creating.set(true);
    this.createError.set('');

    this.normalizeMaintenanceDates();
    const dateError = this.validateMaintenanceDates();
    if (dateError) {
      this.createError.set(dateError);
      this.creating.set(false);
      return;
    }

    const body = {
      category: 'maintenance',
      title: this.title?.trim() || 'Manutenção programada',
      maintenanceTemplate: this.maintenanceTemplate,
      maintenanceStartAt: this.maintenanceStart,
      maintenanceEndAt: this.maintenanceEnd,
    };

    this.http.post<SystemNotification>(`${API_URL}/admin/notifications`, body).subscribe({
      next: () => {
        this.cancelForm();
        this.creating.set(false);
        this.load();
      },
      error: (err) => {
        this.createError.set(err?.error?.message ?? 'Erro ao publicar.');
        this.creating.set(false);
      },
    });
  }

  deactivate(id: string): void {
    this.http.patch(`${API_URL}/admin/notifications/${id}/deactivate`, {}).subscribe({
      next: () => this.load(),
      error: () => {},
    });
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

  statusLabel(n: SystemNotification): string {
    if (!n.active) return 'Inactivo';
    if (n.category === 'maintenance') {
      if (n.maintenancePhase === 'scheduled') return 'Agendada';
      if (n.maintenancePhase === 'active') return 'Em curso';
    }
    return 'Activo';
  }
}
