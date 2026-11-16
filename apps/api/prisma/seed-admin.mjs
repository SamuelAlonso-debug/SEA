// Primer ADMIN y roles de usuarios anteriores a #8. Idempotente: se puede repetir en cada despliegue.
// Uso: ADMIN_EMAIL=… ADMIN_PASSWORD=… [ADMIN_NAME=… ADMIN_LASTNAME=…] npm run seed:admin
// Las credenciales solo viven en el entorno de quien lo ejecuta: nunca en el repo ni en la imagen.
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const PASSWORD_MIN = 8; // igual que UserPasswordLength.MIN

export async function seedAdmin(prisma, { email, password, name = "Administrador", lastname = "SEA" }) {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!normalized.includes("@")) throw new Error("ADMIN_EMAIL no es un correo válido");
  if (String(password ?? "").length < PASSWORD_MIN) {
    throw new Error(`ADMIN_PASSWORD debe tener al menos ${PASSWORD_MIN} caracteres`);
  }

  // Usuarios sin rol (creados con el registro público): el mínimo privilegio. Sin rol no podrían
  // iniciar sesión. Promover a otro ADMIN = volver a ejecutar con su correo.
  const legacy = await prisma.$runCommandRaw({
    update: "User",
    updates: [{ q: { role: { $exists: false } }, u: { $set: { role: "CASHIER" } }, multi: true }],
  });

  // Si el correo ya existe solo se asegura el rol: repetir el seed no cambia la contraseña.
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
  } else {
    await prisma.user.create({
      data: { name, lastname, email: normalized, password: await bcrypt.hash(password, 10), role: "ADMIN" },
    });
  }
  return { created: !existing, legacyAssigned: legacy.nModified };
}

// Solo al ejecutarlo como script; los tests importan seedAdmin().
if (process.argv[1]?.endsWith("seed-admin.mjs")) {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_LASTNAME } = process.env;
  const prisma = new PrismaClient();
  try {
    const result = await seedAdmin(prisma, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      ...(ADMIN_NAME && { name: ADMIN_NAME }),
      ...(ADMIN_LASTNAME && { lastname: ADMIN_LASTNAME }),
    });
    console.log(`ADMIN ${result.created ? "creado" : "ya existía (rol asegurado)"}.`);
    console.log(`Usuarios sin rol pasados a CASHIER: ${result.legacyAssigned}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
