

import { PaymentMethod } from "@prisma/client";

export interface ClientDto {
  id: string;
  name: string;
  lastname: string;
  phone: string;
  email?: string | null;
  street?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientListResult {
  data: ClientDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientSalesSummaryDto {
  id: string;
  date: Date;
  total: number;
  paymentMethod: PaymentMethod;
}
