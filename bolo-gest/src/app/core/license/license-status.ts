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
