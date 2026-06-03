/**
 * EN: Human-readable license status for PT UI.
 * Pt: Texto do estado da licença para a interface em português.
 */
export function licenseStatusLabelPt(status: string | undefined | null): string {
  switch (status) {
    case 'paid':
      return 'Pago';
    case 'trial':
      return 'Teste';
    case 'pending':
      return 'Pendente';
    default:
      return (status && String(status).trim()) || '—';
  }
}

/** EN: paid or trial (active subscription types). Pt: pago ou teste. */
export function isPaidOrTrialStatus(status: string | undefined | null): boolean {
  return status === 'paid' || status === 'trial';
}

/** Estado de um pagamento registado (recibo emitido). */
export function licensePaymentStatusLabelPt(status: string | undefined | null): string {
  if (!status || status === 'confirmed') return 'Confirmado';
  if (status === 'rejected') return 'Rejeitado';
  if (status === 'pending') return 'Pendente';
  return String(status);
}

/** Subscrição actual da conta (não confundir com estado do recibo). */
export function licenseSubscriptionLabelPt(status: string | undefined | null): string {
  switch (status) {
    case 'paid':
      return 'Subscrição paga activa';
    case 'trial':
      return 'Período de teste activo';
    case 'pending':
      return 'Aguarda pagamento';
    default:
      return licenseStatusLabelPt(status);
  }
}
