import type { ProfitKpisDto } from "./kpi.dto";

export interface ProfitSale {
  // Sin estado = completada: el modelo aún no tiene cancelaciones (#80).
  status?: string;
  subtotal: number; // sin IVA
  items: { quantity: number; unitCost: number | null }[];
}

export interface ProfitExpense {
  category: string;
  amount: number;
}

// Solo estas ventas cuentan; una cancelada no suma ni en ventas ni en costo.
const COUNTED_STATUSES = new Set(["COMPLETED", "PARTIALLY_REFUNDED"]);

export const MISSING_COST_WARNING = "Hay productos vendidos sin costo registrado";

const cents = (v: number) => Math.round(v * 100);

// Utilidad del periodo. Se suma en centavos enteros, igual que computeTotals.
// Los gastos de mercancía ya están en el costo de lo vendido: restarlos otra vez duplicaría la pérdida.
export function computeProfit(sales: ProfitSale[], expenses: ProfitExpense[]): ProfitKpisDto {
  let salesCents = 0;
  let costCents = 0;
  let itemsWithoutCost = 0;
  for (const sale of sales) {
    if (sale.status && !COUNTED_STATUSES.has(sale.status)) continue;
    salesCents += cents(sale.subtotal);
    for (const item of sale.items) {
      if (item.unitCost == null) itemsWithoutCost += 1;
      else costCents += cents(item.unitCost) * item.quantity;
    }
  }
  const expenseCents = expenses
    .filter((e) => e.category !== "merchandise")
    .reduce((sum, e) => sum + cents(e.amount), 0);

  const grossCents = salesCents - costCents;
  const netCents = grossCents - expenseCents;
  return {
    netSales: salesCents / 100,
    costOfGoodsSold: costCents / 100,
    grossProfit: grossCents / 100,
    expenses: expenseCents / 100,
    netProfit: netCents / 100,
    // Sin ventas no hay margen que reportar.
    marginPct: salesCents === 0 ? null : Math.round((netCents / salesCents) * 10_000) / 100,
    itemsWithoutCost,
    warnings: itemsWithoutCost > 0 ? [MISSING_COST_WARNING] : [],
  };
}
