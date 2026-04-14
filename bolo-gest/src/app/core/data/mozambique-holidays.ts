/**
 * Feriados nacionais de Moçambique (dia/mês — repetem todos os anos).
 * Usado no dashboard para saudação e destaque nos lembretes.
 */
export interface MozambiqueHoliday {
  day: number;   // 1-31
  month: number; // 1-12
  name: string;
}

export const MOZAMBIQUE_NATIONAL_HOLIDAYS: MozambiqueHoliday[] = [
  { day: 1, month: 1, name: 'Ano Novo' },
  { day: 3, month: 2, name: 'Dia dos Heróis Moçambicanos' },
  { day: 7, month: 4, name: 'Dia da Mulher Moçambicana' },
  { day: 1, month: 5, name: 'Dia Internacional dos Trabalhadores' },
  { day: 25, month: 6, name: 'Dia da Independência Nacional' },
  { day: 7, month: 9, name: 'Dia da Vitória' },
  { day: 25, month: 9, name: 'Dia das Forças Armadas' },
  { day: 4, month: 10, name: 'Dia da Paz e Reconciliação' },
  { day: 25, month: 12, name: 'Dia da Família' },
];

export function getHolidayOnDate(date: Date): MozambiqueHoliday | null {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  return MOZAMBIQUE_NATIONAL_HOLIDAYS.find((h) => h.day === d && h.month === m) ?? null;
}

/** Feriados nos próximos N dias (a partir de hoje). */
export function getUpcomingHolidays(daysAhead: number): Array<{ date: Date; holiday: MozambiqueHoliday }> {
  const result: Array<{ date: Date; holiday: MozambiqueHoliday }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + daysAhead);

  const current = new Date(today);
  while (current <= end) {
    const h = getHolidayOnDate(current);
    if (h) result.push({ date: new Date(current), holiday: h });
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export function formatHolidayDate(holiday: MozambiqueHoliday): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${holiday.day} de ${months[holiday.month - 1]}`;
}
