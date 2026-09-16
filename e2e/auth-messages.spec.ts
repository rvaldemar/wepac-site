import { test, expect } from "./fixtures/test";

async function submitLogin(page: import("@playwright/test").Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Palavra-passe|Password/).fill("wepack2026");
  await page.getByRole("button", { name: "Entrar" }).click();
}

test("admin and member post-login destinations respect role and safe deep links", async ({ page }) => {
  await page.goto("/wepacker/login");
  await submitLogin(page, "admin@wepac.pt");
  await expect(page).toHaveURL(/\/wepacker\/admin\/users$/);

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/wepacker\/login$/);
  await page.goto("/wepacker/messages");
  await expect(page).toHaveURL(/\/wepacker\/login\?callbackUrl=/);
  await submitLogin(page, "ana@example.com");
  await expect(page).toHaveURL(/\/wepacker\/messages$/);
});

test("message keyboard submission persists after reload", async ({ page }) => {
  await page.goto("/wepacker/messages");
  await submitLogin(page, "ana@example.com");
  await expect(page).toHaveURL(/\/wepacker\/messages$/);

  const composer = page.getByLabel("Mensagem");
  await composer.fill("Primeira linha");
  await composer.press("Shift+Enter");
  await composer.type("Segunda linha");
  await expect(composer).toHaveValue("Primeira linha\nSegunda linha");

  const body = `Mensagem E2E ${Date.now()}`;
  await composer.fill(body);
  await composer.press("Enter");
  await expect(page.getByText(body, { exact: true }).last()).toBeVisible();
  await expect(composer).toHaveValue("");

  await page.reload();
  await expect(page.getByText(body, { exact: true }).last()).toBeVisible();
});
