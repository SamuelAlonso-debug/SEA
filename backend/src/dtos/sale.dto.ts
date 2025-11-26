import { PaymentMethod } from "@prisma/client";

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
  paymentMethod: PaymentMethod;
  notes?: string | null;
  items: SaleItemDto[];
}
