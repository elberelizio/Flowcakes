import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ReminderService } from '../../services/reminder.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { NotificationService } from '../../services/notification.service';
import { Reminder } from '../../models/reminder.model';
import {
  getUpcomingHolidays,
  formatHolidayDate,
} from '../../core/data/mozambique-holidays';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './reminders.component.html',
  styleUrl: './reminders.component.scss',
})
export class RemindersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notification = inject(NotificationService);
  private readonly userSettings = inject(UserSettingsService);
  readonly reminderService = inject(ReminderService);

  /** Edição: null = novo lembrete. */
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    clientName: ['', Validators.required],
    address: [''],
    deliveryDate: ['', Validators.required],
    description: [''],
    notifyDaysBefore: [
      5,
      [Validators.required, Validators.min(0), Validators.max(90)],
    ],
  });

  /** Feriados nacionais (Moçambique) nos próximos 12 meses. */
  readonly nationalHolidays = computed(() => getUpcomingHolidays(366));

  readonly reminderCount = computed(() => this.reminderService.reminders().length);

  readonly upcomingCount = computed(() =>
    this.reminderService.reminders().filter((r) => this.daysUntil(r.deliveryDate) >= 0).length,
  );

  readonly todayCount = computed(() =>
    this.reminderService.reminders().filter((r) => this.daysUntil(r.deliveryDate) === 0).length,
  );

  readonly remindersGrouped = computed(() => {
    const list = [...this.reminderService.reminders()].sort((a, b) =>
      a.deliveryDate.localeCompare(b.deliveryDate)
    );
    const byDate = new Map<string, Reminder[]>();
    list.forEach((r) => {
      if (!byDate.has(r.deliveryDate)) byDate.set(r.deliveryDate, []);
      byDate.get(r.deliveryDate)!.push(r);
    });
    return Array.from(byDate.entries()).map(([date, reminders]) => ({
      date,
      reminders,
    }));
  });

  ngOnInit(): void {
    this.reminderService.loadReminders();
    this.resetFormForNew();
  }

  formatHolidayDate = formatHolidayDate;

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-MZ', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  daysUntil(dateStr: string): number {
    return this.reminderService.daysUntilDelivery(dateStr);
  }

  /** Estado visual do lembrete face a hoje. */
  statusLabel(dateStr: string): { label: string; tone: 'past' | 'today' | 'soon' | 'future' } {
    const d = this.daysUntil(dateStr);
    if (d < 0) return { label: 'Data passada', tone: 'past' };
    if (d === 0) return { label: 'Hoje', tone: 'today' };
    if (d <= 7) return { label: `Faltam ${d} dia(s)`, tone: 'soon' };
    return { label: `Faltam ${d} dia(s)`, tone: 'future' };
  }

  resetFormForNew(): void {
    this.editingId.set(null);
    const def = this.userSettings.getReminderDaysBefore();
    this.form.reset({
      clientName: '',
      address: '',
      deliveryDate: '',
      description: '',
      notifyDaysBefore: def,
    });
  }

  startEdit(r: Reminder): void {
    this.editingId.set(r.id);
    this.form.patchValue({
      clientName: r.clientName,
      address: r.address ?? '',
      deliveryDate: r.deliveryDate,
      description: r.description ?? '',
      notifyDaysBefore: r.notifyDaysBefore ?? 5,
    });
    document.getElementById('lembrete-form-anchor')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const notify = Number(v.notifyDaysBefore);
    const notifyClamped = Number.isFinite(notify)
      ? Math.min(90, Math.max(0, notify))
      : 5;
    const payload: Omit<Reminder, 'id' | 'createdAt'> = {
      clientName: v.clientName.trim(),
      address: (v.address ?? '').trim(),
      deliveryDate: v.deliveryDate.trim(),
      description: (v.description ?? '').trim(),
      notifyDaysBefore: notifyClamped,
    };
    const id = this.editingId();
    if (id) {
      this.reminderService
        .update(id, payload)
        .then(() => {
          this.notification.showSuccess('Lembrete actualizado.');
          this.resetFormForNew();
        })
        .catch((err) => {
          console.warn(err);
          this.notification.showError('Não foi possível actualizar o lembrete.');
        });
    } else {
      this.reminderService
        .add(payload)
        .then(() => {
          this.notification.showSuccess('Lembrete criado.');
          this.resetFormForNew();
        })
        .catch((err) => {
          console.warn(err);
          this.notification.showError('Não foi possível criar o lembrete.');
        });
    }
  }

  remove(id: string): void {
    this.reminderService
      .remove(id)
      .then(() => {
        this.notification.showSuccess('Lembrete apagado.');
        if (this.editingId() === id) this.resetFormForNew();
      })
      .catch((err) => {
        console.warn(err);
        this.notification.showError('Não foi possível apagar o lembrete.');
      });
  }
}
