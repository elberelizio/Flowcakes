export type PaymentStatus = 'pendente' | 'parcial' | 'pago';

export type OrderClosureReason =
  | 'CLIENT_WITHDREW'
  | 'CANNOT_PRODUCE'
  | 'REFUSED_AT_DELIVERY'
  | 'REGISTRATION_ERROR'
  | 'OTHER';

export type OrderProductionStage = 'NOT_STARTED' | 'PRODUCED' | 'DELIVERED';
export type OrderRefundType = 'NONE' | 'FULL' | 'PARTIAL';

export const CLOSURE_REASON_OPTIONS: { value: OrderClosureReason; label: string }[] = [
  { value: 'CLIENT_WITHDREW', label: 'Cliente desistiu (antes / sem entregar)' },
  { value: 'CANNOT_PRODUCE', label: 'Não consegui produzir / agenda' },
  { value: 'REFUSED_AT_DELIVERY', label: 'Recusa na entrega (qualidade, etc.)' },
  { value: 'REGISTRATION_ERROR', label: 'Erro de registo' },
  { value: 'OTHER', label: 'Outro' },
];

export const PRODUCTION_STAGE_OPTIONS: { value: OrderProductionStage; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Ainda não produzi' },
  { value: 'PRODUCED', label: 'Já produzi (produto pronto)' },
  { value: 'DELIVERED', label: 'Já tinha sido entregue' },
];

export const REFUND_TYPE_OPTIONS: { value: OrderRefundType; label: string }[] = [
  { value: 'NONE', label: 'Sem devolução ao cliente' },
  { value: 'FULL', label: 'Devolução total do que foi pago' },
  { value: 'PARTIAL', label: 'Devolução parcial (fico com parte)' },
];

/** Tamanho para doces: por nome ou por número (ex: 15, 20 cm) */
export type ProductSize = 'Pequeno' | 'Médio' | 'Grande' | 'kg' | (string & {});

/** Tamanhos por escala (pequeno, médio, grande) */
export const DOCES_SIZES_BY_NAME = ['Pequeno', 'Médio', 'Grande'] as const;

/** Tamanhos por número (ex: forma 15, 20, 47) */
export const DOCES_SIZES_BY_NUMBER = [15, 20, 47] as const;

/** Categoria do pedido */
export type OrderCategory = 'doces' | 'salgados';

/** Subcategorias de Doces: Bolo, Biscoitos, Outros */
export const DOCES_SUBCATEGORIES = ['Bolo', 'Biscoitos', 'Outros'] as const;
/** Subcategorias de Salgados */
export const SALGADOS_SUBCATEGORIES = ['Chamussas', 'Recois', 'Outros salgados típicos'] as const;

export type DocesSubcategory = (typeof DOCES_SUBCATEGORIES)[number];
export type SalgadosSubcategory = (typeof SALGADOS_SUBCATEGORIES)[number];

export interface Order {
  id: string;
  createdAt: string; // ISO date
  /** Número sequencial da encomenda (por utilizador) */
  orderNo?: number;
  clientName: string;
  /** Categoria: doces ou salgados (opcional para pedidos antigos) */
  category?: OrderCategory;
  /** Ex: Bolos, Biscoitos, Chamussas, Recois */
  subcategory?: string;
  /** Nome do produto (ex: Bolo de Chocolate, Chamussas) */
  productName?: string;
  /** Doces: tamanho */
  size?: ProductSize;
  /** Salgados: quantidade em kg */
  quantityKg?: number;
  /** Salgados: quantas unidades saem por quilo (ex: 10 chamussas/kg) — cada confeiteiro define a sua margem */
  unitsPerKg?: number;
  valueCharged: number;
  valuePaid: number;
  costTotal: number;
  profit: number;
  paymentStatus: PaymentStatus;
  delivered: boolean;
  ingredientIds: string[];
  /** Observações opcionais (ex: "Entrega às 16h") */
  observations?: string;
  /** Legado: pedidos antigos */
  cakeName?: string;
  cakeSize?: string;
  /** Campos do backend (compatibilidade) */
  date?: string; // ISO date (data do pedido)
  deliveryDate?: string; // ISO date (data de entrega)
  /** Endereço do cliente (referência) */
  clientAddress?: string;
  /** Endereço de recolha (onde o cliente vem buscar) */
  pickupAddress?: string;
  /** Onde deixar a encomenda (quando hasDelivery = true) */
  deliveryAddress?: string;
  hasDelivery?: boolean; // Se tem transporte/delivery
  deliveryCost?: number; // Custo de transporte/delivery (preço da viagem)
  orderStatus?: 'ordered' | 'in_progress' | 'completed' | 'cancelled'; // Status do pedido
  isCancelled?: boolean;
  closedAt?: string;
  closureReason?: OrderClosureReason;
  closureNote?: string;
  productionStage?: OrderProductionStage;
  refundType?: OrderRefundType;
  refundAmount?: number;
  lossAmount?: number;
  quantity?: number;
  /** Despesas variáveis (delivery + outras despesas adicionais) */
  variableExpenses?: VariableExpense[];
}

