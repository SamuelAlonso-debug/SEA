import { CookieOptions, Request, Response } from "express";
import { loginSchema } from "./auth.schema";
import { loginUser, getUserProfile } from "./auth.service";
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

// Sin try/catch: Express 5 lleva los errores (Zod, dominio, BD) al middleware central.
export const loginHandler = async (req: Request, res: Response) => {
  const { user, token } = await loginUser(loginSchema.parse(req.body));
  res.cookie(SESSION_COOKIE, token, { ...sessionCookie, maxAge: SESSION_MAX_AGE_MS });
  return res.status(200).json({ user });
};

export const logoutHandler = (req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, sessionCookie);
  return res.status(204).end();
};

export const profileHandler = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "No autorizado" });
  }
  return res.status(200).json(await getUserProfile(req.userId));
};
