/**
 * Logótipos oficiais via Wikimedia Commons (Special:FilePath → redirect estável para upload.wikimedia.org).
 * M-Pesa: ficheiro público M-PESA_LOGO-01.svg.
 * e-Mola (Movitel MZ): Movitel-Logo.jpg — operador do serviço e-Mola em Moçambique.
 */
export const LICENSE_PAYMENT_BRAND_IMAGES = {
  /** Nome do ficheiro no Commons inclui espaço. */
  mpesa: 'https://commons.wikimedia.org/wiki/Special:FilePath/M-PESA%20LOGO-01.svg',
  emola: 'https://commons.wikimedia.org/wiki/Special:FilePath/Movitel-Logo.jpg',
} as const;

export const LICENSE_PAYMENT_BRAND_ALTS = {
  mpesa: 'M-Pesa',
  emola: 'e-Mola (Movitel)',
} as const;
