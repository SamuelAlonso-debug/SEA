import prisma from "../../shared/prisma";
import { businessRanges, Range } from "../../shared/business-time";
import {
  HeaderKpisDto,
  PaymentMethodKpiDto,
  LowStockProductDto,
  TopProductDto,
  SummaryKpisDto,
} from "./kpi.dto";

// 1) KPIs del header: transacciones, ventas, tickets, productos vendidos del mes
export const getHeaderKpis = async (range: Range): Promise<HeaderKpisDto> => {
  const { start: startOfMonth, end: startOfNextMonth, month, year } = range;

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
    include: {
      items: true,
    },
  });

  const totalTransactions = sales.length;
  let totalSalesAmount = 0;
  let totalProductsSold = 0;

  for (const sale of sales) {
    totalSalesAmount += sale.total;
    for (const item of sale.items) {
      totalProductsSold += item.quantity;
    }
  }

  // En este contexto tickets = transacciones; si luego se diferencian, aquí se ajusta
  const totalTickets = totalTransactions;

  return {
    month,
    year,
    totalTransactions,
    totalSalesAmount,
    totalTickets,
    totalProductsSold,
  };
};

// 2) Ingresos por método de pago (para gráfico)
export const getPaymentMethodKpis = async (range: Range): Promise<
  PaymentMethodKpiDto[]
> => {
  const { start: startOfMonth, end: startOfNextMonth } = range;

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
  });

  const map = new Map<string, { total: number; count: number }>();

  for (const sale of sales) {
    const key = sale.paymentMethod; // CASH, CARD, etc
    const current = map.get(key) ?? { total: 0, count: 0 };
    current.total += sale.total;
    current.count += 1;
    map.set(key, current);
  }

  const result: PaymentMethodKpiDto[] = Array.from(map.entries()).map(
    ([paymentMethod, value]) => ({
      paymentMethod,
      totalSalesAmount: value.total,
      count: value.count,
    })
  );

  return result;
};

// 3) Productos con stock bajo
const LOW_STOCK_THRESHOLD = 5;

export const getLowStockProducts = async (
  threshold: number = LOW_STOCK_THRESHOLD
): Promise<LowStockProductDto[]> => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: {
        lte: threshold,
      },
    },
    orderBy: { stock: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    productCode: p.productCode,
    stock: p.stock,
  }));
};

// 4) Top productos vendidos del mes
export const getTopProducts = async (
  range: Range,
  limit: number = 5
): Promise<TopProductDto[]> => {
  const { start: startOfMonth, end: startOfNextMonth } = range;

  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    },
    include: {
      product: true,
    },
  });

  const map = new Map<
    string,
    { productId: string; productCode: string; name: string; qty: number; revenue: number }
  >();

  for (const item of saleItems) {
    const key = item.productId;
    const current =
      map.get(key) ??
      {
        productId: item.productId,
        productCode: item.product.productCode,
        name: item.product.name,
        qty: 0,
        revenue: 0,
      };

    current.qty += item.quantity;
    current.revenue += item.subtotal;
    map.set(key, current);
  }

  const results: TopProductDto[] = Array.from(map.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit)
    .map((p) => ({
      productId: p.productId,
      productCode: p.productCode,
      name: p.name,
      totalQuantity: p.qty,
      totalRevenue: p.revenue,
    }));

  return results;
};

// 5) Resumen: ticket promedio, productos por ticket promedio, ingresos de hoy
export const getSummaryKpis = async (range: Range): Promise<SummaryKpisDto> => {
  const { start: startOfMonth, end: startOfNextMonth, month, year } = range;
  // "Hoy" no depende del periodo pedido.
  const { startOfToday, startOfTomorrow } = businessRanges(new Date());

  // Ventas del mes (para promedios)
  const monthSales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
    include: {
      items: true,
    },
  });

  const transactions = monthSales.length;

  let totalSalesAmount = 0;
  let totalProductsSold = 0;

  for (const sale of monthSales) {
    totalSalesAmount += sale.total;
    for (const item of sale.items) {
      totalProductsSold += item.quantity;
    }
  }

  const averageTicketAmount =
    transactions > 0 ? totalSalesAmount / transactions : 0;

  const averageProductsPerTicket =
    transactions > 0 ? totalProductsSold / transactions : 0;

  // Ingresos de hoy
  const todaySales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startOfToday,
        lt: startOfTomorrow,
      },
    },
  });

  let todayRevenue = 0;
  for (const sale of todaySales) {
    todayRevenue += sale.total;
  }

  const todaySalesCount = todaySales.length;

  return {
    month,
    year,
    averageTicketAmount,
    averageProductsPerTicket,
    todayRevenue,
    todaySalesCount,
  };
};
