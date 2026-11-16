import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt";

export const SESSION_COOKIE = "sea_session";

export interface AuthRequest extends Request {
  userId?: string;
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

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Sesión expirada. Inicia sesión de nuevo." });
  }
};
