import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WithdrawalService } from '../../services/withdrawal.service';
import { NotificationService } from '../../services/notification.service';
import { Withdrawal, WithdrawalCreate } from '../../models/withdrawal.model';

@Component({
  selector: 'app-retiradas',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './retiradas.component.html',
  styleUrl: './retiradas.component.scss',
})
export class RetiradasComponent implements OnInit {
  private notification = inject(NotificationService);
  readonly withdrawalService = inject(WithdrawalService);

  readonly saving = signal(false);
  readonly withdrawalCount = computed(() => this.withdrawalService.withdrawals().length);

  amount: number | null = null;
  withdrawalDate = '';
  description = '';

  ngOnInit(): void {
    this.withdrawalService.loadWithdrawals();
    this.withdrawalDate = new Date().toISOString().slice(0, 10);
  }

  submit(): void {
    const amt = this.amount;
    const date = (this.withdrawalDate || '').trim();
    if (amt == null || amt <= 0 || !date) {
      this.notification.showWarning('Indique o valor e a data da retirada.');
      return;
    }
    const data: WithdrawalCreate = {
      amount: amt,
      withdrawalDate: date,
      description: (this.description || '').trim() || undefined,
    };
    this.saving.set(true);
    this.withdrawalService
      .add(data)
      .then(() => {
        this.notification.showSuccess('Retirada registada.');
        this.amount = null;
        this.description = '';
      })
      .catch((err) => {
        console.warn('Erro ao registar retirada', err);
        this.notification.showError('Não foi possível registar a retirada.');
      })
      .finally(() => this.saving.set(false));
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
