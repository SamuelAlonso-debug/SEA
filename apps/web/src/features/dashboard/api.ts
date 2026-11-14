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
  Period,
} from "@/types/api";

function withToken() {
  return { token: getToken() };
}

export const kpisClient = {
  getHeader: (period?: Period | null) =>
    apiClient.get<Compared<HeaderKpis>>("/kpis/header", {
      ...withToken(),
      query: { ...period },
    }),

  getPaymentMethods: (period?: Period | null) =>
    apiClient.get<Compared<PaymentMethodKpi[]>>("/kpis/payment-methods", {
      ...withToken(),
      query: { ...period },
    }),

  getLowStock: (threshold = 5) =>
    apiClient.get<LowStockProduct[]>("/kpis/low-stock", {
      ...withToken(),
      query: { threshold },
    }),

  getTopProducts: (period?: Period | null) =>
    apiClient.get<Compared<TopProduct[]>>("/kpis/top-products", {
      ...withToken(),
      query: { ...period },
    }),

  getSummary: (period?: Period | null) =>
    apiClient.get<Compared<SummaryKpis>>("/kpis/summary", {
      ...withToken(),
      query: { ...period },
    }),
};
