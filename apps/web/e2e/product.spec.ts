import { expect, test } from "@playwright/test";
import { API_URL, removeProduct, tokenOf } from "./fixtures";

test("un producto dado de alta aparece en el listado", async ({ page, request }) => {
  const suffix = Date.now();
  const name = `Alta E2E ${suffix}`;

  await page.goto("/dashboard/inventory/new");
  await page.getByLabel("Nombre del Producto").fill(name);
  await page.getByLabel("ID del Producto").fill(`ALTA${suffix}`);
  await page.getByLabel("Cantidad Adquirida").fill("7");
  await page.getByLabel("Precio por Unidad").fill("150");
  await page.getByLabel("Costo por Unidad (sin IVA)").fill("90");
  await page.getByRole("button", { name: "Agregar Producto" }).click();

  await expect(page).toHaveURL(/\/dashboard\/inventory$/);
  await expect(page.getByRole("row", { name: new RegExp(name) })).toContainText("7 pcs");

  // Limpieza: el id sale del listado de la API.
  const token = await tokenOf(page);
  const list = await request.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
  const created = (await list.json()).find((p: { name: string }) => p.name === name);
  await removeProduct(request, token, created.id);
});
