// src/lib/sales-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import type { Sale, SalePaymentInput, PeriodQuery } from "@/types/api";

export const salesClient = {
  // POST /api/sales
  create: (data: {
    payments: SalePaymentInput[];
    items: { productCode: string; quantity: number }[];
    notes?: string | null;
  }) =>
    apiClient.post<Sale>("/sales", {
      body: data,
    }),

  // GET /api/sales
  list: () =>
    apiClient.get<Sale[]>("/sales"),

  // GET /api/sales/export: descarga el CSV (sin periodo = mes en curso)
  exportCsv: (period?: PeriodQuery | null) =>
    apiClient.download("/sales/export", { query: { ...period } }),

  // GET /api/sales/:id
  getById: (id: string) =>
    apiClient.get<Sale>(`/sales/${id}`),

  // POST /api/sales/:id/cancel
  cancel: (id: string, reason: string) =>
    apiClient.post<Sale>(`/sales/${id}/cancel`, { body: { reason } }),
};
