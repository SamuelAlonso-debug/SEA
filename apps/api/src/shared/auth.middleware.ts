import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "./jwt";

export const SESSION_COOKIE = "sea_session";

const ROLES = Object.values(Role);

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // La web usa la cookie httpOnly. El Bearer queda para clientes sin navegador (scripts, tests):
  // el navegador no lo adjunta solo, así que no abre la puerta a CSRF.
  const [scheme, bearer] = (req.headers.authorization ?? "").split(" ");
  const token: string | undefined = req.cookies?.[SESSION_COOKIE] ?? (scheme === "Bearer" ? bearer : undefined);

  if (!token) {
    return res.status(401).json({ message: "No autenticado" });
  }

  let payload: ReturnType<typeof verifyToken> | undefined;
  try {
    payload = verifyToken(token);
  } catch {
    // Firma inválida o token expirado: mismo 401 que un token sin rol.
  }
  // Un token sin rol válido (emitido antes de los roles) obliga a iniciar sesión de nuevo.
  if (!payload?.userId || !payload.role || !ROLES.includes(payload.role)) {
    return res.status(401).json({ message: "Sesión expirada. Inicia sesión de nuevo." });
  }
  req.userId = payload.userId;
  req.userRole = payload.role;
  next();
};

// Después de authMiddleware. El rol viaja en el token: un cambio de rol aplica en el siguiente login.
export const requireRole =
  (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) =>
    req.userRole && roles.includes(req.userRole)
      ? next()
      : res.status(403).json({ message: "No tienes permiso para esta acción" });
