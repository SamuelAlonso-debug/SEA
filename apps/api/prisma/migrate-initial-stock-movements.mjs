// Crea el movimiento ADJUSTMENT "Stock inicial" de cada producto que aún no tiene movimientos,
// para que la suma de movimientos cuadre con el stock. Idempotente. Ejecutar al desplegar #84.
// Uso: node prisma/migrate-initial-stock-movements.mjs
import { PrismaClient } from "@prisma/client";

export async function migrate(prisma) {
  const products = await prisma.product.findMany({
    where: { movements: { none: {} }, stock: { not: 0 } },
    select: { id: true, stock: true },
  });
  // Mongo rechaza insertMany vacío.
  if (products.length === 0) return 0;
  await prisma.stockMovement.createMany({
    data: products.map((p) => ({
      productId: p.id,
      type: "ADJUSTMENT",
      quantity: p.stock,
      stockAfter: p.stock,
      reason: "Stock inicial",
    })),
  });
  return products.length;
}

// Solo al ejecutarlo como script; los tests importan migrate().
if (process.argv[1]?.endsWith("migrate-initial-stock-movements.mjs")) {
  const prisma = new PrismaClient();
  const count = await migrate(prisma);
  await prisma.$disconnect();
  console.log(`Movimientos de stock inicial creados: ${count}`);
}
