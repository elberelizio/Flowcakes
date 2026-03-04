import { Injectable } from '@angular/core';
import { IndexedDBService } from './indexeddb.service';

interface OrderSeed {
  id: string;
  productName: string;
  quantity: number;
  paymentStatus: 'paid' | 'not_paid';
  orderStatus: 'ordered' | 'produced' | 'paid';
  totalPrice: number;
  profit: number;
  date: string; // ISO date
  deliveryDate?: string;
  createdAt: string;
  isCancelled: boolean;
  clientName: string;
  category?: string;
  subcategory?: string;
  size?: string;
  quantityKg?: number;
  unitsPerKg?: number;
  valueCharged: number;
  valuePaid: number;
  costTotal: number;
  delivered: boolean;
  ingredientIds: string[];
  observations?: string;
}

@Injectable({ providedIn: 'root' })
export class SeedLocalService {
  constructor(private db: IndexedDBService) {}

  async seedData(force = false): Promise<void> {
    await this.db.init();

    // Verificar se já existem dados (a menos que force seja true)
    if (!force) {
      const existingOrders = await this.db.getAllOrders();
      if (existingOrders.length > 0) {
        console.log('Dados já existem no IndexedDB. Use force=true para repopular.');
        return;
      }
    }

    const today = new Date();
    const orders: OrderSeed[] = [];

    // Produtos diversos
    const products = [
      { name: 'Brigadeiro', cost: 0.50, sale: 2.00 },
      { name: 'Beijinho', cost: 0.45, sale: 2.00 },
      { name: 'Cajuzinho', cost: 0.55, sale: 2.50 },
      { name: 'Bem Casado', cost: 0.60, sale: 2.50 },
      { name: 'Quindim', cost: 0.70, sale: 3.00 },
      { name: 'Pudim', cost: 1.50, sale: 5.00 },
      { name: 'Mousse de Chocolate', cost: 1.20, sale: 4.50 },
      { name: 'Torta de Limão', cost: 2.00, sale: 8.00 },
      { name: 'Bolo de Chocolate', cost: 8.00, sale: 25.00 },
      { name: 'Bolo de Cenoura', cost: 7.00, sale: 22.00 },
      { name: 'Bolo de Pote', cost: 2.50, sale: 8.00 },
      { name: 'Bolo de Fubá', cost: 6.00, sale: 18.00 },
      { name: 'Bolo de Laranja', cost: 6.50, sale: 20.00 },
      { name: 'Bolo de Milho', cost: 7.50, sale: 23.00 },
      { name: 'Coxinha', cost: 1.20, sale: 4.00 },
      { name: 'Risole', cost: 1.00, sale: 3.50 },
      { name: 'Pastel', cost: 0.80, sale: 3.00 },
      { name: 'Kibe', cost: 1.10, sale: 3.50 },
      { name: 'Empada', cost: 0.90, sale: 3.00 },
      { name: 'Bolinha de Queijo', cost: 0.70, sale: 2.50 },
      { name: 'Enroladinho', cost: 1.00, sale: 3.50 },
      { name: 'Esfiha', cost: 1.00, sale: 3.50 },
    ];

    const clients = [
      'Maria Silva', 'João Santos', 'Ana Costa', 'Pedro Oliveira', 'Carla Souza',
      'Roberto Lima', 'Fernanda Alves', 'Lucas Pereira', 'Juliana Rocha', 'Marcos Ferreira',
      'Patricia Gomes', 'Ricardo Martins', 'Camila Rodrigues', 'Felipe Araujo', 'Larissa Barbosa',
      'Gustavo Ribeiro', 'Beatriz Carvalho', 'Thiago Nunes', 'Renata Dias', 'Bruno Moreira'
    ];

    const statuses: Array<'ordered' | 'produced' | 'paid'> = ['ordered', 'produced', 'paid'];
    const paymentStatuses: Array<'paid' | 'not_paid'> = ['paid', 'not_paid'];

    // Gerar encomendas dos últimos 30 dias
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);

      // Entre 2 e 8 encomendas por dia
      const ordersPerDay = Math.floor(Math.random() * 7) + 2;

      for (let i = 0; i < ordersPerDay; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 20) + 1;
        const orderStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

        const totalPrice = product.sale * quantity;
        const costTotal = product.cost * quantity;
        const profit = totalPrice - costTotal;
        const valuePaid = paymentStatus === 'paid' ? totalPrice : paymentStatus === 'not_paid' ? 0 : totalPrice * 0.5;

        // Delivery date: 1-5 dias após a data do pedido
        const deliveryDate = new Date(date);
        deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 5) + 1);

        // Determinar paymentStatus baseado no valor pago
        let paymentStatusDB: 'paid' | 'not_paid' = 'not_paid';
        if (valuePaid >= totalPrice) {
          paymentStatusDB = 'paid';
        } else if (valuePaid > 0) {
          // Para parcial, vamos usar 'not_paid' no DB mas converter depois
          paymentStatusDB = 'not_paid';
        }

        const order: OrderSeed = {
          id: `order-${dayOffset}-${i}-${Date.now()}-${Math.random()}`,
          productName: product.name,
          quantity,
          paymentStatus: paymentStatusDB,
          orderStatus,
          totalPrice,
          profit,
          date: date.toISOString().split('T')[0],
          deliveryDate: deliveryDate.toISOString().split('T')[0],
          createdAt: date.toISOString(),
          isCancelled: false,
          clientName: clients[Math.floor(Math.random() * clients.length)],
          category: product.name.includes('Bolo') || ['Brigadeiro', 'Beijinho', 'Cajuzinho', 'Bem Casado', 'Quindim', 'Pudim', 'Mousse', 'Torta'].includes(product.name) ? 'doces' : 'salgados',
          subcategory: product.name.includes('Bolo') ? 'Bolos' : product.name.includes('Brigadeiro') || product.name.includes('Beijinho') ? 'Biscoitos' : 'Chamussas',
          size: product.name.includes('Bolo') ? ['Pequeno', 'Médio', 'Grande'][Math.floor(Math.random() * 3)] : undefined,
          quantityKg: !product.name.includes('Bolo') ? Math.random() * 5 + 0.5 : undefined,
          unitsPerKg: !product.name.includes('Bolo') ? Math.floor(Math.random() * 10) + 8 : undefined,
          valueCharged: totalPrice,
          valuePaid,
          costTotal,
          delivered: orderStatus === 'paid',
          ingredientIds: [],
          observations: Math.random() > 0.7 ? 'Entrega urgente' : undefined,
        };

        orders.push(order);
      }
    }

    // Salvar todas as encomendas
    for (const order of orders) {
      await this.db.saveOrder(order as any);
    }

    console.log(`✅ ${orders.length} encomendas criadas no IndexedDB`);
  }

  async clearData(): Promise<void> {
    await this.db.clearOrders();
    console.log('✅ Dados limpos do IndexedDB');
  }
}
