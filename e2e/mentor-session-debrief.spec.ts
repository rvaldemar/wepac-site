import { test, expect } from "./fixtures/test";
import { loginAs } from "./fixtures/login";

test("mentor creates a Checkpoint session, attaches transcript, sees ready-to-generate state", async ({
  page,
}) => {
  await loginAs(page, "ricardo@wepac.pt");
  await page.goto("/wepacker/mentor/sessions");
  await page.getByRole("button", { name: "+ New Session" }).click();

  // "Motivo da sessão" already defaults to "checkpoint" — clicking it is
  // redundant but explicit, and doubles as an assertion of the label.
  await page.getByRole("button", { name: /^Checkpoint/ }).click();
  await page.getByRole("button", { name: "Ana Martins" }).click(); // participant

  // Force the scheduled date far into the future so this session always
  // sorts first (list is ordered by scheduledAt desc) regardless of what
  // "now" is on the day the suite runs — the seed already has a session
  // scheduled months out, so relying on "now" as the default would be
  // flaky.
  await page.locator('input[type="datetime-local"]').fill("2099-01-01T10:00");

  await page.getByRole("button", { name: "Criar", exact: true }).click();

  const card = page
    .locator(".border-wepac-border")
    .filter({ hasText: "Ana Martins" })
    .first();
  await expect(card.getByRole("link", { name: /Entrar na chamada/ })).toBeVisible();

  await card.getByRole("button", { name: "Colar transcrição" }).click();
  await card
    .locator("textarea")
    .fill("Mentor: Como correu a semana?\nAna: Bem, avancei no repertório.");
  await card.getByRole("button", { name: "Guardar transcrição" }).click();

  await card.getByRole("link", { name: "Gerar debrief" }).click();
  await expect(page).toHaveURL(/\/wepacker\/mentor\/sessions\/.+/);
  await expect(page.getByRole("button", { name: "Gerar debrief" })).toBeVisible();
  // Deliberately not clicking — this is exactly where API spend would
  // start. The "ready to generate" state (session.transcript && !debrief)
  // is what's being validated.
});
