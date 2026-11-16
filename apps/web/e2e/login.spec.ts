import { expect, test } from "@playwright/test";
import { USER } from "./fixtures";

// Sin sesión guardada: aquí se ejercita el login real.
test.use({ storageState: { cookies: [], origins: [] } });

test("credenciales malas muestran el mensaje y no entran al dashboard", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Correo electrónico").fill(USER.email);
  await page.getByLabel("Contraseña").fill("incorrecta-123");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();

  await expect(page.getByText("Correo o contraseña incorrectos")).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("credenciales correctas entran al dashboard", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Correo electrónico").fill(USER.email);
  await page.getByLabel("Contraseña").fill(USER.password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});
