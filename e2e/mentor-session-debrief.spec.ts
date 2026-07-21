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
  await expect(
    card.getByRole("link", { name: /Entrar na chamada/ }),
  ).toBeVisible();

  await card.getByRole("link", { name: "Attach Transcript" }).click();
  await expect(page).toHaveURL(/\/wepacker\/mentor\/sessions\/.+/);
  await page.locator('input[type="file"]').setInputFiles({
    name: "session.vtt",
    mimeType: "text/vtt",
    buffer: Buffer.from(
      "WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nMentor: Como correu a semana?\n\n00:00:03.000 --> 00:00:06.000\nAna: Bem, avancei no repertório.",
    ),
  });
  await expect(page.locator("textarea")).toHaveValue(/Ana: Bem/);
  await page.getByRole("button", { name: "Save Transcript" }).click();

  await expect(
    page.getByRole("button", { name: "Generate Debrief" }),
  ).toBeVisible();
  // Deliberately not clicking — this is exactly where API spend would
  // start. The "ready to generate" state (session.transcript && !debrief)
  // is what's being validated.

  const previewLink = page.getByRole("link", { name: "Ana Martins" });
  const previewHref = await previewLink.getAttribute("href");
  expect(previewHref).toBeTruthy();
  const previewResponse = await page.request.get(previewHref!);
  await previewLink.click();
  await expect(page).toHaveURL(/\/preview\//);
  expect(previewResponse.headers()["cache-control"]).toContain("no-store");
  expect(previewResponse.headers()["x-robots-tag"]).toContain("noindex");
  await expect(
    page.getByText("Previewing Ana Martins's Session view"),
  ).toBeVisible();
  await expect(
    page.getByText(/You are still .*This preview is read-only/),
  ).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  await page.getByRole("link", { name: "Exit Preview" }).click();
  await expect(
    page.getByRole("heading", { name: "Session Workspace" }),
  ).toBeVisible();
});
