import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WithdrawalService } from '../../services/withdrawal.service';
import { NotificationService } from '../../services/notification.service';
import { Withdrawal, WithdrawalCreate } from '../../models/withdrawal.model';

@Component({
  selector: 'app-withdrawals',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './withdrawals.component.html',
  styleUrl: './withdrawals.component.scss',
})
export class WithdrawalsComponent implements OnInit {
  private notification = inject(NotificationService);
  readonly withdrawalService = inject(WithdrawalService);

  readonly saving = signal(false);
  readonly withdrawalCount = computed(() => this.withdrawalService.withdrawals().length);

  readonly profitAfterWithdrawal = computed(() =>
    Math.max(0, this.withdrawalService.availableProfit() - (this.amount ?? 0)),
  );

  amount: number | null = null;
  withdrawalDate = '';
  description = '';

  ngOnInit(): void {
    this.withdrawalService.loadWithdrawals();
    this.withdrawalDate = new Date().toISOString().slice(0, 10);
  }

  async submit(): Promise<void> {
    const amt = this.amount;
    const date = (this.withdrawalDate || '').trim();
    if (amt == null || amt <= 0 || !date) {
      this.notification.showWarning('Indique o valor e a data da retirada.');
      return;
    }

    const available = this.withdrawalService.availableProfit();
    if (available <= 0) {
      this.notification.showError('Não há lucro disponível para retirar. Registe encomendas e lucro antes de tirar da caixa.');
      return;
    }

    if (amt > available) {
      this.notification.showError(
        `Não pode retirar ${amt.toLocaleString('pt-MZ')} MZN. O lucro disponível é apenas ${available.toLocaleString('pt-MZ')} MZN.`,
      );
      return;
    }

    const remaining = available - amt;
    const totalProfit = this.withdrawalService.totalProfit();

    if (remaining === 0) {
      const proceed = confirm(
        'Após esta retirada o lucro disponível ficará em zero. Deseja continuar?',
      );
      if (!proceed) return;
    } else if (totalProfit > 0 && remaining < totalProfit * 0.2) {
      const proceed = confirm(
        `O lucro disponível vai descer para ${remaining.toLocaleString('pt-MZ')} MZN (menos de 20% do lucro acumulado). Deseja continuar?`,
      );
      if (!proceed) return;
    }

    const data: WithdrawalCreate = {
      amount: amt,
      withdrawalDate: date,
      description: (this.description || '').trim() || undefined,
    };

    this.saving.set(true);
    try {
      await this.withdrawalService.add(data);
      this.notification.showSuccess(
        remaining === 0
          ? 'Retirada registada. O lucro disponível ficou em zero.'
          : `Retirada registada. Lucro disponível: ${remaining.toLocaleString('pt-MZ')} MZN.`,
      );
      this.amount = null;
      this.description = '';
    } catch (err: any) {
      console.warn('Erro ao registar retirada', err);
      const body = err?.error;
      const msg =
        typeof body === 'object' && body?.message
          ? String(body.message)
          : 'Não foi possível registar a retirada.';
      this.notification.showError(msg);
    } finally {
      this.saving.set(false);
    }
  }

  remove(w: Withdrawal): void {
    if (!confirm(`Apagar esta retirada de ${w.amount} MZN?`)) return;
    this.withdrawalService
      .remove(w.id)
      .then(() => this.notification.showSuccess('Retirada apagada.'))
      .catch(() => this.notification.showError('Não foi possível apagar.'));
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
