import { test, expect } from "./fixtures/test";
import { loginAs } from "./fixtures/login";

test("member login renders dashboard with radar and trail", async ({ page }) => {
  await loginAs(page, "ana@example.com");
  await expect(page.getByRole("heading", { name: "My Journey" })).toBeVisible();
  await expect(page.getByText(/Olá, Ana Martins/)).toBeVisible();
  await expect(page.getByRole("img", { name: "Mapa de Desenvolvimento" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Session Timeline/ })).toBeVisible();
});
