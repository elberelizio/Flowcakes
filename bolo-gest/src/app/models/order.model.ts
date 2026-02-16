export type PaymentStatus = 'pendente' | 'parcial' | 'pago';

/** Tamanho para doces: por nome ou por número (ex: 15, 20 cm) */
export type ProductSize = 'Pequeno' | 'Médio' | 'Grande' | 'kg' | (string & {});

/** Tamanhos por nome (pequeno, médio, grande, kg) */
export const DOCES_SIZES_BY_NAME = ['Pequeno', 'Médio', 'Grande', 'kg'] as const;

/** Tamanhos por número (ex: diâmetro em cm) — cada confeiteiro pode usar a sua escala */
export const DOCES_SIZES_BY_NUMBER = [15, 20, 25, 30, 35, 40] as const;

/** Categoria do pedido */
export type OrderCategory = 'doces' | 'salgados';

/** Subcategorias de Doces */
export const DOCES_SUBCATEGORIES = ['Bolos', 'Biscoitos', 'Outros doces'] as const;
/** Subcategorias de Salgados */
export const SALGADOS_SUBCATEGORIES = ['Chamussas', 'Recois', 'Outros salgados típicos'] as const;

export type DocesSubcategory = (typeof DOCES_SUBCATEGORIES)[number];
export type SalgadosSubcategory = (typeof SALGADOS_SUBCATEGORIES)[number];

export interface Order {
  id: string;
  createdAt: string; // ISO date
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
  hasDelivery?: boolean; // Se tem transporte/delivery
  deliveryCost?: number; // Custo de transporte/delivery (incluído nas despesas variáveis)
  orderStatus?: 'ordered' | 'in_progress' | 'completed' | 'cancelled'; // Status do pedido
  isCancelled?: boolean; // Se foi cancelado
  quantity?: number; // Quantidade (backend)
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
  return o.productName ?? o.cakeName ?? '—';
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
