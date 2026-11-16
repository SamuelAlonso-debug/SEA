import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET;

// Sin secreto no hay arranque: un valor por defecto permitiría falsificar tokens.
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido");
}

export interface JwtPayload {
  userId: string;
  role: Role;
}

export const signToken = (
  payload: JwtPayload,
  expiresIn: jwt.SignOptions["expiresIn"] = "7d"
) => jwt.sign(payload, JWT_SECRET, { algorithm: "HS256", expiresIn });

// Tokens anteriores a los roles llegan sin `role`: el tipo lo admite para que el middleware los rechace.
export const verifyToken = (token: string): Partial<JwtPayload> =>
  jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as Partial<JwtPayload>;
