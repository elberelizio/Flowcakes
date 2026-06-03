/** Cada unidade paga da licença corresponde a 30 dias (regra de negócio). */
export const LICENSE_DAYS_PER_PAYMENT_UNIT = 30;

export function licensePeriodDays(durationMonths: number | undefined | null): number {
  const months = Math.max(1, Number(durationMonths) || 1);
  return months * LICENSE_DAYS_PER_PAYMENT_UNIT;
}

/** Ex.: 1 → «30 dias», 2 → «60 dias». */
export function licensePeriodLabelPt(durationMonths: number | undefined | null): string {
  const days = licensePeriodDays(durationMonths);
  return days === 1 ? '1 dia' : `${days} dias`;
}

/** Preço por ciclo de 30 dias. */
export function licensePriceCycleLabelPt(amountMzn: number): string {
  return `${amountMzn} MZN / 30 dias`;
}
