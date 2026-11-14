import { execSync } from "node:child_process";
import { MongoMemoryReplSet } from "mongodb-memory-server";

// Mongo real en memoria: las transacciones exigen replica set.
// La app se importa después de fijar DATABASE_URL.
export async function startMongo() {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.DATABASE_URL = replSet.getUri("sea");
  execSync("npx prisma db push --skip-generate", { env: process.env, stdio: "ignore" });
  const app = (await import("../../src/app")).default;
  const prisma = (await import("../../src/shared/prisma")).default;

  return {
    app,
    prisma,
    // Hijos antes que padres: Prisma emula las relaciones en Mongo.
    reset: async () => {
      for (const model of ["saleItem", "sale", "counter", "product", "client", "expense", "user"]) {
        await (prisma as any)[model].deleteMany();
      }
    },
    stop: async () => {
      await prisma.$disconnect();
      await replSet.stop();
    },
  };
}
