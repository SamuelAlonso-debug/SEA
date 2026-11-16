// src/lib/kpis-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import type {
  HeaderKpis,
  PaymentMethodKpi,
  LowStockProduct,
  TopProduct,
  SummaryKpis,
  ProfitKpis,
  Compared,
  PeriodQuery,
} from "@/types/api";

export const kpisClient = {
  getHeader: (period?: PeriodQuery | null) =>
    apiClient.get<Compared<HeaderKpis>>("/kpis/header", {
      query: { ...period },
    }),

  getPaymentMethods: (period?: PeriodQuery | null) =>
    apiClient.get<Compared<PaymentMethodKpi[]>>("/kpis/payment-methods", {
      query: { ...period },
    }),

  // Umbral por producto (minStock); ordenado por faltante
  getLowStock: () =>
    apiClient.get<LowStockProduct[]>("/kpis/low-stock"),

  getTopProducts: (period?: PeriodQuery | null) =>
    apiClient.get<Compared<TopProduct[]>>("/kpis/top-products", {
      query: { ...period },
    }),

  getSummary: (period?: PeriodQuery | null) =>
    apiClient.get<Compared<SummaryKpis>>("/kpis/summary", {
      query: { ...period },
    }),

  getProfit: (period?: PeriodQuery | null) =>
    apiClient.get<Compared<ProfitKpis>>("/kpis/profit", {
      query: { ...period },
    }),
};
