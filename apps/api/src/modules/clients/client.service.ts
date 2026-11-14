import prisma from "../../shared/prisma";
import {
  CreateClientInput,
  UpdateClientInput,
} from "./client.schema";
import {
  ClientDto,
  ClientListResult,
  ClientSalesSummaryDto,
} from "./client.dto";

export const listClients = async (
  search: string | undefined,
  page: number,
  pageSize: number,
  includeInactive = false
): Promise<ClientListResult> => {
  const where: any = {};

  // Documentos previos sin el campo cuentan como activos (Prisma excluye los ausentes en `not`).
  if (!includeInactive) where.AND = [{ OR: [{ isActive: true }, { isActive: { isSet: false } }] }];

  if (search && search.trim() !== "") {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { lastname: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
    ];
  }

  const total = await prisma.client.count({ where });

  const data = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    data,
    total,
    page,
    pageSize,
  };
};

export const getClientById = async (id: string): Promise<ClientDto> => {
  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    throw new Error("Cliente no encontrado");
  }

  return client;
};

export const createClient = async (
  data: CreateClientInput
): Promise<ClientDto> => {
  const client = await prisma.client.create({
    data: {
      name: data.name,
      lastname: data.lastname,
      phone: data.phone,
      email: data.email ?? null,
      street: data.street ?? null,
      neighborhood: data.neighborhood ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
    },
  });

  return client;
};

export const updateClient = async (
  id: string,
  data: UpdateClientInput
): Promise<ClientDto> => {
  const existing = await prisma.client.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Cliente no encontrado");
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      lastname: data.lastname ?? existing.lastname,
      phone: data.phone ?? existing.phone,
      email:
        data.email !== undefined
          ? data.email
          : existing.email,
      street:
        data.street !== undefined
          ? data.street
          : existing.street,
      neighborhood:
        data.neighborhood !== undefined
          ? data.neighborhood
          : existing.neighborhood,
      city:
        data.city !== undefined
          ? data.city
          : existing.city,
      state:
        data.state !== undefined
          ? data.state
          : existing.state,
    },
  });

  return updated;
};

// Baja lógica; false si el cliente no existe.
export const deactivateClient = async (id: string): Promise<boolean> => {
  const { count } = await prisma.client.updateMany({ where: { id }, data: { isActive: false } });
  return count > 0;
};

// Reactivación; null si el cliente no existe.
export const activateClient = async (id: string): Promise<ClientDto | null> => {
  const { count } = await prisma.client.updateMany({ where: { id }, data: { isActive: true } });
  return count > 0 ? prisma.client.findUnique({ where: { id } }) : null;
};

// Ventas de un cliente; null si el cliente no existe.
export const getClientSales = async (
  clientId: string
): Promise<ClientSalesSummaryDto[] | null> => {
  if (!(await prisma.client.findUnique({ where: { id: clientId } }))) return null;

  const sales = await prisma.sale.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      total: true,
      paymentMethod: true,
    },
  });

  return sales.map((s) => ({
    id: s.id,
    date: s.createdAt,
    total: s.total,
    paymentMethod: s.paymentMethod,
  }));
};