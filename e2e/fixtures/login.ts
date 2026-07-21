import { Page, expect } from "@playwright/test";

// Logs in through the real UI (not a pre-computed storageState) so the
// suite keeps exercising the login form itself on every run — this is
// also flow E2E-1 in disguise for every other spec that needs a session.
export async function loginAs(page: Page, email: string, password = "password123") {
  await page.goto("/wepacker/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/wepacker\/(dashboard|welcome)/);
}
