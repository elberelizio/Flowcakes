import type { OrderCategory } from '../../models/order.model';

export interface NewOrderCategoryMeta {
  label: string;
  tagline: string;
  imageSrc: string;
  imageAlt: string;
}

export const NEW_ORDER_CATEGORY_META: Record<OrderCategory, NewOrderCategoryMeta> = {
  doces: {
    label: 'Doces',
    tagline: 'Bolos, biscoitos, tortas',
    imageSrc: '/t.jpg',
    imageAlt: 'Bolo decorado — encomenda de doces',
  },
  salgados: {
    label: 'Salgados',
    tagline: 'Chamussas, recois e mais',
    imageSrc:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Salgados — encomenda de salgados',
  },
};
