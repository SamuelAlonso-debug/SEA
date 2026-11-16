// src/lib/products-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import { getToken } from "@/features/auth/api";
import type { Product, StockMovementsResponse } from "@/types/api";

function withToken() {
  return { token: getToken() };
}

export const productsClient = {
  // GET /api/products
  list: () =>
    apiClient.get<Product[]>("/products", {
      ...withToken(),
    }),

  // GET /api/products/export: descarga el CSV del catálogo
  exportCsv: () => apiClient.download("/products/export", { ...withToken() }),

  // GET /api/products/:id
  getById: (id: string) =>
    apiClient.get<Product>(`/products/${id}`, {
      ...withToken(),
    }),

  // POST /api/products
  create: (data: {
    name: string;
    productCode: string;
    category?: string | null;
    price: number;
    cost: number;
    stock: number;
    provider?: string | null;
    imageUrl?: string | null;
    minStock?: number;
  }) =>
    apiClient.post<Product>("/products", {
      ...withToken(),
      body: data,
    }),

  // PUT /api/products/:id
  update: (
    id: string,
    data: Partial<{
      name: string;
      productCode: string;
      category?: string | null;
      price: number;
      provider?: string | null;
      imageUrl?: string | null;
      isActive: boolean;
    }>
  ) =>
    apiClient.put<Product>(`/products/${id}`, {
      ...withToken(),
      body: data,
    }),

  // POST /api/products/:id/stock: entrada de stock (incremento atómico)
  addStock: (id: string, quantity: number) =>
    apiClient.post<Product>(`/products/${id}/stock`, {
      ...withToken(),
      body: { quantity },
    }),

  // GET /api/products/:id/movements: historial paginado, más reciente primero
  movements: (id: string, page: number) =>
    apiClient.get<StockMovementsResponse>(`/products/${id}/movements`, {
      ...withToken(),
      query: { page, pageSize: 10 },
    }),

  // POST /api/products/:id/movements: merma o ajuste con motivo
  addMovement: (id: string, body: { type: "WASTE" | "ADJUSTMENT"; quantity: number; reason: string }) =>
    apiClient.post<Product>(`/products/${id}/movements`, {
      ...withToken(),
      body,
    }),

  // DELETE lógico /api/products/:id
  delete: (id: string) =>
    apiClient.delete<Product>(`/products/${id}`, {
      ...withToken(),
    }),


    getByCode: (code: string) =>
  apiClient.get<Product>(`/products/code/${code}`, { ...withToken()

   }),
   
};
