// src/lib/expenses-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import { getToken } from "@/lib/auth-client";
import type {
  ExpenseCategory,
  ExpenseDto,
  ExpensesListResponse,
  ExpensesKpisResponse,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from "@/types/api";

export type GetExpensesParams = {
  from?: string; // ISO
  to?: string; // ISO
  category?: ExpenseCategory;
  page?: number;
  pageSize?: number;
};

function withToken() {
  return { token: getToken() };
}

/**
 * Cliente principal de gastos, siguiendo el mismo patrón que kpisClient.
 */
export const expensesClient = {
  // GET /api/expenses
  list: (params: GetExpensesParams = {}) =>
    apiClient.get<ExpensesListResponse>("/expenses", {
      ...withToken(),
      query: params,
    }),

  // GET /api/expenses/kpis
  getKpis: () =>
    apiClient.get<ExpensesKpisResponse>("/expenses/kpis", {
      ...withToken(),
    }),

  // POST /api/expenses
  create: (input: CreateExpenseRequest) =>
    apiClient.post<ExpenseDto>("/expenses", {
      ...withToken(),
      body: input, // 👈 el body va dentro de options
    }),

  // GET /api/expenses/:id
  getById: (id: string) =>
    apiClient.get<ExpenseDto>(`/expenses/${id}`, {
      ...withToken(),
    }),

  // PUT /api/expenses/:id
  update: (id: string, input: UpdateExpenseRequest) =>
    apiClient.put<ExpenseDto>(`/expenses/${id}`, {
      ...withToken(),
      body: input, // 👈 igual aquí
    }),

  // DELETE /api/expenses/:id
  remove: (id: string) =>
    apiClient.delete<void>(`/expenses/${id}`, {
      ...withToken(),
    }),
};

/**
 * Wrappers para que el resto del código pueda seguir usando
 * getExpenses, getExpensesKpis, createExpense, etc.
 */

export const getExpenses = (params?: GetExpensesParams) =>
  expensesClient.list(params ?? {});

export const getExpensesKpis = () => expensesClient.getKpis();

export const createExpense = (input: CreateExpenseRequest) =>
  expensesClient.create(input);

export const getExpenseById = (id: string) => expensesClient.getById(id);

export const updateExpense = (id: string, input: UpdateExpenseRequest) =>
  expensesClient.update(id, input);

export const deleteExpense = (id: string) => expensesClient.remove(id);

// Re-export de tipos por conveniencia
export type {
  ExpenseCategory,
  ExpenseDto,
  ExpensesListResponse,
  ExpensesKpisResponse,
  CreateExpenseRequest,
  UpdateExpenseRequest,
};
