// Levanta la API contra un Mongo real en memoria (Prisma exige replica set para transacciones).
// Reusa mongodb-memory-server-core de apps/api: requiere `npm ci` allí.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const apiDir = fileURLToPath(new URL("../../api/", import.meta.url));
const { MongoMemoryReplSet } = createRequire(apiDir)("mongodb-memory-server-core");

const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
const env = { ...process.env, DATABASE_URL: replSet.getUri("sea") };
// Asíncrono: este proceso es dueño de mongod; bloquearlo con execSync puede detener a mongod
// a mitad del seed y colgarlo.
const run = (command) =>
  new Promise((resolve, reject) =>
    spawn(command, { cwd: apiDir, env, stdio: "inherit", shell: true }).on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} terminó con ${code}`))
    )
  );
await run("npx prisma db push --skip-generate");
// Sin registro público (#8): el usuario de la suite es el primer ADMIN, como en un despliegue.
await run("node prisma/seed-admin.mjs");

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
