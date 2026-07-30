import { test, expect } from "./fixtures/test";
import type { Page } from "@playwright/test";

async function revealPage(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);

  for (let y = 0; y < height; y += 200) {
    await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
    await page.waitForTimeout(15);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(750);
}

test("Society is the public entrance and keeps every existing door reachable", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/society$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "From packers to WEPACkers." })
  ).toBeVisible();

  const lifePlan = page
    .getByRole("link", { name: "Começar o meu Life Plan", exact: true })
    .first();
  await expect(lifePlan).toHaveAttribute(
    "href",
    "/wepacker/intake?source=society"
  );

  const backpack = page.getByRole("link", { name: "Abrir Backpack" }).first();
  await expect(backpack).toHaveAttribute("href", "/wepacker/login");

  await page.getByRole("link", { name: "Ver como funciona", exact: true }).click();
  await expect(page).toHaveURL(/\/society#life-plan$/);
  const lifePlanTop = await page.locator("#life-plan").boundingBox();
  expect(lifePlanTop?.y).toBeGreaterThanOrEqual(79);

  for (const path of [
    "/society",
    "/society/life-plan",
    "/society/familias",
    "/academy",
    "/companhia-de-artes",
    "/wessex",
    "/arte-a-capela",
    "/bilheteira",
    "/wepacker/login",
  ]) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should stay reachable`).toBe(true);
  }

  for (const [source, destination] of [
    ["/academia", "/academy"],
    ["/projetos/wessex", "/wessex"],
    ["/projetos/arte-a-capela", "/arte-a-capela"],
  ]) {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status(), `${source} should redirect permanently`).toBe(308);
    expect(response.headers().location).toBe(destination);
  }

  await revealPage(page);
  await expect(page.locator("main [style*='opacity: 0']")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
  ).toBe(true);

  if (process.env.QA_SCREENSHOT_DESKTOP) {
    await page.screenshot({ path: process.env.QA_SCREENSHOT_DESKTOP, fullPage: true });
  }

  if (process.env.QA_SCREENSHOT_PLATFORM) {
    await page.locator("#life-plan").scrollIntoViewIfNeeded();
    await page.waitForTimeout(750);
    await page.screenshot({ path: process.env.QA_SCREENSHOT_PLATFORM });
  }
});

test("Society navigation remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/society");

  await page.getByRole("button", { name: "Abrir menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu de navegação" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: "Life Plan", exact: true })).toHaveAttribute(
    "href",
    "/society/life-plan"
  );
  await expect(menu.getByRole("link", { name: "Famílias", exact: true })).toHaveAttribute(
    "href",
    "/society/familias"
  );
  await expect(menu.getByRole("link", { name: "Academy", exact: true })).toHaveAttribute(
    "href",
    "/academy"
  );
  await expect(
    menu.getByRole("link", { name: "Companhia de Artes", exact: true })
  ).toHaveAttribute("href", "/companhia-de-artes");

  await page.getByRole("button", { name: "Fechar menu" }).click();
  await revealPage(page);
  await expect(page.locator("main [style*='opacity: 0']")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
  ).toBe(true);

  if (process.env.QA_SCREENSHOT_MOBILE) {
    await page.screenshot({ path: process.env.QA_SCREENSHOT_MOBILE, fullPage: true });
  }

  if (process.env.QA_SCREENSHOT_MOBILE_PLATFORM) {
    await page.locator("#life-plan").scrollIntoViewIfNeeded();
    await page.waitForTimeout(750);
    await page.screenshot({ path: process.env.QA_SCREENSHOT_MOBILE_PLATFORM });
  }
});

test("the visitor can choose English and keep the same Society journey", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/society?source=qa");

  const language = page.getByRole("combobox", { name: "Idioma" });
  await expect(language).toHaveValue("pt-PT");
  await language.selectOption("en-US");

  await expect(page).toHaveURL(/\/en\/society\?source=qa$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "From packers to WEPACkers." }),
  ).toBeVisible();
  await expect(
    page.getByText("Education for a lifetime. It starts with the Life Plan.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Belonging means building together.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Discuss Life Plan for our organization",
      exact: true,
    }),
  ).toHaveAttribute("href", "/en/wepacker/intake?source=organizations");

  await expect
    .poll(async () => {
      const cookie = (await page.context().cookies()).find(
        (item) => item.name === "NEXT_LOCALE",
      );
      return cookie?.value;
    })
    .toBe("en-US");

  await page.reload();
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue(
    "en-US",
  );

  for (const path of [
    "/en/society",
    "/en/society/life-plan",
    "/en/society/familias",
    "/en/academy",
    "/en/companhia-de-artes",
    "/en/wepacker/intake",
  ]) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should stay reachable`).toBe(true);
  }
});
