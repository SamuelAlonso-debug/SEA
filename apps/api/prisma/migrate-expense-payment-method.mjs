// Migra Expense.paymentMethod (texto libre) al catálogo CASH | CARD | TRANSFER. Idempotente.
// Uso: node prisma/migrate-expense-payment-method.mjs [--dry-run] [--fallback=CASH]
// Sin --fallback, valores no reconocidos (incluido vacío) se listan y no se migra nada.
import { PrismaClient } from "@prisma/client";

const CATALOG = ["CASH", "CARD", "TRANSFER"];
const KNOWN = {
  efectivo: "CASH",
  cash: "CASH",
  tarjeta: "CARD",
  card: "CARD",
  "tarjeta de credito": "CARD",
  "tarjeta de debito": "CARD",
  transferencia: "TRANSFER",
  transfer: "TRANSFER",
  spei: "TRANSFER",
};

const normalize = (v) =>
  String(v).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export async function migrate(prisma, { dryRun = false, fallback } = {}) {
  const { cursor } = await prisma.$runCommandRaw({
    aggregate: "Expense",
    pipeline: [{ $group: { _id: "$paymentMethod", count: { $sum: 1 } } }],
    cursor: {},
  });

  const plan = [];
  const unknown = [];
  for (const { _id: value, count } of cursor.firstBatch) {
    if (CATALOG.includes(value)) continue;
    const target = (value != null && value !== "" && KNOWN[normalize(value)]) || fallback;
    (target ? plan : unknown).push({ value: value ?? null, count, target });
  }

  if (unknown.length > 0 || dryRun) return { plan, unknown, applied: false };

  for (const { value, target } of plan) {
    await prisma.$runCommandRaw({
      update: "Expense",
      // null también encuentra documentos sin el campo.
      updates: [{ q: { paymentMethod: value }, u: { $set: { paymentMethod: target } }, multi: true }],
    });
  }
  return { plan, unknown, applied: true };
}

// Solo al ejecutarlo como script; los tests importan migrate().
if (process.argv[1]?.endsWith("migrate-expense-payment-method.mjs")) {
  const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}`));
  const fallback = arg("fallback")?.split("=")[1];
  if (fallback && !CATALOG.includes(fallback)) {
    console.error(`--fallback debe ser uno de ${CATALOG.join(", ")}`);
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const result = await migrate(prisma, { dryRun: Boolean(arg("dry-run")), fallback });
  await prisma.$disconnect();
  console.table(result.plan);
  if (result.unknown.length > 0) {
    console.error("Valores no reconocidos; añade el mapeo o usa --fallback:");
    console.table(result.unknown);
    process.exit(1);
  }
  console.log(result.applied ? "Migración aplicada." : "Simulación: sin cambios.");
}
