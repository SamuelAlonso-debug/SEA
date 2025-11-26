import jwt, { Secret } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "default_secret";

export interface JwtPayload {
  userId: string;
}

export const signToken = (
  payload: JwtPayload,
  expiresIn: string | number = "7d"
) => {
  // TS se queja del tipo de expiresIn, lo forzamos a any en las opciones
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as JwtPayload;
};
