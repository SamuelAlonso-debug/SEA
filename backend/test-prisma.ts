import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Usuarios:", users);
}

main()
  .catch((e) => {
    console.error("Error en test-prisma:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