/** Despesa variável (ex: delivery, spray para bolo derretido, etc) */
export interface VariableExpense {
  name: string; // Nome da despesa (ex: "Delivery", "Spray para bolo")
  amount: number; // Valor da despesa em MZN
}

export interface OrderWithIngredients extends Order {
  ingredients: { name: string; unitValue: number }[];
  energyCost: number;
}

/** Nome do produto para exibição (compatível com pedidos antigos) */
export function orderDisplayName(o: Order): string {
  const name = (o.productName ?? o.cakeName ?? '').trim();
  if (!name) return '—';
  const sub = (o.subcategory ?? '').trim();
  if (!sub) return name;
  const nameLower = name.toLowerCase();
  const subLower = sub.toLowerCase();
  if (nameLower === subLower || nameLower.startsWith(`${subLower} `)) return name;
  return `${sub} ${name}`;
}

/** Tamanho/quantidade para exibição */
export function orderDisplaySize(o: Order): string {
  if (o.quantityKg != null) {
    const kg = `${o.quantityKg} kg`;
    if (o.unitsPerKg != null && o.unitsPerKg > 0) {
      const total = Math.round(o.quantityKg * o.unitsPerKg);
      return `${kg} (${total} un.)`;
    }
    return kg;
  }
  if (o.size) return o.size;
  if (o.cakeSize) return o.cakeSize;
  return '—';
}

/** Etiqueta do estado do pedido para exibição */
export function getOrderStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'ordered': return 'Encomenda feita';
    case 'in_progress': return 'Em processo';
    case 'completed': return 'Finalizada';
    case 'cancelled': return 'Cancelada';
    default: return status ?? 'Encomenda feita';
  }
}

export function getClosureReasonLabel(reason: OrderClosureReason | string | undefined): string {
  return CLOSURE_REASON_OPTIONS.find((o) => o.value === reason)?.label ?? reason ?? '—';
}

export function getProductionStageLabel(stage: OrderProductionStage | string | undefined): string {
  return PRODUCTION_STAGE_OPTIONS.find((o) => o.value === stage)?.label ?? stage ?? '—';
}

export function getRefundTypeLabel(type: OrderRefundType | string | undefined): string {
  return REFUND_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type ?? '—';
}

/** Saldo em falta só para encomendas activas (canceladas = 0). */
export function orderActiveDebt(o: Order): number {
  if (o.isCancelled || o.orderStatus === 'cancelled') return 0;
  return Math.max(0, o.valueCharged - o.valuePaid);
}

/** Valor devolvido ao cliente no cancelamento (adiantamento devolvido, não o preço da encomenda). */
export function orderRefundToClient(o: Order): number {
  if (o.refundAmount != null && o.refundAmount > 0) return o.refundAmount;
  return 0;
}

/** Valor que o cliente tinha adiantado antes do cancelamento (o que ficou + o que foi devolvido). */
export function orderClientAdvanceBeforeCancel(o: Order): number {
  return orderRefundToClient(o) + (o.valuePaid ?? 0);
}

/** Preço acordado antes do cancelamento (histórico; pode vir da nota de encerramento). */
export function orderOriginalAgreedBeforeCancel(o: Order): number | null {
  if (!o.isCancelled && o.orderStatus !== 'cancelled') return null;
  const note = o.closureNote ?? '';
  const m = note.match(/Valor acordado antes do cancelamento:\s*([\d.]+)\s*MZN/i);
  if (m) return parseFloat(m[1]);
  const charged = o.valueCharged ?? 0;
  const paid = o.valuePaid ?? 0;
  const advance = orderClientAdvanceBeforeCancel(o);
  if (charged > paid + 0.001 && charged > advance + 0.001) return charged;
  return null;
}

/** Encomenda encerrada / cancelada (não conta como activa). */
export function isOrderClosed(o: Order): boolean {
  return o.isCancelled === true || o.orderStatus === 'cancelled';
}
