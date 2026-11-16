import prisma from "../../shared/prisma";
import { MovementsQueryInput, StockEntryInput, StockMovementInput } from "./product.schema";
import { CreateProductDto, ProductDto, UpdateProductDto } from "./product.dto";
import { Prisma, StockMovementType } from "@prisma/client";
import { withRetry } from "../../shared/with-retry";
import { ConflictError, NotFoundError } from "../../shared/errors";

const NOT_FOUND = "Producto no encontrado";
const codeTaken = (code: string) => new ConflictError(`Ya existe un producto con el código ${code}`);

// P2002: alta o edición simultánea con el mismo código; el índice único decide.
const rethrowCodeTaken = (code: string | undefined) => (error: any) => {
  throw error?.code === "P2002" && code ? codeTaken(code) : error;
};

export const createProduct = async (
  data: CreateProductDto,
  userId?: string
): Promise<ProductDto> => {
  // Un alta duplicada no toca stock ni precio: la entrada de stock va por addStock.
  if (await prisma.product.findUnique({ where: { productCode: data.productCode } })) {
    throw codeTaken(data.productCode);
  }

  return prisma.product
    .create({
      data: {
        name: data.name,
        productCode: data.productCode,
        category: data.category ?? null,
        price: data.price,
        cost: data.cost,
        stock: data.stock,
        provider: data.provider ?? null,
        imageUrl: data.imageUrl ?? null,
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        // El stock del alta también deja movimiento: la suma de movimientos = stock.
        ...(data.stock > 0 && {
          movements: {
            create: { type: "ADJUSTMENT", quantity: data.stock, stockAfter: data.stock, reason: "Stock inicial", userId: userId ?? null },
          },
        }),
      },
    })
    .catch(rethrowCodeTaken(data.productCode));
};

type Movement = { type: StockMovementType; quantity: number; reason?: string | undefined; userId?: string | undefined };

// Aplica la cantidad (con signo) y registra el movimiento en la misma transacción. El descuento
// es condicional: nunca deja stock negativo. Cambios simultáneos chocan (P2034) y withRetry reintenta,
// así cada movimiento guarda su propio stockAfter.
const moveStock = (productId: string, { reason, userId, ...movement }: Movement) =>
  withRetry(() =>
    prisma.$transaction(async (tx) => {
      const { count } = await tx.product.updateMany({
        where: { id: productId, ...(movement.quantity < 0 && { stock: { gte: -movement.quantity } }) },
        data: { stock: { increment: movement.quantity } },
      });
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundError(NOT_FOUND);
      if (count === 0) throw new ConflictError(`Stock insuficiente: disponible ${product.stock}`);
      await tx.stockMovement.create({
        data: { productId, ...movement, stockAfter: product.stock, reason: reason ?? null, userId: userId ?? null },
      });
      return product;
    })
  );

export const addStock = (id: string, data: StockEntryInput, userId?: string): Promise<ProductDto> =>
  moveStock(id, { type: "PURCHASE", ...data, userId });

export const createMovement = (id: string, data: StockMovementInput, userId?: string): Promise<ProductDto> =>
  moveStock(id, { ...data, userId });

export const listMovements = async (productId: string, { page, pageSize }: MovementsQueryInput) => {
  if (!(await prisma.product.findUnique({ where: { id: productId } }))) {
    throw new NotFoundError(NOT_FOUND);
  }
  const where = { productId };
  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true, lastname: true } } },
    }),
  ]);
  const data = movements.map(({ user, ...m }) => ({ ...m, userName: user ? `${user.name} ${user.lastname}` : null }));
  return { data, total, page, pageSize };
};

export const listProducts = async (): Promise<ProductDto[]> => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return products;
};

export const getProductById = async (id: string): Promise<ProductDto> => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new NotFoundError(NOT_FOUND);
  }

  return product;
};

export const updateProduct = async (
  id: string,
  data: UpdateProductDto
): Promise<ProductDto> => {
  await getProductById(id);

  if (data.productCode !== undefined) {
    const other = await prisma.product.findUnique({ where: { productCode: data.productCode } });
    if (other && other.id !== id) throw codeTaken(data.productCode);
  }

  const updateData: Prisma.ProductUpdateInput = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.productCode !== undefined) {
    updateData.productCode = data.productCode;
  }

  if (data.category !== undefined) {
    updateData.category = data.category ?? null;
  }

  if (data.price !== undefined) {
    updateData.price = data.price;
  }

  if (data.cost !== undefined) {
    updateData.cost = data.cost;
  }

  if (data.provider !== undefined) {
    updateData.provider = data.provider ?? null;
  }

  if (data.imageUrl !== undefined) {
    updateData.imageUrl = data.imageUrl ?? null;
  }

  if (data.minStock !== undefined) {
    updateData.minStock = data.minStock;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
  }).catch(rethrowCodeTaken(data.productCode));

  return updated;
};

// P2025: el producto no existe.
export const deleteProduct = (id: string): Promise<ProductDto> =>
  prisma.product.update({ where: { id }, data: { isActive: false } }).catch((error) => {
    throw error?.code === "P2025" ? new NotFoundError(NOT_FOUND) : error;
  });

export const activateProduct = async (id: string): Promise<ProductDto> => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new NotFoundError(NOT_FOUND);
  }

  if (product.isActive) {
    return product; // ya está activo
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      isActive: true,
    },
  });

  return updated;
};

export const getProductByCode = async (
  productCode: string
): Promise<ProductDto> => {
  const product = await prisma.product.findUnique({
    where: { productCode },
  });

  if (!product) {
    throw new NotFoundError(NOT_FOUND);
  }

  return product;
};