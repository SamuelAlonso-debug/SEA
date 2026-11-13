import prisma from "../config/prisma";
import { CreateSaleInput } from "../schemas/sale.schema";
import { SaleDto, SaleItemDto } from "../dtos/sale.dto";
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
    items,
  };
}

// Generar número de ticket tipo 0000001
async function generateNextTicketNumber(tx: any): Promise<string> {
  const count = await tx.sale.count();
  const next = count + 1;
  return next.toString().padStart(7, "0");
}

export const createSale = async (
  data: CreateSaleInput,
  userId?: string
): Promise<SaleDto> => {
  return prisma.$transaction(async (tx) => {
    let subtotal = 0;

    const saleItemsToCreate: any[] = [];

    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { productCode: item.productCode },
      });

      if (!product || !product.isActive) {
        throw new Error(
          `Producto ${item.productCode} no encontrado o inactivo`
        );
      }

      if (product.stock < item.quantity) {
        throw new Error(
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

      // Descontar stock
      await tx.product.update({
        where: { id: product.id },
        data: { stock: product.stock - item.quantity },
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

    const sale = await tx.sale.create({
      data: saleData,
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return mapSaleToDto(sale);
  });
};

export const listSales = async (): Promise<SaleDto[]> => {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
    },
  });

  return sales.map((sale: any) => mapSaleToDto(sale));
};

export const getSaleById = async (id: string): Promise<SaleDto> => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
    },
  });

  if (!sale) {
    throw new Error("Venta no encontrada");
  }

  return mapSaleToDto(sale);
};
