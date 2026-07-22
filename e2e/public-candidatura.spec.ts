import { test, expect } from "./fixtures/test";

test("public application form submits and shows success", async ({ page }) => {
  await page.goto("/wepacker/intake?artisticArea=Arts");
  await page.getByLabel("Nome", { exact: false }).fill("Joana Teste E2E");
  await page.getByLabel("Email", { exact: false }).fill("joana.e2e@example.com");
  await page.getByRole("button", { name: "Enviar candidatura" }).click();
  await expect(page.getByText("Candidatura recebida")).toBeVisible();
});
