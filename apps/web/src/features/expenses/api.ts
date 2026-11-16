// src/lib/expenses-client.ts
"use client";

import { apiClient } from "@/lib/api-client";
import type {
  ExpenseCategory,
  ExpenseDto,
  ExpensesListResponse,
  ExpensesKpisResponse,
  Compared,
  PeriodQuery,
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

/**
 * Cliente principal de gastos, siguiendo el mismo patrón que kpisClient.
 */
export const expensesClient = {
  // GET /api/expenses
  list: (params: GetExpensesParams = {}) =>
    apiClient.get<ExpensesListResponse>("/expenses", {
      query: params,
    }),

  // GET /api/expenses/kpis
  getKpis: (period?: PeriodQuery | null) =>
    apiClient.get<Compared<ExpensesKpisResponse>>("/expenses/kpis", {
      query: { ...period },
    }),

  // POST /api/expenses
  create: (input: CreateExpenseRequest) =>
    apiClient.post<ExpenseDto>("/expenses", {
      body: input, // 👈 el body va dentro de options
    }),

  // GET /api/expenses/:id
  getById: (id: string) =>
    apiClient.get<ExpenseDto>(`/expenses/${id}`),

  // PUT /api/expenses/:id
  update: (id: string, input: UpdateExpenseRequest) =>
    apiClient.put<ExpenseDto>(`/expenses/${id}`, {
      body: input, // 👈 igual aquí
    }),

  // DELETE /api/expenses/:id
  remove: (id: string) =>
    apiClient.delete<void>(`/expenses/${id}`),
};

/**
 * Wrappers para que el resto del código pueda seguir usando
 * getExpenses, getExpensesKpis, createExpense, etc.
 */

export const getExpenses = (params?: GetExpensesParams) =>
  expensesClient.list(params ?? {});

export const getExpensesKpis = (period?: PeriodQuery | null) => expensesClient.getKpis(period);

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
