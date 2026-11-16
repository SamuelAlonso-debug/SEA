import prisma from "../../shared/prisma";
import { CreateSaleInput } from "./sale.schema";
import { SaleDto, SaleItemDto } from "./sale.dto";
import { Prisma } from "@prisma/client";
import { computeTotals } from "./sale.totals";
import { mainPaymentMethod, salePayments, settlePayments, toCents } from "./sale.payments";
import { withRetry } from "../../shared/with-retry";
import { paged, Cell } from "../../shared/csv";
import { businessStamp, Period, rangeOf } from "../../shared/business-time";

type SaleWithRelations = Prisma.SaleGetPayload<{
  include: { items: { include: { product: true } }; client: { select: { name: true; lastname: true } } };
}>;

// Mapea el objeto de Prisma (con items + product) a nuestro DTO
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
  const payments = salePayments(sale);

  return {
    id: sale.id,
    ticketNumber: sale.ticketNumber,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
    subtotal: sale.subtotal,
    tax: sale.tax,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    payments,
    change: payments.reduce((sum, p) => sum + toCents(p.change ?? 0), 0) / 100,
    notes: sale.notes,
    clientId: sale.clientId ?? null,
    clientName: sale.client ? `${sale.client.name} ${sale.client.lastname}` : null,
    status: sale.status ?? "COMPLETED",
    cancelReason: sale.cancelReason ?? null,
    cancelledAt: sale.cancelledAt ?? null,
    items,
  };
}

export class SaleError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Ventas que cuentan como ingreso. Las previas a `status` no tienen el campo.
export const notCancelled = {
  OR: [{ status: { not: "CANCELLED" } }, { status: { isSet: false } }],
} satisfies Prisma.SaleWhereInput;

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
    const movements: Prisma.StockMovementCreateManyInput[] = [];

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

      // Lectura y descuento en la misma transacción: un cambio concurrente aborta y se reintenta.
      movements.push({
        productId: product.id,
        type: "SALE",
        quantity: -item.quantity,
        stockAfter: product.stock - item.quantity,
        userId: userId ?? null,
      });

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
    // Si no cuadra, la transacción se aborta y el stock descontado vuelve.
    const payments = settlePayments(data.payments, total);
    const ticketNumber = await generateNextTicketNumber(tx);

    // Construimos el data aparte para evitar problemas con exactOptionalPropertyTypes
    const saleData: Prisma.SaleCreateInput = {
      ticketNumber,
      subtotal,
      tax,
      total,
      paymentMethod: mainPaymentMethod(payments),
      payments,
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

    await tx.stockMovement.createMany({ data: movements.map((m) => ({ ...m, saleId: sale.id })) });

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

const money = (cents: number) => (cents / 100).toFixed(2);

// Filas del CSV: una por ítem. El IVA del ticket se reparte por acumulado redondeado,
// así la suma de `Total` de un ticket es exactamente el total de la venta.
export async function* saleExportRows(period: Period): AsyncGenerator<Cell[]> {
  const { start, end } = rangeOf(period);
  const sales = paged((page) =>
    prisma.sale.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: {
        items: { include: { product: { select: { productCode: true, name: true } } }, orderBy: { id: "asc" } },
        client: { select: { name: true, lastname: true } },
        user: { select: { name: true, lastname: true } },
      },
      ...page,
    })
  );

  for await (const sale of sales) {
    const taxCents = Math.round(sale.tax * 100);
    const subtotalCents = sale.items.reduce((sum, i) => sum + Math.round(i.subtotal * 100), 0);
    let running = 0;
    let allocated = 0;
    for (const item of sale.items) {
      const itemCents = Math.round(item.subtotal * 100);
      running += itemCents;
      const upTo = subtotalCents === 0 ? 0 : Math.round((taxCents * running) / subtotalCents);
      const tax = upTo - allocated;
      allocated = upTo;
      yield [
        sale.ticketNumber,
        businessStamp(sale.createdAt),
        item.product.productCode,
        item.product.name,
        item.quantity,
        item.unitPrice.toFixed(2),
        money(itemCents),
        money(tax),
        money(itemCents + tax),
        sale.paymentMethod,
        sale.client ? `${sale.client.name} ${sale.client.lastname}` : "",
        sale.user ? `${sale.user.name} ${sale.user.lastname}` : "",
      ];
    }
  }
}

// Cancela la venta completa y reintegra todo su stock en la misma transacción.
export const cancelSale = async (id: string, reason: string, userId?: string): Promise<SaleDto> => {
  return withRetry(() => prisma.$transaction(async (tx) => {
    // Marcar antes de reintegrar: con dos cancelaciones simultáneas Mongo aborta una
    // por conflicto de escritura; al reintentar ya no encuentra la venta sin cancelar.
    const { count } = await tx.sale.updateMany({
      where: { id, ...notCancelled },
      data: { status: "CANCELLED", cancelReason: reason, cancelledAt: new Date(), cancelledById: userId ?? null },
    });

    if (count === 0) {
      const exists = await tx.sale.findUnique({ where: { id }, select: { id: true } });
      throw exists
        ? new SaleError(409, "La venta ya está cancelada")
        : new SaleError(404, "Venta no encontrada");
    }

    const items = await tx.saleItem.findMany({ where: { saleId: id } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    const sale = await tx.sale.findUniqueOrThrow({
      where: { id },
      include: {
        items: { include: { product: true } },
        client: { select: { name: true, lastname: true } },
      },
    });

    return mapSaleToDto(sale);
  }));
};
