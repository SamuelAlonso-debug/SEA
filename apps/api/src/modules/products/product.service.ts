import prisma from "../../shared/prisma";
import {
  CreateProductInput,
  UpdateProductInput,
  StockEntryInput,
} from "./product.schema";
import { ProductDto } from "./product.dto";
import { Prisma } from "@prisma/client";

export class ProductError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const codeTaken = (code: string) => new ProductError(409, `Ya existe un producto con el código ${code}`);

// P2002: alta o edición simultánea con el mismo código; el índice único decide.
const rethrowCodeTaken = (code: string | undefined) => (error: any) => {
  throw error?.code === "P2002" && code ? codeTaken(code) : error;
};

export const createProduct = async (
  data: CreateProductInput
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
      },
    })
    .catch(rethrowCodeTaken(data.productCode));
};

// Incremento atómico ($inc): entradas simultáneas no se pisan.
export const addStock = async (id: string, data: StockEntryInput): Promise<ProductDto> => {
  const { count } = await prisma.product.updateMany({
    where: { id },
    data: { stock: { increment: data.quantity } },
  });
  if (count === 0) throw new ProductError(404, "Producto no encontrado");
  return getProductById(id);
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
    throw new Error("Producto no encontrado");
  }

  return product;
};

export const updateProduct = async (
  id: string,
  data: UpdateProductInput
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

  if (data.stock !== undefined) {
    updateData.stock = data.stock;
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

export const deleteProduct = async (id: string): Promise<ProductDto> => {
  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return updated;
};

export const activateProduct = async (id: string): Promise<ProductDto> => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new Error("Producto no encontrado");
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
    throw new Error("Producto no encontrado");
  }

  return product;
};