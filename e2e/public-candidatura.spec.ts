import { test, expect } from "./fixtures/test";

test("public application form submits and shows success", async ({ page }) => {
  await page.goto("/wepacker/intake?source=society");
  await page.getByLabel("Nome", { exact: false }).fill("Joana Teste E2E");
  await page.getByLabel("Email", { exact: false }).fill("joana.e2e@example.com");
  await page.getByLabel("Entro como", { exact: false }).selectOption("person");
  await page
    .getByLabel("O que quero trabalhar ou construir?", { exact: false })
    .selectOption("education");
  await page
    .getByLabel("Em que momento me encontro?", { exact: false })
    .fill("Quero decidir o próximo passo.");
  await page
    .getByLabel("Onde estás e o que gostarias de construir?", { exact: false })
    .fill("Procuro direção para um projeto educativo.");
  await page.getByRole("button", { name: "Dar o primeiro passo" }).click();
  await expect(page.getByText("Ponto de partida recebido")).toBeVisible();
});
