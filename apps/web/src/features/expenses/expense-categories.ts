// src/constants/expense-categories.ts

import type { ExpenseCategory, ExpensePaymentMethod } from "@/types/api";

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

// Mismo catálogo que ventas (enum PaymentMethod de la API).
export const EXPENSE_PAYMENT_METHODS: { value: ExpensePaymentMethod; label: string }[] = [
  { value: "CASH", label: "Efectivo" },
  { value: "CARD", label: "Tarjeta" },
  { value: "TRANSFER", label: "Transferencia" },
];

export const EXPENSE_PAYMENT_METHOD_LABELS = Object.fromEntries(
  EXPENSE_PAYMENT_METHODS.map((m) => [m.value, m.label])
) as Record<ExpensePaymentMethod, string>;
