import prisma from "../config/prisma";
import {
  CreateClientInput,
  UpdateClientInput,
} from "../schemas/client.schema";
import {
  ClientDto,
  ClientListResult,
  ClientSalesSummaryDto,
} from "../dtos/client.dto";

export const listClients = async (
  search: string | undefined,
  page: number,
  pageSize: number
): Promise<ClientListResult> => {
  const where: any = {};

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

export const deleteClient = async (id: string): Promise<void> => {
  const existing = await prisma.client.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Cliente no encontrado");
  }

  // Borrado físico. Si quieres soft-delete, habría que agregar isActive al modelo.
  await prisma.client.delete({ where: { id } });
};

// Opcional / futuro: ventas de un cliente
// Esto asume que el modelo Sale tiene un campo clientId que referencia a Client.
// Si aún no lo tienes, tendrías que añadirlo en schema.prisma.
export const getClientSales = async (
  clientId: string
): Promise<ClientSalesSummaryDto[]> => {
  const sales = await prisma.sale.findMany({
    where: { clientId }, // <-- requiere campo clientId en Sale
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