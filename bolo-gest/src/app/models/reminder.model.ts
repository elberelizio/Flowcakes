/** Lembrete leve (sem ser encomenda completa). Guardado na base de dados (API). */
export interface Reminder {
  id: string;
  clientName: string;
  address: string;
  deliveryDate: string; // YYYY-MM-DD
  description: string;
  createdAt: string; // ISO
}
