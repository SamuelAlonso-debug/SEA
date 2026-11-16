// Levanta la API contra un Mongo real en memoria (Prisma exige replica set para transacciones).
// Reusa mongodb-memory-server-core de apps/api: requiere `npm ci` allí.
import { execSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const apiDir = fileURLToPath(new URL("../../api/", import.meta.url));
const { MongoMemoryReplSet } = createRequire(apiDir)("mongodb-memory-server-core");

const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
const env = { ...process.env, DATABASE_URL: replSet.getUri("sea") };
execSync("npx prisma db push --skip-generate", { cwd: apiDir, env, stdio: "inherit" });

const api = spawn(process.execPath, ["node_modules/ts-node-dev/lib/bin.js", "--transpile-only", "src/server.ts"], {
  cwd: apiDir,
  env,
  stdio: "inherit",
});

const stop = async () => {
  api.kill();
  await replSet.stop();
  process.exit(0);
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
api.on("exit", stop);
