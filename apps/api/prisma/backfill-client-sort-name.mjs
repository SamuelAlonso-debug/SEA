// Rellena Client.sortName (clave de orden por nombre sin mayúsculas ni acentos). Idempotente.
// Uso: node prisma/backfill-client-sort-name.mjs [--dry-run]
import { PrismaClient } from "@prisma/client";

// Misma regla que toSortName en src/modules/clients/client.sort-name.ts.
const toSortName = (name, lastname) =>
  `${name} ${lastname}`.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

export async function backfill(prisma, { dryRun = false } = {}) {
  const clients = await prisma.client.findMany({ select: { id: true, name: true, lastname: true, sortName: true } });
  const stale = clients.filter((c) => c.sortName !== toSortName(c.name, c.lastname));
  if (!dryRun) {
    for (const c of stale) {
      await prisma.client.update({ where: { id: c.id }, data: { sortName: toSortName(c.name, c.lastname) } });
    }
  }
  return { total: clients.length, updated: stale.length, applied: !dryRun };
}

// Solo al ejecutarlo como script; los tests importan backfill().
if (process.argv[1]?.endsWith("backfill-client-sort-name.mjs")) {
  const prisma = new PrismaClient();
  const result = await backfill(prisma, { dryRun: process.argv.includes("--dry-run") });
  await prisma.$disconnect();
  console.log(result.applied ? "Backfill aplicado." : "Simulación: sin cambios.", result);
}
