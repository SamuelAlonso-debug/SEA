import prisma from "../config/prisma";
import {
  CreateProductInput,
  UpdateProductInput,
} from "../schemas/product.schema";
import { ProductDto } from "../dtos/product.dto";
import { Prisma } from "@prisma/client";

export const createProduct = async (
  data: CreateProductInput
): Promise<ProductDto> => {
  const existing = await prisma.product.findUnique({
    where: { productCode: data.productCode },
  });

  if (existing) {
    const updated = await prisma.product.update({
      where: { productCode: data.productCode },
      data: {
        name: data.name ?? existing.name,
        category: data.category ?? existing.category,
        provider: data.provider ?? existing.provider,
        imageUrl: data.imageUrl ?? existing.imageUrl,
        price: data.price ?? existing.price,
        stock: existing.stock + data.stock,  // 🔥 SUMA DE STOCK
      },
    });

    return updated;
  }

  // 🆕 Si NO existe → crear uno nuevo
  const product = await prisma.product.create({
    data: {
      name: data.name,
      productCode: data.productCode,
      category: data.category ?? null,
      price: data.price,
      stock: data.stock,
      provider: data.provider ?? null,
      imageUrl: data.imageUrl ?? null,
    },
  });

  return product;
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

  if (data.stock !== undefined) {
    updateData.stock = data.stock;
  }

  if (data.provider !== undefined) {
    updateData.provider = data.provider ?? null;
  }

  if (data.imageUrl !== undefined) {
    updateData.imageUrl = data.imageUrl ?? null;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
  });

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