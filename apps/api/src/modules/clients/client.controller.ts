import { Request, Response } from "express";
import {
  createClientSchema,
  updateClientSchema,
  listClientsQuerySchema,
  clientIdParamsSchema,
} from "./client.schema";
import {
  listClients,
  getClientById,
  createClient,
  updateClient,
  deactivateClient,
  activateClient,
  getClientSales,
  // asegúrate de tener esto si ya existe el servicio
  // getClientSales,
} from "./client.service";

export const listClientsHandler = async (req: Request, res: Response) => {
  try {
    const parsed = listClientsQuerySchema.parse(req.query);

    const result = await listClients(
      parsed.search,
      parsed.page,
      parsed.pageSize,
      parsed.includeInactive
    );

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Errores de validación",
        errors: error.issues,
      });
    }
    return res
      .status(500)
      .json({ message: error.message || "Error al listar clientes" });
  }
};

// 👇 Aquí tipamos que el param `id` es string
export const getClientHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const client = await getClientById(id);
    return res.status(200).json(client);
  } catch (error: any) {
    return res
      .status(404)
      .json({ message: error.message || "Cliente no encontrado" });
  }
};

export const createClientHandler = async (req: Request, res: Response) => {
  try {
    const parsed = createClientSchema.parse(req.body);
    const client = await createClient(parsed);
    return res.status(201).json(client);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Errores de validación",
        errors: error.issues,
      });
    }
    return res
      .status(400)
      .json({ message: error.message || "Error al crear cliente" });
  }
};

export const updateClientHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const parsed = updateClientSchema.parse(req.body);
    const client = await updateClient(id, parsed);
    return res.status(200).json(client);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Errores de validación",
        errors: error.issues,
      });
    }
    return res
      .status(400)
      .json({ message: error.message || "Error al actualizar cliente" });
  }
};

const NOT_FOUND = { message: "Cliente no encontrado" };

export const deleteClientHandler = async (req: Request<{ id: string }>, res: Response) => {
  const params = clientIdParamsSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ message: "Errores de validación", errors: params.error.issues });
  }
  try {
    return (await deactivateClient(params.data.id)) ? res.status(204).send() : res.status(404).json(NOT_FOUND);
  } catch {
    return res.status(500).json({ message: "Error al dar de baja al cliente" });
  }
};

export const activateClientHandler = async (req: Request<{ id: string }>, res: Response) => {
  const params = clientIdParamsSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ message: "Errores de validación", errors: params.error.issues });
  }
  try {
    const client = await activateClient(params.data.id);
    return client ? res.status(200).json(client) : res.status(404).json(NOT_FOUND);
  } catch {
    return res.status(500).json({ message: "Error al reactivar al cliente" });
  }
};

// (Opcional / futuro) ventas de un cliente
export const getClientSalesHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const sales = await getClientSales(id);
    if (!sales) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    return res.status(200).json(sales);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Error al obtener ventas del cliente",
    });
  }
};