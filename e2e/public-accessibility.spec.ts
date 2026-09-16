import { expect, test } from "@playwright/test";

test("cookie consent reserves its measured space and exposes usable targets", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem("cookie_consent"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/society");

  const banner = page.locator("[data-cookie-consent]");
  await expect(banner).toBeVisible();
  await expect
    .poll(async () => {
      const bannerHeight = await banner.evaluate((element) => element.getBoundingClientRect().height);
      const bodyPadding = await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom));
      return Math.abs(bodyPadding - bannerHeight);
    })
    .toBeLessThan(1);

  for (const button of await banner.getByRole("button").all()) {
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  await banner.getByRole("button", { name: "Recusar" }).click();
  await expect(banner).toBeHidden();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).paddingBottom)).toBe("0px");
});

test("Wessex mobile navigation is an accessible drawer", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("cookie_consent", "accepted"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/wessex");

  const toggle = page.locator('button[aria-controls="wessex-mobile-menu"]');
  await expect(toggle).toHaveAccessibleName("Abrir menu");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  const menu = page.getByRole("dialog", { name: "Menu de navegação" });
  await expect(menu).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  for (const href of ["#quem-somos", "#eventos", "#big-ideia", "#depoimentos"]) {
    await expect(menu.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
  await expect(menu.getByRole("link", { name: "Simular orçamento" })).toHaveAttribute(
    "href",
    "/servicos/orcamento",
  );

  await menu.locator('a[href="#eventos"]').click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/#eventos$/);

  await toggle.click();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(menu.getByRole("link", { name: "Simular orçamento" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("reduced motion disables smooth scrolling and entrance animations", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("cookie_consent", "accepted"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/society");

  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await expect(page.locator("main [style*='opacity: 0']")).toHaveCount(0);

  const pulseMotion = await page.evaluate(() => {
    const pulse = document.createElement("span");
    pulse.className = "animate-pulse";
    document.body.append(pulse);
    const style = getComputedStyle(pulse);
    const duration = style.animationDuration;
    return {
      durationMs: duration.endsWith("ms") ? parseFloat(duration) : parseFloat(duration) * 1000,
      iterations: style.animationIterationCount,
    };
  });
  expect(pulseMotion.durationMs).toBeLessThanOrEqual(0.01);
  expect(pulseMotion.iterations).toBe("1");
});
