import { ExpenseCategory } from "@prisma/client";

export interface ExpenseDto {
  id: string;
  concept: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  paymentMethod?: string | null;
  vendor?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseListFilters {
  from?: Date;
  to?: Date;
  category?: ExpenseCategory;
  page: number;
  pageSize: number;
}

export interface ExpenseListResult {
  data: ExpenseDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExpenseKpisDto {
  month: number;
  year: number;
  totalAmountMonth: number;
  totalCountMonth: number;
  totalByCategory: {
    category: ExpenseCategory;
    amount: number;
  }[];
}
