import { Injectable, signal, computed } from '@angular/core';

const STORAGE_KEY_REMINDER_DAYS = 'chefcontrol_reminder_days_before';
const DEFAULT_REMINDER_DAYS = 7;
const MIN_DAYS = 1;
const MAX_DAYS = 60;

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  /** Dias antes da data de entrega para mostrar/notificar lembretes (guardado em localStorage). */
  private readonly reminderDaysBefore = signal<number>(this.loadReminderDays());

  /** Valor actual (1–60). */
  reminderDays = computed(() => this.reminderDaysBefore());

  private loadReminderDays(): number {
    if (typeof localStorage === 'undefined') return DEFAULT_REMINDER_DAYS;
    const stored = localStorage.getItem(STORAGE_KEY_REMINDER_DAYS);
    if (stored == null) return DEFAULT_REMINDER_DAYS;
    const n = parseInt(stored, 10);
    if (!Number.isFinite(n) || n < MIN_DAYS || n > MAX_DAYS) return DEFAULT_REMINDER_DAYS;
    return n;
  }

  setReminderDays(days: number): void {
    const value = Math.max(MIN_DAYS, Math.min(MAX_DAYS, Math.round(days)));
    this.reminderDaysBefore.set(value);
    try {
      localStorage.setItem(STORAGE_KEY_REMINDER_DAYS, String(value));
    } catch (_) {}
  }

  /** Dias a usar nas listas de "próximos lembretes" (para popup e dashboard). */
  getReminderDaysBefore(): number {
    return this.reminderDaysBefore();
  }
}
