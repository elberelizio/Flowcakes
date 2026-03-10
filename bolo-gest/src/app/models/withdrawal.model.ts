/** Retirada de caixa: valor tirado do negócio (registo). */
export interface Withdrawal {
  id: string;
  amount: number;
  withdrawalDate: string; // YYYY-MM-DD
  description: string;
  createdAt: string; // ISO
}

export interface WithdrawalCreate {
  amount: number;
  withdrawalDate: string;
  description?: string;
}
