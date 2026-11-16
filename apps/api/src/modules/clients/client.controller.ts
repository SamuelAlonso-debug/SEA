import { Request, Response } from "express";
import {
  createClientSchema,
  updateClientSchema,
  listClientsQuerySchema,
} from "./client.schema";
import {
  listClients,
  getClientById,
  createClient,
  updateClient,
  deactivateClient,
  activateClient,
  getClientSales,
} from "./client.service";

// Sin try/catch: Express 5 lleva los errores (Zod, dominio, BD) al middleware central.
// `req.params.id` llega validado como ObjectId por router.param.

export const listClientsHandler = async (req: Request, res: Response) => {
  res.status(200).json(await listClients(listClientsQuerySchema.parse(req.query)));
};

export const getClientHandler = async (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json(await getClientById(req.params.id));
};

export const createClientHandler = async (req: Request, res: Response) => {
  res.status(201).json(await createClient(createClientSchema.parse(req.body)));
};

export const updateClientHandler = async (req: Request<{ id: string }>, res: Response) => {
  const client = await updateClient(req.params.id, updateClientSchema.parse(req.body));
  res.status(200).json(client);
};

const NOT_FOUND = { message: "Cliente no encontrado" };

export const deleteClientHandler = async (req: Request<{ id: string }>, res: Response) => {
  return (await deactivateClient(req.params.id)) ? res.status(204).send() : res.status(404).json(NOT_FOUND);
};

export const activateClientHandler = async (req: Request<{ id: string }>, res: Response) => {
  const client = await activateClient(req.params.id);
  return client ? res.status(200).json(client) : res.status(404).json(NOT_FOUND);
};

export const getClientSalesHandler = async (req: Request<{ id: string }>, res: Response) => {
  const sales = await getClientSales(req.params.id);
  return sales ? res.status(200).json(sales) : res.status(404).json(NOT_FOUND);
};
