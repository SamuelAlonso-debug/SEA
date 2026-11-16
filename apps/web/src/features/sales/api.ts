// src/lib/sales-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import { getToken } from "@/features/auth/api";
import type { Sale, SalePaymentInput, PeriodQuery } from "@/types/api";

function withToken() {
  return { token: getToken() };
}

export const salesClient = {
  // POST /api/sales
  create: (data: {
    payments: SalePaymentInput[];
    items: { productCode: string; quantity: number }[];
    notes?: string | null;
  }) =>
    apiClient.post<Sale>("/sales", {
      ...withToken(),
      body: data,
    }),

  // GET /api/sales
  list: () =>
    apiClient.get<Sale[]>("/sales", {
      ...withToken(),
    }),

  // GET /api/sales/export: descarga el CSV (sin periodo = mes en curso)
  exportCsv: (period?: PeriodQuery | null) =>
    apiClient.download("/sales/export", { ...withToken(), query: { ...period } }),

  // GET /api/sales/:id
  getById: (id: string) =>
    apiClient.get<Sale>(`/sales/${id}`, {
      ...withToken(),
    }),

  // POST /api/sales/:id/cancel
  cancel: (id: string, reason: string) =>
    apiClient.post<Sale>(`/sales/${id}/cancel`, {
      ...withToken(),
      body: { reason },
    }),
};
