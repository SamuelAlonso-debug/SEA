import { expect, test } from "@playwright/test";
import { USER } from "./fixtures";

// Con la sesión sembrada en global-setup: cerrar sesión borra la cookie solo en este contexto.
test("cerrar sesión vuelve a /landing y el dashboard redirige al login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: `${USER.name} ${USER.lastname}` }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/landing$/);

  expect((await page.context().cookies()).some((c) => c.name === "sea_session")).toBe(false);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/auth.login$/);
});
