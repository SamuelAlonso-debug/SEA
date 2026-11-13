// src/constants/expense-categories.ts

import type { ExpenseCategory } from "@/lib/expenses-client";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "service", label: "Servicios" },
  { value: "merchandise", label: "Mercancía" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "rent", label: "Renta" },
  { value: "payroll", label: "Nómina" },
  { value: "tax", label: "Impuestos" },
  { value: "other", label: "Otros" },
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  service: "Servicios",
  merchandise: "Mercancía",
  maintenance: "Mantenimiento",
  rent: "Renta",
  payroll: "Nómina",
  tax: "Impuestos",
  other: "Otros",
};
