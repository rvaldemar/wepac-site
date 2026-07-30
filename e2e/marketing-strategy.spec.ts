import { test, expect } from "./fixtures/test";

test("the public narrative keeps Life Plan at the centre", async ({ page }) => {
  const routes = [
    {
      path: "/society/life-plan",
      heading: "Onde estás. Para onde vais. O que fazes a seguir.",
      cta: "Começar o meu Life Plan",
      href: "/wepacker/intake?source=life-plan",
    },
    {
      path: "/society/familias",
      heading: "O caminho começa em casa.",
      cta: "Começar o Life Plan da família",
      href: "/wepacker/intake?source=familias",
    },
    {
      path: "/academy",
      heading: "Do 0 ao infinito — e mais além.",
      cta: "Começar o meu Life Plan",
      href: "/wepacker/intake?source=academy",
    },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: route.cta, exact: true }).first()
    ).toHaveAttribute("href", route.href);
  }
});

test("the generic intake starts broad and only opens the artistic branch when relevant", async ({
  page,
}) => {
  await page.goto("/wepacker/intake?source=society");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Onde estás. Para onde vais. O que fazes a seguir.",
    })
  ).toBeVisible();
  await expect(page.getByLabel("Entro como", { exact: false })).toBeVisible();
  await expect(
    page.getByLabel("O que quero trabalhar ou construir?", { exact: false })
  ).toBeVisible();
  await expect(page.getByLabel("Área de prática")).toHaveCount(0);
  await expect(page.getByLabel("Portefólio / redes sociais")).toHaveCount(0);

  await page
    .getByLabel("O que quero trabalhar ou construir?", { exact: false })
    .selectOption("artistic-practice");
  await expect(page.getByLabel("Área de prática")).toBeVisible();
  await expect(page.getByLabel("Portefólio / redes sociais")).toBeVisible();

  await page
    .getByLabel("O que quero trabalhar ou construir?", { exact: false })
    .selectOption("education");
  await expect(page.getByLabel("Área de prática")).toHaveCount(0);

  await page.getByLabel("Entro como", { exact: false }).selectOption("artist");
  await expect(page.getByLabel("Área de prática")).toBeVisible();
});

test("the generic intake validates the new Life Plan context fields", async ({ page }) => {
  await page.goto("/wepacker/intake?source=society");
  await page.getByRole("button", { name: "Dar o primeiro passo" }).click();

  await expect(page.getByText("O nome é obrigatório.")).toBeVisible();
  await expect(page.getByText("O email é obrigatório.")).toBeVisible();
  await expect(page.getByText("Escolhe como estás a entrar.")).toBeVisible();
  await expect(
    page.getByText("Escolhe o que queres trabalhar ou construir.")
  ).toBeVisible();
  await expect(
    page.getByText("Conta-nos em que momento te encontras.")
  ).toBeVisible();
  await expect(
    page.getByText("Conta-nos onde estás e o que gostarias de construir.")
  ).toBeVisible();
  await expect(page.getByLabel("Nome", { exact: false })).toBeFocused();
});

test("source context follows the visitor into the generic intake", async ({ page }) => {
  await page.goto("/wepacker/intake?source=familias");
  await expect(page.getByText("Life Plan · Famílias")).toBeVisible();
  await expect(page.getByLabel("Entro como", { exact: false })).toHaveValue("family");

  await page.goto("/wepacker/intake?source=academy");
  await expect(page.getByText("Life Plan · Academy")).toBeVisible();
  await expect(
    page.getByLabel("O que quero trabalhar ou construir?", { exact: false })
  ).toHaveValue("education");

  await page.goto("/wepacker/intake?source=upgraded-backpack");
  await expect(page.getByText("Life Plan · Continuidade")).toBeVisible();
  await expect(
    page.getByLabel("O que quero trabalhar ou construir?", { exact: false })
  ).toHaveValue("continuity");
});
