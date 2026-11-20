import { execSync } from "node:child_process";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import { FIXTURE_IDS, seedFixtures } from "./session";

// Mongo real en memoria: las transacciones exigen replica set.
// La app se importa después de fijar DATABASE_URL.
export async function startMongo() {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.DATABASE_URL = replSet.getUri("sea");
  execSync("npx prisma db push --skip-generate", { env: process.env, stdio: "ignore" });
  const app = (await import("../../src/app")).default;
  const prisma = (await import("../../src/shared/prisma")).default;
  await seedFixtures(prisma);

  return {
    app,
    prisma,
    // Hijos antes que padres: Prisma emula las relaciones en Mongo. Los usuarios fijos y sus sesiones se quedan.
    reset: async () => {
      for (const model of ["stockMovement", "saleItem", "sale", "counter", "product", "client", "expense"]) {
        await (prisma as any)[model].deleteMany();
      }
      await prisma.session.deleteMany({ where: { userId: { notIn: FIXTURE_IDS } } });
      await prisma.user.deleteMany({ where: { id: { notIn: FIXTURE_IDS } } });
    },
    stop: async () => {
      await prisma.$disconnect();
      await replSet.stop();
    },
  };
}
