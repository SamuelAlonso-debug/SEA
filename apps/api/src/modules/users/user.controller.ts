import { Request, Response } from "express";
import { createUserSchema } from "../auth/auth.schema";
import { createUser, listUsers } from "../auth/auth.service";

// Sin try/catch: Express 5 lleva los errores (Zod, dominio, BD) al middleware central.
export const createUserHandler = async (req: Request, res: Response) => {
  return res.status(201).json(await createUser(createUserSchema.parse(req.body)));
};

export const listUsersHandler = async (req: Request, res: Response) => {
  return res.status(200).json(await listUsers());
};
