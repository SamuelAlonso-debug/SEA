import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { sessionUser } from "./session";

export const SESSION_COOKIE = "sea_session";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

// La web usa la cookie httpOnly. El Bearer queda para clientes sin navegador (scripts, tests):
// el navegador no lo adjunta solo, así que no abre la puerta a CSRF.
export const requestToken = (req: Request): string | undefined => {
  const [scheme, bearer] = (req.headers.authorization ?? "").split(" ");
  return req.cookies?.[SESSION_COOKIE] ?? (scheme === "Bearer" ? bearer : undefined);
};

// Cada petición consulta la sesión en la base: logout, caducidad y cambios de rol aplican de inmediato.
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = requestToken(req);
  if (!token) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const user = await sessionUser(token);
  if (!user) {
    return res.status(401).json({ message: "Sesión expirada. Inicia sesión de nuevo." });
  }
  req.userId = user.id;
  req.userRole = user.role;
  next();
};

// Después de authMiddleware: el rol es el actual en la base.
export const requireRole =
  (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) =>
    req.userRole && roles.includes(req.userRole)
      ? next()
      : res.status(403).json({ message: "No tienes permiso para esta acción" });
