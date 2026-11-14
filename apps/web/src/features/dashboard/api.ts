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
} from "@/types/api";

function withToken() {
  return { token: getToken() };
}

export const kpisClient = {
  getHeader: () =>
    apiClient.get<Compared<HeaderKpis>>("/kpis/header", {
      ...withToken(),
    }),

  getPaymentMethods: () =>
    apiClient.get<Compared<PaymentMethodKpi[]>>("/kpis/payment-methods", {
      ...withToken(),
    }),

  getLowStock: (threshold = 5) =>
    apiClient.get<LowStockProduct[]>("/kpis/low-stock", {
      ...withToken(),
      query: { threshold },
    }),

  getTopProducts: (limit = 5) =>
    apiClient.get<Compared<TopProduct[]>>("/kpis/top-products", {
      ...withToken(),
      query: { limit },
    }),

  getSummary: () =>
    apiClient.get<Compared<SummaryKpis>>("/kpis/summary", {
      ...withToken(),
    }),
};
