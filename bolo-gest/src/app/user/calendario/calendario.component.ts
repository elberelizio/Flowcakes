import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrdersService } from '../../services/orders.service';
import { ReminderService } from '../../services/reminder.service';
import { NotificationService } from '../../services/notification.service';
import { Order, orderDisplayName, orderDisplaySize } from '../../models/order.model';
import { IconComponent } from '../../components/icons/icons.component';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, ReactiveFormsModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.scss',
})
export class CalendarioComponent implements OnInit {
  readonly WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  viewDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  showNewReminderForm = signal(false);

  /** Dias do mês para a grelha (inclui dias vazios para alinhar) */
  calendarDays = computed(() => {
    const d = this.viewDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const totalDays = last.getDate();

    const days: { date: Date | null; isCurrentMonth: boolean; dateStr: string }[] = [];

    for (let i = 0; i < startPad; i++) {
      days.push({ date: null, isCurrentMonth: false, dateStr: '' });
    }
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date,
        isCurrentMonth: true,
        dateStr,
      });
    }
    return days;
  });

  /** Encomendas do dia selecionado */
  ordersForSelectedDate = computed(() => {
    const sel = this.selectedDate();
    if (!sel) return [];
    return this.ordersService.ordersByDeliveryDate(sel);
  });

  /** Lembretes do dia selecionado */
  remindersForSelectedDate = computed(() => {
    const sel = this.selectedDate();
    if (!sel) return [];
    return this.reminderService.getByDate(this.toDateStr(sel));
  });

  /** Número de encomendas por dia (para cor no calendário) */
  ordersCountByDay = computed(() => {
    const days = this.calendarDays();
    const counts: Record<string, number> = {};
    days.forEach((cell) => {
      if (cell.dateStr && cell.date) {
        counts[cell.dateStr] = this.ordersService.ordersByDeliveryDate(cell.date).length;
      }
    });
    return counts;
  });

  /** Número de lembretes por dia (para cor no calendário) */
  remindersCountByDay = computed(() => {
    const days = this.calendarDays();
    const counts: Record<string, number> = {};
    days.forEach((cell) => {
      if (cell.dateStr) {
        counts[cell.dateStr] = this.reminderService.getCountForDate(cell.dateStr);
      }
    });
    return counts;
  });

  reminderForm!: FormGroup;
  displayName = orderDisplayName;
  displaySize = orderDisplaySize;

  constructor(
    public ordersService: OrdersService,
    public reminderService: ReminderService,
    private fb: FormBuilder,
    private notification: NotificationService
  ) {
    this.reminderForm = this.fb.group({
      clientName: ['', Validators.required],
      address: [''],
      deliveryDate: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.ordersService.loadOrders();
    this.reminderService.loadReminders();
  }

  get monthLabel(): string {
    const d = this.viewDate();
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  prevMonth(): void {
    const d = new Date(this.viewDate());
    d.setMonth(d.getMonth() - 1);
    this.viewDate.set(d);
    this.selectedDate.set(null);
  }

  nextMonth(): void {
    const d = new Date(this.viewDate());
    d.setMonth(d.getMonth() + 1);
    this.viewDate.set(d);
    this.selectedDate.set(null);
  }

  goToToday(): void {
    const today = new Date();
    this.viewDate.set(new Date(today));
    this.selectedDate.set(today);
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
    this.showNewReminderForm.set(false);
    const dateStr = this.toDateStr(date);
    this.reminderForm.patchValue({ deliveryDate: dateStr });
  }

  openNewReminderForm(): void {
    const sel = this.selectedDate();
    if (sel) this.reminderForm.patchValue({ deliveryDate: this.toDateStr(sel) });
    this.showNewReminderForm.set(true);
  }

  closeNewReminderForm(): void {
    this.showNewReminderForm.set(false);
    this.reminderForm.reset({ clientName: '', address: '', deliveryDate: this.selectedDate() ? this.toDateStr(this.selectedDate()!) : '', description: '' });
  }

  saveReminder(): void {
    if (this.reminderForm.invalid) return;
    const v = this.reminderForm.getRawValue();
    this.reminderService
      .add({
        clientName: (v.clientName ?? '').trim(),
        address: (v.address ?? '').trim(),
        deliveryDate: (v.deliveryDate ?? '').trim(),
        description: (v.description ?? '').trim(),
      })
      .then(() => {
        this.closeNewReminderForm();
        this.notification.showSuccess('Lembrete criado com sucesso.');
      })
      .catch((err) => {
        console.warn('Erro ao guardar lembrete', err);
        this.notification.showError('Não foi possível criar o lembrete. Tente novamente.');
      });
  }

  removeReminder(id: string): void {
    this.reminderService
      .remove(id)
      .then(() => this.notification.showSuccess('Lembrete apagado.'))
      .catch((err) => {
        console.warn('Erro ao apagar lembrete', err);
        this.notification.showError('Não foi possível apagar o lembrete.');
      });
  }

  isSelected(cell: { dateStr: string }): boolean {
    const sel = this.selectedDate();
    return !!sel && cell.dateStr === this.toDateStr(sel);
  }

  isToday(cell: { dateStr: string }): boolean {
    return cell.dateStr === this.toDateStr(new Date());
  }

  toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getCount(dateStr: string): number {
    const o = this.ordersCountByDay()[dateStr] ?? 0;
    const r = this.remindersCountByDay()[dateStr] ?? 0;
    return o + r;
  }

  getOrdersCount(dateStr: string): number {
    return this.ordersCountByDay()[dateStr] ?? 0;
  }

  getRemindersCount(dateStr: string): number {
    return this.remindersCountByDay()[dateStr] ?? 0;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-MZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  formatDateShort(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-MZ', {
      day: 'numeric',
      month: 'short',
    });
  }

  getOrderStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'ordered': return 'Feita';
      case 'in_progress': return 'Em processo';
      case 'completed': return 'Entregue';
      case 'cancelled': return 'Cancelada';
      default: return status ?? '—';
    }
  }
}
