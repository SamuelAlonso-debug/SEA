export type PaymentMethod = "CASH" | "CARD";

export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  productCode: string;
  category?: string | null;
  price: number;
  stock: number;
  provider?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Item de la venta
export interface SaleItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Venta completa (SaleDto)
export interface Sale {
  id: string;
  ticketNumber: string;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  items: SaleItem[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

// KPIs header
export interface HeaderKpis {
  month: number;   // 0-11
  year: number;
  totalTransactions: number;
  totalSalesAmount: number;
  totalTickets: number;
  totalProductsSold: number;
}

// KPIs método de pago (lista)
export interface PaymentMethodKpi {
  paymentMethod: PaymentMethod | string;
  totalSalesAmount: number;
  count: number;
}

// Low stock
export interface LowStockProduct {
  id: string;
  name: string;
  productCode: string;
  stock: number;
}

// Top productos
export interface TopProduct {
  productId: string;
  productCode: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

// Resumen (ticket promedio, productos / ticket, ingresos hoy, etc)
export interface SummaryKpis {
  month: number;
  year: number;
  averageTicketAmount: number;
  averageProductsPerTicket: number;
  todayRevenue: number;
  todaySalesCount: number;
}

export type ExpenseCategory =
  | "service"
  | "merchandise"
  | "maintenance"
  | "rent"
  | "payroll"
  | "tax"
  | "other";

export interface ExpenseDto {
  id: string;
  concept: string;
  category: ExpenseCategory; // valores que espera el backend
  amount: number;
  date: string;              // ISO 8601
  paymentMethod: string;
  vendor?: string | null;
  notes?: string | null;
}

export interface ExpensesListResponse {
  data: ExpenseDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExpensesKpisResponse {
  month: number;
  year: number;
  totalAmountMonth: number;
  totalCountMonth: number;
  totalByCategory: {
    category: ExpenseCategory;
    totalAmount: number;
  }[];
}

export interface CreateExpenseRequest {
  concept: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // ISO 8601
  paymentMethod: string;
  vendor?: string;
  notes?: string;
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;