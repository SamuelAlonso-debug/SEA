// src/lib/sales-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import { getToken } from "@/lib/auth-client";
import type { Sale, PaymentMethod } from "@/types/api";

function withToken() {
  return { token: getToken() };
}

export const salesClient = {
  // POST /api/sales
  create: (data: {
    paymentMethod: PaymentMethod;
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

  // GET /api/sales/:id
  getById: (id: string) =>
    apiClient.get<Sale>(`/sales/${id}`, {
      ...withToken(),
    }),
};
