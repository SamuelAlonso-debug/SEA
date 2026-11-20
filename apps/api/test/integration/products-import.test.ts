import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { bearer } from "./session";
import { startMongo } from "./mongo";

let db: Awaited<ReturnType<typeof startMongo>>;
let app: any;
const auth = bearer("ADMIN");

beforeAll(async () => {
  db = await startMongo();
  app = db.app;
}, 300_000);

afterAll(() => db?.stop());
beforeEach(() => db.reset());

const H = "productCode,name,category,price,cost,stock,minStock,provider";
const rows = (n: number) => Array.from({ length: n }, (_, i) => `C${i},Producto ${i},Cat,10,6,5,,`);
const csv = (...lines: string[]) => [H, ...lines].join("\n");
const send = (content: string | Buffer, query = "") =>
  request(app).post(`/api/products/import${query}`).set("Authorization", auth).attach("file", Buffer.from(content), "p.csv");
const count = () => db.prisma.product.count();

describe("importación de productos desde CSV", () => {
  it("500 filas válidas → 201 { created: 500 }", async () => {
    const res = await send(csv(...rows(500))).expect(201);
    expect(res.body).toEqual({ created: 500 });
    expect(await count()).toBe(500);
    expect(await db.prisma.product.findUnique({ where: { productCode: "C7" } })).toMatchObject({ price: 10, cost: 6, stock: 5 });
  });

  it("una fila con price abc → 400 con fila y mensaje, y 0 creados", async () => {
    const res = await send(csv(...rows(499), "X1,Mal,,abc,6,5,,")).expect(400);
    expect(res.body).toEqual({
      message: "El archivo tiene 1 error",
      rows: [{ row: 501, path: "price", message: "El precio debe ser un número" }],
    });
    expect(await count()).toBe(0);
  });

  it("dryRun=true valida y no crea nada", async () => {
    expect((await send(csv(...rows(3)), "?dryRun=true").expect(200)).body).toEqual({ dryRun: true, valid: 3 });
    await send(csv("A1,Mal,,abc,6,5,,"), "?dryRun=true").expect(400);
    expect(await count()).toBe(0);
  });

  it("código repetido en el archivo → 400", async () => {
    const res = await send(csv("A1,Uno,,1,1,1,,", "A1,Dos,,1,1,1,,")).expect(400);
    expect(res.body.rows).toEqual([{ row: 3, path: "productCode", message: "Código repetido en la fila 2" }]);
    expect(await count()).toBe(0);
  });

  it("código que ya existe en BD → 409 sin crear ninguno, también en dryRun", async () => {
    await db.prisma.product.create({ data: { name: "Arroz", productCode: "A1", price: 1, cost: 1, stock: 1 } });
    for (const q of ["", "?dryRun=true"]) {
      const res = await send(csv("N1,Nuevo,,1,1,1,,", "A1,Arroz,,1,1,1,,"), q).expect(409);
      expect(res.body.rows).toEqual([{ row: 3, path: "productCode", message: "El código A1 ya existe" }]);
    }
    expect(await count()).toBe(1);
  });

  it("errores de archivo: sin archivo, encabezados, >2000 filas, >1 MB, sin sesión", async () => {
    const none = await request(app).post("/api/products/import").set("Authorization", auth).expect(400);
    expect(none.body.message).toBe("Selecciona un archivo CSV");
    const bad = await send("a,b\n1,2").expect(400);
    expect(bad.body.message).toBe(`Encabezados inválidos. Usa la plantilla: ${H}`);
    const many = await send(csv(...rows(2001))).expect(400);
    expect(many.body.message).toBe("Máximo 2000 productos por archivo");
    const big = await send(csv("A1," + "x".repeat(1024 * 1024) + ",,1,1,1,,")).expect(413);
    expect(big.body.message).toBe("El archivo supera 1 MB");
    await request(app).post("/api/products/import").expect(401);
    expect(await count()).toBe(0);
  });

  it("plantilla descargable con los encabezados", async () => {
    const res = await request(app).get("/api/products/import/template").set("Authorization", auth).expect(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text.trim()).toBe(H);
  });
});
