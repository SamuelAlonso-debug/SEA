// src/lib/kpis-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import type {
  HeaderKpis,
  PaymentMethodKpi,
  LowStockProduct,
  TopProduct,
  SummaryKpis,
  Compared,
  Period,
} from "@/types/api";

export const kpisClient = {
  getHeader: (period?: Period | null) =>
    apiClient.get<Compared<HeaderKpis>>("/kpis/header", {
      query: { ...period },
    }),

  getPaymentMethods: (period?: Period | null) =>
    apiClient.get<Compared<PaymentMethodKpi[]>>("/kpis/payment-methods", {
      query: { ...period },
    }),

  // Umbral por producto (minStock); ordenado por faltante
  getLowStock: () =>
    apiClient.get<LowStockProduct[]>("/kpis/low-stock"),

  getTopProducts: (period?: Period | null) =>
    apiClient.get<Compared<TopProduct[]>>("/kpis/top-products", {
      query: { ...period },
    }),

  getSummary: (period?: Period | null) =>
    apiClient.get<Compared<SummaryKpis>>("/kpis/summary", {
      query: { ...period },
    }),
};
