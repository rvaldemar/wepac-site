import { test, expect } from "./fixtures/test";
import { loginAs } from "./fixtures/login";

test("mentor creates a Checkpoint session, attaches transcript, sees the W01 certification gate", async ({
  page,
}) => {
  await loginAs(page, "rui@wepac.pt");
  await page.goto("/wepacker/mentor/sessions");
  await page.getByRole("button", { name: "+ New Session" }).click();

  // "Session purpose" already defaults to "checkpoint" — clicking it is
  // redundant but explicit, and doubles as an assertion of the label.
  await page.getByRole("button", { name: /^Checkpoint/ }).click();
  await page.getByRole("button", { name: "Ana Martins" }).click(); // participant

  // Force the scheduled date far into the future so this session always
  // sorts first (list is ordered by scheduledAt desc) regardless of what
  // "now" is on the day the suite runs — the seed already has a session
  // scheduled months out, so relying on "now" as the default would be
  // flaky.
  await page.locator('input[type="datetime-local"]').fill("2099-01-01T10:00");

  await page.getByRole("button", { name: "Create", exact: true }).click();

  // Select the newly-created, still-empty Session by its action rather than by
  // sort order. Playwright retries share the seeded database, so a prior
  // attempt may already have attached a Transcript to an otherwise identical
  // 2099 Session.
  const card = page
    .locator("article")
    .filter({
      has: page.getByRole("link", { name: "Attach Transcript" }),
    })
    .first();
  await expect(
    card.getByRole("link", { name: /Join call/ }),
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
    page.getByText(
      "Debrief generation is unavailable until W01 v3 is published and certified.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate Debrief" }),
  ).toHaveCount(0);

  const previewLink = page.getByRole("link", { name: "Ana Martins" });
  const previewHref = await previewLink.getAttribute("href");
  expect(previewHref).toBeTruthy();
  const previewResponse = await page.request.get(previewHref!);
  await previewLink.click();
  await expect(page).toHaveURL(/\/preview\//);
  expect(previewResponse.headers()["cache-control"]).toContain("no-store");
  expect(previewResponse.headers()["x-robots-tag"]).toContain("noindex");
  const previewBanner = page.getByRole("banner", {
    name: "Read-only attendee preview",
  });
  await expect(
    previewBanner.getByText("Read-only preview: Ana Martins's Session view"),
  ).toBeVisible();
  await expect(
    previewBanner.getByText(
      /You are still Rui Valdemar Santos\. This projection cannot act as Ana Martins/,
    ),
  ).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  await page.getByRole("link", { name: "Exit Preview" }).click();
  await expect(
    page.getByRole("heading", { name: "Session Workspace" }),
  ).toBeVisible();
});
