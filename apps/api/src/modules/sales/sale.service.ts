import prisma from "../../shared/prisma";
import { CreateSaleInput } from "./sale.schema";
import { SaleDto, SaleItemDto } from "./sale.dto";
import { PaymentMethod } from "@prisma/client";

const IVA_RATE = 0.16; // 16%

// Mapea el objeto de Prisma (con items + product) a nuestro DTO
function mapSaleToDto(sale: any): SaleDto {
  const items: SaleItemDto[] = sale.items.map((i: any) => ({
    id: i.id,
    productId: i.productId,
    productCode: i.product.productCode,
    productName: i.product.name,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    subtotal: i.subtotal,
  }));

  return {
    id: sale.id,
    ticketNumber: sale.ticketNumber,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
    subtotal: sale.subtotal,
    tax: sale.tax,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    notes: sale.notes,
    clientId: sale.clientId ?? null,
    clientName: sale.client ? `${sale.client.name} ${sale.client.lastname}` : null,
    items,
  };
}

export class SaleError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Número de ticket tipo 0000001. El contador arranca tras las ventas ya existentes.
async function generateNextTicketNumber(tx: any): Promise<string> {
  const { seq } = await tx.counter.upsert({
    where: { id: "ticket" },
    create: { id: "ticket", seq: (await tx.sale.count()) + 1 },
    update: { seq: { increment: 1 } },
  });
  return seq.toString().padStart(7, "0");
}

// Mongo aborta la transacción ante un conflicto de escritura (P2034) o un alta
// simultánea del contador (P2002): se reintenta con espera aleatoria creciente.
const MAX_ATTEMPTS = 50;
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (!["P2034", "P2002"].includes(error?.code) || attempt >= MAX_ATTEMPTS) throw error;
      await new Promise((r) => setTimeout(r, Math.random() * 10 * attempt));
    }
  }
}

export const createSale = async (
  data: CreateSaleInput,
  userId?: string
): Promise<SaleDto> => {
  return withRetry(() => prisma.$transaction(async (tx) => {
    let subtotal = 0;

    const saleItemsToCreate: any[] = [];

    if (data.clientId) {
      const client = await tx.client.findUnique({ where: { id: data.clientId } });
      if (!client) throw new SaleError(404, "Cliente no encontrado");
      if (client.isActive === false) throw new SaleError(409, "El cliente está dado de baja");
    }

    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { productCode: item.productCode },
      });

      if (!product) {
        throw new SaleError(404, `Producto ${item.productCode} no encontrado`);
      }

      if (!product.isActive) {
        throw new SaleError(409, `El producto ${item.productCode} está inactivo`);
      }

      // Descuento condicional: nunca deja stock negativo aunque haya ventas simultáneas.
      const { count } = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (count === 0) {
        throw new SaleError(
          409,
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
        );
      }

      const unitPrice = product.price;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal * 0.84;

      // Relación correcta: usamos "product" en vez de "productId"
      saleItemsToCreate.push({
        product: { connect: { id: product.id } },
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    const tax = subtotal * IVA_RATE;
    const total = subtotal;
    const ticketNumber = await generateNextTicketNumber(tx);

    // Construimos el data aparte para evitar problemas con exactOptionalPropertyTypes
    const saleData: any = {
      ticketNumber,
      subtotal,
      tax,
      total,
      paymentMethod: data.paymentMethod as PaymentMethod,
      notes: data.notes ?? null,
      items: {
        create: saleItemsToCreate,
      },
    };

    if (userId) {
      saleData.user = { connect: { id: userId } };
    }

    if (data.clientId) {
      saleData.client = { connect: { id: data.clientId } };
    }

    const sale = await tx.sale.create({
      data: saleData,
      include: {
        items: {
          include: { product: true },
        },
        client: { select: { name: true, lastname: true } },
      },
    });

    return mapSaleToDto(sale);
  }));
};

export const listSales = async (): Promise<SaleDto[]> => {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
      client: { select: { name: true, lastname: true } },
    },
  });

  return sales.map((sale: any) => mapSaleToDto(sale));
};

export const getSaleById = async (id: string): Promise<SaleDto> => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      client: { select: { name: true, lastname: true } },
    },
  });

  if (!sale) {
    throw new Error("Venta no encontrada");
  }

  return mapSaleToDto(sale);
};
