// src/lib/products-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import { getToken } from "@/lib/auth-client";
import type { Product } from "@/types/api";

function withToken() {
  return { token: getToken() };
}

export const productsClient = {
  // GET /api/products
  list: () =>
    apiClient.get<Product[]>("/products", {
      ...withToken(),
    }),

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
    stock: number;
    provider?: string | null;
    imageUrl?: string | null;
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
      stock: number;
      provider?: string | null;
      imageUrl?: string | null;
      isActive: boolean;
    }>
  ) =>
    apiClient.put<Product>(`/products/${id}`, {
      ...withToken(),
      body: data,
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
