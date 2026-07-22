import { test, expect } from "./fixtures/test";

// Sofia is seeded with onboarded:false. Universal onboarding ends at the
// Agreement and then opens the person's own My Journey.
test("unonboarded person is forced through welcome -> agreement", async ({
  page,
}) => {
  await page.goto("/wepacker/login");
  await page.getByLabel("Email").fill("sofia@example.com");
  await page.getByLabel("Password").fill("wepack2026");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/wepacker\/welcome/); // middleware gate

  // A direct hit on the dashboard must still be blocked.
  await page.goto("/wepacker/dashboard");
  await expect(page).toHaveURL(/\/wepacker\/welcome/);

  await page.getByRole("link", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/wepacker\/agreement/);
  await page.getByLabel(/Li e aceito as condições/).check();
  await page
    .getByRole("button", { name: "Accept and open My Journey" })
    .click();
  await expect(page).toHaveURL(/\/wepacker\/dashboard/);
});
