import { Order } from '../../models/order.model';

/** Lucro de uma encomenda com base no valor efectivamente recebido. */
export function computeOrderProfit(order: Order): number {
  if (order.isCancelled || order.orderStatus === 'cancelled') return 0;

  const paid = order.valuePaid ?? 0;
  if (paid <= 0) return 0;

  const charged = order.valueCharged ?? 0;
  const costTotal = order.costTotal ?? 0;
  const varExpensesTotal = order.variableExpenses?.reduce((s, e) => s + (e.amount || 0), 0) ?? 0;

  let profit: number;
  if (charged <= 0) {
    profit = paid - costTotal - varExpensesTotal;
  } else if (paid >= charged) {
    // Inclui gorjeta / pagamento a mais no lucro
    profit = paid - costTotal - varExpensesTotal;
  } else {
    const ratio = paid / charged;
    profit = (charged - costTotal) * ratio - varExpensesTotal * ratio;
  }
  return Math.max(0, profit);
}

export function computeTotalProfit(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + computeOrderProfit(o), 0);
}

export function computeAvailableProfit(orders: Order[], totalWithdrawn: number): number {
  return Math.max(0, computeTotalProfit(orders) - totalWithdrawn);
}
