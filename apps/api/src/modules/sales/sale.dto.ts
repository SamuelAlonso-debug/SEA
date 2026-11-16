import { PaymentMethod, SalePayment, SaleStatus } from "@prisma/client";

export interface SaleItemDto {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleDto {
  id: string;
  ticketNumber: string;
  createdAt: Date;
  updatedAt: Date;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod; // método del pago mayor (compatibilidad)
  payments: SalePayment[];
  change: number; // cambio total entregado en efectivo
  notes?: string | null;
  clientId: string | null;
  clientName: string | null;
  status: SaleStatus;
  cancelReason: string | null;
  cancelledAt: Date | null;
  items: SaleItemDto[];
}
