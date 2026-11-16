import prisma from "../../shared/prisma";
import { CreateSaleInput } from "./sale.schema";
import { SaleDto, SaleItemDto } from "./sale.dto";
import { PaymentMethod, Prisma } from "@prisma/client";
import { computeTotals } from "./sale.totals";
import { withRetry } from "../../shared/with-retry";

// Mapea el objeto de Prisma (con items + product) a nuestro DTO
type SaleWithRelations = Prisma.SaleGetPayload<{
  include: { items: { include: { product: true } }; client: { select: { name: true; lastname: true } } };
}>;

function mapSaleToDto(sale: SaleWithRelations): SaleDto {
  const items: SaleItemDto[] = sale.items.map((i) => ({
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
async function generateNextTicketNumber(tx: Prisma.TransactionClient): Promise<string> {
  const counter = await tx.counter.findUnique({ where: { id: "ticket" } });
  const { seq } = counter
    ? await tx.counter.update({ where: { id: "ticket" }, data: { seq: { increment: 1 } } })
    : await tx.counter.create({ data: { id: "ticket", seq: (await tx.sale.count()) + 1 } });
  return seq.toString().padStart(7, "0");
}

export const createSale = async (
  data: CreateSaleInput,
  userId?: string
): Promise<SaleDto> => {
  return withRetry(() => prisma.$transaction(async (tx) => {
    const saleItemsToCreate: Prisma.SaleItemCreateWithoutSaleInput[] = [];

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
      const itemSubtotal = computeTotals([{ unitPrice, quantity: item.quantity }]).subtotal;

      // Relación correcta: usamos "product" en vez de "productId"
      saleItemsToCreate.push({
        product: { connect: { id: product.id } },
        quantity: item.quantity,
        unitPrice,
        unitCost: product.cost ?? null,
        subtotal: itemSubtotal,
      });
    }

    const { subtotal, tax, total } = computeTotals(saleItemsToCreate);
    const ticketNumber = await generateNextTicketNumber(tx);

    // Construimos el data aparte para evitar problemas con exactOptionalPropertyTypes
    const saleData: Prisma.SaleCreateInput = {
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

  return sales.map(mapSaleToDto);
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
