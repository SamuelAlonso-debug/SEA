import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { signToken } from "../../src/shared/jwt";

// Mongo real en memoria: las transacciones exigen replica set.
let replSet: MongoMemoryReplSet;
let app: any;
let prisma: any;
let auth: string;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.DATABASE_URL = replSet.getUri("sea");
  execSync("npx prisma db push --skip-generate", { env: process.env, stdio: "ignore" });
  app = (await import("../../src/app")).default;
  prisma = (await import("../../src/shared/prisma")).default;
}, 300_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await replSet?.stop();
});

beforeEach(async () => {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  const user = await prisma.user.create({ data: { name: "C", lastname: "C", email: "c@c.mx", password: "x" } });
  auth = `Bearer ${signToken({ userId: user.id })}`;
});

const product = (productCode: string, stock: number, isActive = true) =>
  prisma.product.create({ data: { name: `Prod ${productCode}`, productCode, price: 10, stock, isActive } });
const sell = (items: object[]) =>
  request(app).post("/api/sales").set("Authorization", auth).send({ items, paymentMethod: "CASH" });
const sellMany = (n: number, productCode: string) =>
  Promise.all(Array.from({ length: n }, () => sell([{ productCode, quantity: 1 }])));
const stockOf = async (productCode: string) =>
  (await prisma.product.findUnique({ where: { productCode } })).stock;
const statuses = (res: { status: number }[]) => res.map((r) => r.status).sort();

describe("POST /api/sales concurrente", () => {
  it("stock 1 y dos ventas → un 201 y un 409", async () => {
    await product("A", 1);
    const res = await sellMany(2, "A");
    expect(statuses(res)).toEqual([201, 409]);
    expect(res.find((r) => r.status === 409)!.body.message).toBe("Stock insuficiente para Prod A. Disponible: 0");
    expect(await stockOf("A")).toBe(0);
  });

  it("stock 10 y 20 ventas → 10 confirmadas, 10 rechazadas, stock 0", async () => {
    await product("A", 10);
    const res = await sellMany(20, "A");
    expect(statuses(res)).toEqual([...Array(10).fill(201), ...Array(10).fill(409)]);
    expect(await stockOf("A")).toBe(0);
  });

  it("20 ventas con stock suficiente → tickets distintos y consecutivos", async () => {
    await product("A", 100);
    const res = await sellMany(20, "A");
    const tickets = res.map((r) => r.body.ticketNumber).sort();
    expect(tickets).toEqual(Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(7, "0")));
  });

  it("venta rechazada no deja venta, ítems ni stock descontado", async () => {
    await product("A", 5);
    await product("B", 0);
    await sell([{ productCode: "A", quantity: 1 }, { productCode: "B", quantity: 1 }]).expect(409);
    expect(await stockOf("A")).toBe(5);
    expect(await prisma.sale.count()).toBe(0);
    expect(await prisma.saleItem.count()).toBe(0);
  });

  it.each([
    ["inactivo", 409, "El producto I está inactivo"],
    ["inexistente", 404, "Producto X no encontrado"],
  ])("producto %s → %i", async (_, status, message) => {
    await product("I", 5, false);
    const res = await sell([{ productCode: message.includes("X") ? "X" : "I", quantity: 1 }]);
    expect(res.status).toBe(status);
    expect(res.body.message).toBe(message);
  });
});
