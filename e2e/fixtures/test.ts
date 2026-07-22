import { test as base, expect } from "@playwright/test";

// Shared `test`/`expect` for every spec in this suite. Pre-accepts the
// cookie consent banner (see src/components/CookieConsent.tsx) on every
// page before any navigation happens — its fixed bottom bar otherwise
// intercepts clicks on anything positioned near the bottom of the
// viewport (e.g. the onboarding "Continuar" CTA), which is real but
// irrelevant to what these flows are testing.
export const test = base.extend({
  page: async ({ page }, providePage) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cookie_consent", "accepted");
    });
    await providePage(page);
  },
});

export { expect };
