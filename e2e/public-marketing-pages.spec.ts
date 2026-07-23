import { test, expect } from "./fixtures/test";
import type { Page } from "@playwright/test";

// Covers four public pages that shipped with zero E2E coverage: the WEPAC
// Society entrance, its "adultos" campaign page, the Summer University
// ("A Travessia") and the Arte à Capela sub-brand landing. None of them
// needs authentication, so — unlike the three auth-gated specs in this
// suite, which currently fail locally under NextAuth v5's `UntrustedHost`
// rejection of `localhost` — this spec actually runs and actually catches
// regressions.
//
// /arte-a-capela (and the /bilheteira, /projetos/arte-a-capela links it
// exposes) read the current published Event via Prisma, so — unlike the
// three Society/Travessia pages, which are fully static — this spec does
// need a real Postgres connection to render correctly.

const PUBLIC_PAGES = [
  { path: "/society", label: "WEPAC Society" },
  { path: "/society/adultos", label: "Adultos campaign" },
  { path: "/society/universidade-verao", label: "Summer University" },
  { path: "/arte-a-capela", label: "Arte à Capela" },
];

// Same-origin, real-navigation hrefs found on a page — excludes in-page
// anchors (#...), external links (Instagram, target=_blank) and non-http
// schemes (mailto:, tel:), none of which are "internal links" in scope
// here.
async function internalHrefs(page: Page): Promise<string[]> {
  const hrefs = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => a.getAttribute("href") ?? "")
  );
  return [...new Set(hrefs)].filter(
    (href) => href.startsWith("/") && !href.startsWith("//")
  );
}

async function hasNoHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    // +1px tolerance for sub-pixel rounding, not a loophole for real overflow.
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });
}

for (const { path, label } of PUBLIC_PAGES) {
  test(`${label} (${path}) returns 200 and renders its main heading`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    expect((await heading.textContent())?.trim().length).toBeGreaterThan(0);
  });

  test(`${label} (${path}) has no horizontal overflow at mobile width`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path);
    expect(await hasNoHorizontalOverflow(page)).toBe(true);
  });

  test(`${label} (${path}) internal links resolve`, async ({ page }) => {
    await page.goto(path);
    const hrefs = await internalHrefs(page);
    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      const response = await page.request.get(href);
      expect(response.status(), `GET ${href} from ${path}`).toBeLessThan(400);
    }
  });
}

// /wepacker used to serve a public landing page; it now sends every visitor
// straight to login. A regression here would silently resurrect a page that
// was deliberately retired.
test("/wepacker redirects to login instead of rendering a landing page", async ({
  page,
}) => {
  const response = await page.goto("/wepacker");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/wepacker\/login$/);
});

// The Society page (and its "adultos" campaign door) must never contain
// health-service vocabulary — it was removed for regulatory reasons. The
// Summer University page is deliberately NOT covered by this check: it
// legitimately says "adulto com competência clínica" (the on-site medical
// safeguard) and "diagnóstico clínico" (explicitly denying that the
// weekend gives you one) — both correct, intentional uses of the same
// words in a different context.
const HEALTH_SERVICE_VOCAB = [
  "clínica",
  "clínico",
  "terapia",
  "terapêutico",
  "saúde mental",
  "diagnóstico",
  "tratamento",
];

for (const path of ["/society", "/society/adultos"]) {
  test(`${path} contains no health-service vocabulary`, async ({ page }) => {
    await page.goto(path);
    const bodyText = ((await page.locator("body").textContent()) ?? "").toLowerCase();
    for (const term of HEALTH_SERVICE_VOCAB) {
      expect(bodyText, `found "${term}" on ${path}`).not.toContain(term);
    }
  });
}

// The Summer University must never render an invented fact. Six constants
// in src/data/universidade-verao.ts (EXACT_DATES, COST_CEILING_EUR,
// FUNDED_PLACES_AVAILABLE, PLACE_COUNT, REPLY_DATE, MENTORS) are
// deliberately null until the founder decides them, and each one gates a
// whole section off the page. Asserting on the *mechanism* (no extra fact
// tiles, no currency symbol, no extra heading, no stray date) catches
// anyone filling one in carelessly or hardcoding a number into the markup
// — asserting on today's exact copy would not.
test("Summer University renders no invented dates, costs, places or mentors", async ({
  page,
}) => {
  await page.goto("/society/universidade-verao");

  // 1. Exactly the four base facts render as <dt> labels — EXACT_DATES,
  // PLACE_COUNT and REPLY_DATE each add one more if set.
  const factLabels = await page.locator("dl dt").allTextContents();
  expect(factLabels).toEqual(["Idades", "Duração", "Local e programa", "Candidaturas até"]);

  // 2. COST_CEILING_EUR gates the entire "Quanto custa" section, which is
  // the only place a € figure could appear on this page.
  const bodyText = (await page.locator("body").textContent()) ?? "";
  expect(bodyText).not.toContain("€");
  await expect(
    page.getByRole("heading", { name: "Quanto custa" })
  ).toHaveCount(0);

  // 3. MENTORS gates the "Quem te acompanha" section.
  await expect(
    page.getByRole("heading", { name: "Quem te acompanha" })
  ).toHaveCount(0);

  // 4. The only date-shaped string ("D de <mês> de AAAA") allowed anywhere
  // on the page is the published application deadline. Any other date
  // means EXACT_DATES or REPLY_DATE got filled in without this test being
  // updated to match — which is exactly the failure mode worth catching.
  const dateLikeMatches = bodyText.match(/\d{1,2} de [a-zà-ú]+ de \d{4}/gi) ?? [];
  expect(dateLikeMatches.length).toBeGreaterThan(0);
  for (const match of dateLikeMatches) {
    expect(match).toBe("10 de agosto de 2026");
  }
});
