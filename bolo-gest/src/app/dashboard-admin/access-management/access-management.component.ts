import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../core/config/api.config';

export interface SecurityEvent {
  id: string;
  eventType: string;
  userId?: string;
  userPhone?: string;
  userFullName?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface BlockedAccount {
  id: string;
  phone: string;
  fullName?: string;
  blockReason?: string;
  failedPasswordAttempts: number;
  blockedAt?: string;
}

@Component({
  selector: 'app-access-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './access-management.component.html',
  styleUrl: './access-management.component.scss',
})
export class AccessManagementComponent implements OnInit {
  private http = inject(HttpClient);

  tab = signal<'events' | 'blocked'>('events');
  events = signal<SecurityEvent[]>([]);
  blocked = signal<BlockedAccount[]>([]);
  loading = signal(true);
  error = signal('');
  actionId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    Promise.all([
      this.http.get<SecurityEvent[]>(`${API_URL}/admin/security-events?limit=300`).toPromise(),
      this.http.get<BlockedAccount[]>(`${API_URL}/admin/blocked-accounts`).toPromise(),
    ])
      .then(([ev, bl]) => {
        this.events.set(ev ?? []);
        this.blocked.set(bl ?? []);
        this.loading.set(false);
      })
      .catch((err) => {
        this.error.set(err?.status === 403 ? 'Acesso negado.' : 'Erro ao carregar dados de segurança.');
        this.loading.set(false);
      });
  }

  setTab(t: 'events' | 'blocked'): void {
    this.tab.set(t);
  }

  unblock(account: BlockedAccount): void {
    if (!confirm(`Desbloquear a conta ${account.phone}?`)) return;
    this.actionId.set(account.id);
    this.http.post(`${API_URL}/admin/users/${account.id}/unblock`, {}).subscribe({
      next: () => {
        this.actionId.set(null);
        this.load();
      },
      error: () => {
        this.actionId.set(null);
        alert('Não foi possível desbloquear.');
      },
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

  eventLabel(type: string): string {
    const map: Record<string, string> = {
      LOGIN_SUCCESS: 'Login com sucesso',
      LOGIN_FAILED_PASSWORD: 'Login — senha incorrecta',
      LOGIN_FAILED_UNKNOWN_PHONE: 'Login — contacto não registado',
      LOGIN_BLOCKED_ATTEMPT: 'Login — conta bloqueada',
      PHONE_CHANGE_SUCCESS: 'Contacto alterado',
      PHONE_CHANGE_FAILED_PASSWORD: 'Alterar contacto — senha incorrecta',
      PHONE_CHANGE_REJECTED_REGISTERED: 'Contacto já registado',
      ACCOUNT_AUTO_BLOCKED: 'Bloqueio automático',
      ACCOUNT_UNBLOCKED: 'Conta desbloqueada',
    };
    return map[type] ?? type;
  }

  reasonLabel(reason?: string): string {
    if (reason === 'PASSWORD_ATTEMPTS') return 'Tentativas de senha';
    if (reason === 'MANUAL') return 'Manual (admin)';
    return reason || '—';
  }

  canUnblock(a: BlockedAccount): boolean {
    return a.blockReason === 'PASSWORD_ATTEMPTS' || a.blockReason === 'MANUAL' || !a.blockReason;
  }
}
