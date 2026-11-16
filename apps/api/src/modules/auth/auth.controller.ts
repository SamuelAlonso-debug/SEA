import { CookieOptions, Request, Response } from "express";
import { loginSchema } from "./auth.schema";
import { loginUser, getUserProfile, AuthError } from "./auth.service";
import { AuthRequest, SESSION_COOKIE } from "../../shared/auth.middleware";

// httpOnly: el token no es legible desde JavaScript. Strict: el navegador no la envía desde otros sitios.
// COOKIE_SECURE=false solo para servir la API por http fuera de localhost (p. ej. IP de la LAN).
const sessionCookie: CookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE !== "false",
  sameSite: "strict",
  path: "/",
};
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // igual que la caducidad del JWT

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const { user, token } = await loginUser(parsed);
    res.cookie(SESSION_COOKIE, token, { ...sessionCookie, maxAge: SESSION_MAX_AGE_MS });
    return res.status(200).json({ user });
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

export const logoutHandler = (req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, sessionCookie);
  return res.status(204).end();
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
