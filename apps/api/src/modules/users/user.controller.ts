import { Request, Response } from "express";
import { createUserSchema } from "../auth/auth.schema";
import { AuthError, createUser, listUsers } from "../auth/auth.service";

export const createUserHandler = async (req: Request, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
  }

  try {
    return res.status(201).json(await createUser(parsed.data));
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error al crear el usuario" });
  }
};

export const listUsersHandler = async (req: Request, res: Response) => {
  try {
    return res.status(200).json(await listUsers());
  } catch {
    return res.status(500).json({ message: "Error al listar usuarios" });
  }
};
