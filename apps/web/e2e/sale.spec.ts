import { expect, test, type Page } from "@playwright/test";
import { removeProduct, seedProduct, tokenOf } from "./fixtures";

async function addToTicket(page: Page, code: string, quantity: number) {
  await page.goto("/dashboard/sales");
  await page.getByRole("spinbutton").fill(String(quantity));
  await page.getByPlaceholder("Busca o escanea un producto").fill(code);
  await page.getByPlaceholder("Busca o escanea un producto").press("Enter");
  await page.getByRole("button", { name: "Pago Efectivo" }).click();
  await page.getByRole("button", { name: "Confirmar venta" }).click();
}

test("vender 1 unidad descuenta el stock visible en inventario", async ({ page, request }) => {
  await page.goto("/dashboard");
  const token = await tokenOf(page);
  const product = await seedProduct(request, token, 5);

  await addToTicket(page, product.productCode, 1);
  await expect(page.getByRole("alertdialog")).toBeHidden();

  await page.goto("/dashboard/inventory");
  await expect(page.getByRole("row", { name: new RegExp(product.name) })).toContainText("4 pcs");
  await removeProduct(request, token, product.id);
});

test("vender más que el stock muestra el error y no descuenta", async ({ page, request }) => {
  await page.goto("/dashboard");
  const token = await tokenOf(page);
  const product = await seedProduct(request, token, 1);

  await addToTicket(page, product.productCode, 2);
  await expect(page.getByText(`Stock insuficiente para ${product.name}. Disponible: 1`)).toBeVisible();

  await page.goto("/dashboard/inventory");
  await expect(page.getByRole("row", { name: new RegExp(product.name) })).toContainText("1 pcs");
  await removeProduct(request, token, product.id);
});
