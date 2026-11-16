import { z } from "zod";
import { PaymentMethod, SalePayment } from "@prisma/client";
import type { SalePaymentInput } from "./sale.schema";

// Igual que computeTotals: se compara en centavos enteros para no arrastrar residuos de coma flotante.
export const toCents = (value: number) => Math.round(value * 100);

// Valida que los pagos cubran exactamente el total y calcula el cambio, que solo sale del efectivo.
// Lanza ZodError para que la API responda igual que el resto de errores de validación (path + message).
export function settlePayments(payments: SalePaymentInput[], total: number): SalePayment[] {
  const paidCents = payments.reduce((sum, p) => sum + toCents(p.amount), 0);
  if (paidCents !== toCents(total)) {
    const message = `Los pagos suman ${(paidCents / 100).toFixed(2)} y el total es ${total.toFixed(2)}`;
    throw new z.ZodError([{ code: "custom", path: ["payments"], message, input: payments }]);
  }

  return payments.map((p) => {
    const amount = toCents(p.amount);
    const received = p.method === "CASH" && p.received !== undefined ? toCents(p.received) : null;
    return {
      method: p.method,
      amount: amount / 100,
      received: received === null ? null : received / 100,
      change: received === null ? null : (received - amount) / 100,
      reference: p.reference ?? null,
    };
  });
}

// Ventas previas a #82 no tienen pagos: se leen como un solo pago de su paymentMethod por el total.
export function salePayments(sale: { payments: SalePayment[]; paymentMethod: PaymentMethod; total: number }): SalePayment[] {
  if (sale.payments.length) return sale.payments;
  return [{ method: sale.paymentMethod, amount: sale.total, received: null, change: null, reference: null }];
}

// Resumen en paymentMethod para lecturas que aún esperan un solo método (historial del cliente).
export function mainPaymentMethod(payments: SalePayment[]): PaymentMethod {
  return payments.reduce((main, p) => (p.amount > main.amount ? p : main)).method;
}
