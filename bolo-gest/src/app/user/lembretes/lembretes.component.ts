import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReminderService } from '../../services/reminder.service';
import { NotificationService } from '../../services/notification.service';
import { Reminder } from '../../models/reminder.model';

@Component({
  selector: 'app-lembretes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lembretes.component.html',
  styleUrl: './lembretes.component.scss',
})
export class LembretesComponent implements OnInit {
  private notification = inject(NotificationService);

  constructor(public reminderService: ReminderService) {}

  ngOnInit(): void {
    this.reminderService.loadReminders();
  }

  remindersByDate(): { date: string; reminders: Reminder[] }[] {
    const list = this.reminderService.reminders();
    const byDate = new Map<string, Reminder[]>();
    list.forEach((r) => {
      if (!byDate.has(r.deliveryDate)) byDate.set(r.deliveryDate, []);
      byDate.get(r.deliveryDate)!.push(r);
    });
    return Array.from(byDate.entries())
      .map(([date, reminders]) => ({ date, reminders }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-MZ', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  remove(id: string): void {
    this.reminderService
      .remove(id)
      .then(() => this.notification.showSuccess('Lembrete apagado.'))
      .catch((err) => {
        console.warn('Erro ao apagar lembrete', err);
        this.notification.showError('Não foi possível apagar o lembrete.');
      });
  }
}
