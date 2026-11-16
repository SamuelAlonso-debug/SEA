// src/lib/kpis-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import { getToken } from "@/features/auth/api";
import type {
  HeaderKpis,
  PaymentMethodKpi,
  LowStockProduct,
  TopProduct,
  SummaryKpis,
  Compared,
  PeriodQuery,
} from "@/types/api";

function withToken() {
  return { token: getToken() };
}

export const kpisClient = {
  getHeader: (period?: PeriodQuery | null) =>
    apiClient.get<Compared<HeaderKpis>>("/kpis/header", {
      ...withToken(),
      query: { ...period },
    }),

  getPaymentMethods: (period?: PeriodQuery | null) =>
    apiClient.get<Compared<PaymentMethodKpi[]>>("/kpis/payment-methods", {
      ...withToken(),
      query: { ...period },
    }),

  // Umbral por producto (minStock); ordenado por faltante
  getLowStock: () =>
    apiClient.get<LowStockProduct[]>("/kpis/low-stock", {
      ...withToken(),
    }),

  getTopProducts: (period?: PeriodQuery | null) =>
    apiClient.get<Compared<TopProduct[]>>("/kpis/top-products", {
      ...withToken(),
      query: { ...period },
    }),

  getSummary: (period?: PeriodQuery | null) =>
    apiClient.get<Compared<SummaryKpis>>("/kpis/summary", {
      ...withToken(),
      query: { ...period },
    }),
};
