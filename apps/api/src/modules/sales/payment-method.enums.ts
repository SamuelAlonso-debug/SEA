import { PaymentMethod } from "@prisma/client";

// Record exhaustivo: añadir un valor al enum de Prisma obliga a etiquetarlo aquí.
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
};
