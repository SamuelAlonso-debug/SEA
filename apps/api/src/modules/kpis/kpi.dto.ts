export interface HeaderKpisDto {
  month: number; // 1-12
  year: number;
  totalTransactions: number;
  totalSalesAmount: number;
  totalTickets: number;
  totalProductsSold: number;
}

export interface PaymentMethodKpiDto {
  paymentMethod: string; // CASH, CARD, etc
  totalSalesAmount: number;
  count: number;
}

export interface LowStockProductDto {
  id: string;
  name: string;
  productCode: string;
  stock: number;
  minStock: number;
  missing: number; // minStock - stock
}

export interface TopProductDto {
  productId: string;
  productCode: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface SummaryKpisDto {
  month: number; // 1-12
  year: number;
  averageTicketAmount: number;
  averageProductsPerTicket: number;
  todayRevenue: number;
  todaySalesCount: number;
}

// Montos sin IVA, en pesos.
export interface ProfitKpisDto {
  netSales: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number; // sin la categoría merchandise
  netProfit: number;
  marginPct: number | null; // utilidad neta / ventas netas; null sin ventas
  itemsWithoutCost: number;
  warnings: string[];
}
