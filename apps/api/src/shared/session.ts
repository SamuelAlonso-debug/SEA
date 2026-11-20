import { createHash, randomBytes } from "node:crypto";
import prisma from "./prisma";

// Caducidad configurable por entorno. Un valor inválido impide arrancar: mejor que una sesión eterna.
function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} debe ser un entero positivo`);
  return value;
}

export const SESSION_IDLE_MS = positiveInt("SESSION_IDLE_MINUTES", 30) * 60_000;
export const SESSION_MAX_MS = positiveInt("SESSION_MAX_HOURS", 12) * 3_600_000;
// Una escritura por minuto como máximo: la inactividad se mide con esa precisión.
const TOUCH_MS = 60_000;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const isExpired = (session: { lastSeenAt: Date; expiresAt: Date }, now: number) =>
  now >= session.expiresAt.getTime() || now - session.lastSeenAt.getTime() >= SESSION_IDLE_MS;

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + SESSION_MAX_MS) },
  });
  return token;
}

// Usuario de la sesión vigente con su rol actual, o null. Una sesión caducada se borra.
export async function sessionUser(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, role: true } } },
  });
  if (!session) return null;

  const now = Date.now();
  if (isExpired(session, now)) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }
  if (now - session.lastSeenAt.getTime() >= TOUCH_MS) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date(now) } });
  }
  return session.user;
}

export const revokeSession = (token: string) => prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
