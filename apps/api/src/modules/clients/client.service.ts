import prisma from "../../shared/prisma";
import { Prisma } from "@prisma/client";
import {
  CreateClientInput,
  UpdateClientInput,
  ListClientsQueryInput,
} from "./client.schema";
import {
  ClientDto,
  ClientListResult,
  ClientSalesSummaryDto,
} from "./client.dto";

export class ClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const EMAIL_TAKEN = "Ya existe un cliente con ese correo";

async function assertEmailFree(email: string | null | undefined, exceptId?: string) {
  if (!email) return;
  const other = await prisma.client.findFirst({
    where: { email, ...(exceptId && { id: { not: exceptId } }) },
  });
  if (other) throw new ClientError(409, EMAIL_TAKEN);
}

// P2002: el índice único parcial creado al desplegar #75 cubre altas simultáneas.
const emailTaken = (error: { code?: string }) => {
  throw error?.code === "P2002" ? new ClientError(409, EMAIL_TAKEN) : error;
};

export const listClients = async ({
  search,
  page,
  pageSize,
  includeInactive,
}: ListClientsQueryInput): Promise<ClientListResult> => {
  const where: Prisma.ClientWhereInput = {};

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
  await assertEmailFree(data.email);

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
  }).catch(emailTaken);

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

  await assertEmailFree(data.email, id);

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
  }).catch(emailTaken);

  return updated;
};

// Baja lógica; false si el cliente no existe.
export const deactivateClient = async (id: string): Promise<boolean> => {
  const { count } = await prisma.client.updateMany({ where: { id }, data: { isActive: false } });
  return count > 0;
};

// Reactivación; null si el cliente no existe.
// P2025: el cliente no existe.
export const activateClient = (id: string): Promise<ClientDto | null> =>
  prisma.client
    .update({ where: { id }, data: { isActive: true } })
    .catch((error) => (error?.code === "P2025" ? null : Promise.reject(error)));

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