import { expect, test } from "@playwright/test";
import { API_URL, USER } from "./fixtures";

// Sesión propia: el logout la revoca en el servidor y la de global-setup la usan los demás specs.
test.use({ storageState: { cookies: [], origins: [] } });

test("cerrar sesión vuelve a /landing y el dashboard redirige al login", async ({ page }) => {
  // `page.request` comparte las cookies del navegador.
  const login = await page.request.post(`${API_URL}/auth/login`, { data: { email: USER.email, password: USER.password } });
  expect(login.ok()).toBeTruthy();
  await page.goto("/dashboard");
  await page.getByRole("button", { name: `${USER.name} ${USER.lastname}` }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/landing$/);

  expect((await page.context().cookies()).some((c) => c.name === "sea_session")).toBe(false);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/auth.login$/);
});
