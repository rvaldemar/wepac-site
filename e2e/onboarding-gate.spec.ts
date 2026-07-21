import { test, expect } from "./fixtures/test";

// sofia@example.com is seeded with onboarded:false and no evaluations —
// she must be forced through welcome -> agreement -> assessment before
// the middleware lets her anywhere else in /wepacker.
test("unonboarded member is forced through welcome -> agreement -> assessment", async ({
  page,
}) => {
  await page.goto("/wepacker/login");
  await page.getByLabel("Email").fill("sofia@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/wepacker\/welcome/); // middleware gate

  // A direct hit on the dashboard must still be blocked.
  await page.goto("/wepacker/dashboard");
  await expect(page).toHaveURL(/\/wepacker\/welcome/);

  await page.getByRole("link", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/wepacker\/agreement/);
  await page.getByLabel(/Li e aceito as condições/).check();
  await page.getByRole("button", { name: "Aceitar e continuar" }).click();
  await expect(page).toHaveURL(/\/wepacker\/assessment/);

  // Minimal submission: score 3 on every indicator, for each of the 6 areas.
  // The radio inputs themselves are visually hidden (sr-only) — the real
  // interactive surface a user clicks is the adjacent styled <label>, so
  // click that instead of force-checking the hidden input directly.
  for (let areaIdx = 0; areaIdx < 6; areaIdx++) {
    const threeLabels = page.locator('input[data-testid$="-3"] + label');
    const n = await threeLabels.count();
    for (let i = 0; i < n; i++) await threeLabels.nth(i).click();
    const isLast = areaIdx === 5;
    await page
      .getByTestId(isLast ? "assessment-complete" : "assessment-next-area")
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Autoavaliação completa" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Ir para o meu espaço" }).click();
  await expect(page).toHaveURL(/\/wepacker\/dashboard/);
});
