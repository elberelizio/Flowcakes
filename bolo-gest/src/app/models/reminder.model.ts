/** Lembrete leve (sem ser encomenda completa). Guardado na base de dados (API). */
export interface Reminder {
  id: string;
  clientName: string;
  address: string;
  deliveryDate: string; // YYYY-MM-DD
  description: string;
  /** Começar a mostrar avisos quando faltarem N dias ou menos até à data (0 = só no dia). */
  notifyDaysBefore: number;
  createdAt: string; // ISO
}
