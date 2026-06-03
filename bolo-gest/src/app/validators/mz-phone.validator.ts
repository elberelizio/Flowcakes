/**
 * Ponto único para importar normalização de telefone MZ nos componentes.
 * A lógica efectiva vive em `auth.service` (alinhada à API).
 */
export { normalizeMzPhoneDigits } from '../services/auth.service';

export type MzWalletChannel = 'mpesa' | 'emola';

/** Carteira M-Pesa/e-Mola: só dígitos, máx. 9, prefixo 84|85 ou 86|87 conforme o canal. */
export function sanitizeMzWalletPhone(raw: string, channel: MzWalletChannel): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('258')) {
    d = d.slice(3);
  }
  d = d.slice(0, 9);
  if (!d.length) {
    return '';
  }
  if (d[0] !== '8') {
    return '';
  }
  if (d.length >= 2) {
    const second = d[1];
    const allowed = channel === 'emola' ? ['6', '7'] : ['4', '5'];
    if (!allowed.includes(second)) {
      return d.slice(0, 1);
    }
  }
  return d;
}

export function isValidMzWalletPhone(digits: string, channel: MzWalletChannel): boolean {
  const d = digits.replace(/\D/g, '');
  if (d.length !== 9) {
    return false;
  }
  if (channel === 'emola') {
    return d.startsWith('86') || d.startsWith('87');
  }
  return d.startsWith('84') || d.startsWith('85');
}
