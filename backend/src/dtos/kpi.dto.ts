export interface HeaderKpisDto {
  month: number; // 0-11
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
}

export interface TopProductDto {
  productId: string;
  productCode: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface SummaryKpisDto {
  month: number;
  year: number;
  averageTicketAmount: number;
  averageProductsPerTicket: number;
  todayRevenue: number;
  todaySalesCount: number;
}
