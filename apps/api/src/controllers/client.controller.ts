import { Request, Response } from "express";
import {
  createClientSchema,
  updateClientSchema,
  listClientsQuerySchema,
} from "../schemas/client.schema";
import {
  listClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientSales,
  // asegúrate de tener esto si ya existe el servicio
  // getClientSales,
} from "../services/client.service";

export const listClientsHandler = async (req: Request, res: Response) => {
  try {
    const parsed = listClientsQuerySchema.parse(req.query);

    const result = await listClients(
      parsed.search,
      parsed.page,
      parsed.pageSize
    );

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Errores de validación",
        errors: error.errors,
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
        errors: error.errors,
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
        errors: error.errors,
      });
    }
    return res
      .status(400)
      .json({ message: error.message || "Error al actualizar cliente" });
  }
};

export const deleteClientHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;
    await deleteClient(id);
    return res.status(204).send();
  } catch (error: any) {
    return res
      .status(400)
      .json({ message: error.message || "Error al eliminar cliente" });
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
    return res.status(200).json(sales);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Error al obtener ventas del cliente",
    });
  }
};