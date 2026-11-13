// src/services/expense.service.ts

import prisma from "../config/prisma";
import {
  CreateExpenseInput,
  UpdateExpenseInput,
} from "../schemas/expense.schema";
import {
  ExpenseDto,
  ExpenseListFilters,
  ExpenseListResult,
  ExpenseKpisDto,
} from "../dtos/expense.dto";
import { ExpenseCategory } from "@prisma/client";

export const createExpense = async (
  data: CreateExpenseInput
): Promise<ExpenseDto> => {
  const expense = await prisma.expense.create({
    data: {
      concept: data.concept,
      category: data.category as ExpenseCategory,
      amount: data.amount,
      date: data.date ? new Date(data.date as any) : new Date(),
      paymentMethod: data.paymentMethod ?? null,
      vendor: data.vendor ?? null,
      notes: data.notes ?? null,
    },
  });

  return expense;
};

export const updateExpense = async (
  id: string,
  data: UpdateExpenseInput
): Promise<ExpenseDto> => {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    throw new Error("Gasto no encontrado");
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      concept: data.concept ?? expense.concept,
      category: (data.category as ExpenseCategory) ?? expense.category,
      amount: data.amount ?? expense.amount,
      date: data.date ? new Date(data.date as any) : expense.date,
      paymentMethod:
        data.paymentMethod !== undefined
          ? data.paymentMethod
          : expense.paymentMethod,
      vendor:
        data.vendor !== undefined ? data.vendor : expense.vendor,
      notes:
        data.notes !== undefined ? data.notes : expense.notes,
    },
  });

  return updated;
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    throw new Error("Gasto no encontrado");
  }

  await prisma.expense.delete({ where: { id } });
};

export const getExpenseById = async (id: string): Promise<ExpenseDto> => {
  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense) {
    throw new Error("Gasto no encontrado");
  }

  return expense;
};

export const listExpenses = async (
  filters: ExpenseListFilters
): Promise<ExpenseListResult> => {
  const where: any = {};

  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) where.date.gte = filters.from;
    if (filters.to) where.date.lte = filters.to;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  const total = await prisma.expense.count({ where });

  const data = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  });

  return {
    data,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
  };
};

export const getMonthlyExpenseKpis = async (): Promise<ExpenseKpisDto> => {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth(); // 0-11

  const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const startOfNextMonth = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);

  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
  });

  let totalAmountMonth = 0;
  const byCategory = new Map<ExpenseCategory, number>();

  for (const e of expenses) {
    totalAmountMonth += e.amount;
    const current = byCategory.get(e.category) ?? 0;
    byCategory.set(e.category, current + e.amount);
  }

  const totalByCategory = Array.from(byCategory.entries()).map(
    ([category, amount]) => ({
      category,
      amount,
    })
  );

  return {
    month: monthIndex + 1,         
    year,
    totalAmountMonth,
    totalCountMonth: expenses.length,
    totalByCategory,
  };
};
