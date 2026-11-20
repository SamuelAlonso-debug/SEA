import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

// SHA-256 calculado aquí, sin importar la app: Prisma no debe cargarse antes de fijar DATABASE_URL.
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Usuarios con sesión fija: startMongo los crea y reset() los conserva, así cada archivo
// declara su Bearer sin esperar a la base.
export const FIXTURE = {
  ADMIN: { id: "507f1f77bcf86cd799439011", email: "admin@fixture.test", token: "fixture-admin-token" },
  CASHIER: { id: "507f1f77bcf86cd799439012", email: "cajero@fixture.test", token: "fixture-cashier-token" },
} as const;
export const FIXTURE_IDS = [FIXTURE.ADMIN.id, FIXTURE.CASHIER.id];
const FAR = new Date("2100-01-01");

export const bearer = (role: keyof typeof FIXTURE) => `Bearer ${FIXTURE[role].token}`;

export async function seedFixtures(prisma: PrismaClient) {
  for (const role of ["ADMIN", "CASHIER"] as const) {
    const { id, email, token } = FIXTURE[role];
    await prisma.user.create({ data: { id, name: role, lastname: "Fixture", email, password: "x", role } });
    await prisma.session.create({ data: { tokenHash: hashToken(token), userId: id, expiresAt: FAR } });
  }
}

// Sesión para un usuario creado en el test (p. ej. para comprobar quién registró una venta).
// lastSeenAt con el reloj de JS: @default(now()) lo pone Prisma con el reloj real, aunque el test lo simule.
export async function bearerFor(prisma: PrismaClient, userId: string) {
  const token = randomBytes(16).toString("hex");
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, lastSeenAt: new Date(), expiresAt: FAR } });
  return `Bearer ${token}`;
}
