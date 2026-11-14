import { Request, Response } from "express";
import { registerSchema, loginSchema } from "./auth.schema";
import {
  registerUser,
  loginUser,
  getUserProfile,
  AuthError,
} from "./auth.service";
import { AuthRequest } from "../../shared/auth.middleware";

export const registerHandler = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await registerUser(parsed);
    return res.status(201).json(result);
  } catch (error: any) {
    // Zod error
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: error.issues,
      });
    }

    if (error instanceof AuthError) {
      return res.status(error.status).json({ message: error.message });
    }

    return res.status(400).json({ message: error.message || "Error al registrar" });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await loginUser(parsed);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: error.issues,
      });
    }

    if (error instanceof AuthError) {
      return res.status(error.status).json({ message: error.message });
    }

    return res.status(400).json({ message: error.message || "Error al iniciar sesión" });
  }
};

export const profileHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const user = await getUserProfile(req.userId);
    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Error al obtener perfil" });
  }
};
