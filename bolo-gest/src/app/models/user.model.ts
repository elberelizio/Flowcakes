export type DocumentType = 'bi' | 'nuit';

export interface User {
  id: string;
  phone: string;
  passwordHash: string; // MVP: store as-is; production would hash
  /** Nome completo */
  fullName?: string;
  /** BI ou NUIT */
  documentType?: DocumentType;
  /** Número do documento */
  documentNumber?: string;
  /** Província */
  province?: string;
  /** Email */
  email?: string;
}

/** Províncias de Moçambique */
export const PROVINCES = [
  'Maputo Cidade',
  'Maputo',
  'Gaza',
  'Inhambane',
  'Sofala',
  'Manica',
  'Tete',
  'Zambézia',
  'Nampula',
  'Cabo Delgado',
  'Niassa',
] as const;
