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
} from "@/types/api";

function withToken() {
  return { token: getToken() };
}

export const kpisClient = {
  getHeader: () =>
    apiClient.get<HeaderKpis>("/kpis/header", {
      ...withToken(),
    }),

  getPaymentMethods: () =>
    apiClient.get<PaymentMethodKpi[]>("/kpis/payment-methods", {
      ...withToken(),
    }),

  // Umbral por producto (minStock); ordenado por faltante
  getLowStock: () =>
    apiClient.get<LowStockProduct[]>("/kpis/low-stock", {
      ...withToken(),
    }),

  getTopProducts: (limit = 5) =>
    apiClient.get<TopProduct[]>("/kpis/top-products", {
      ...withToken(),
      query: { limit },
    }),

  getSummary: () =>
    apiClient.get<SummaryKpis>("/kpis/summary", {
      ...withToken(),
    }),
};
