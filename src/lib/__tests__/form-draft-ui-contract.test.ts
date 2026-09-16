import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("critical form draft UI contract", () => {
  const intake = readFileSync("src/app/[locale]/wepacker/(public)/intake/page-client.tsx", "utf8");
  const contact = readFileSync("src/app/[locale]/(site)/contacto/page.tsx", "utf8");
  const chat = readFileSync("src/components/wessex/ChatAssistant.tsx", "utf8");

  it.each([
    ["intake", intake],
    ["contact", contact],
  ])("persists, clears on success and reloads only for stale deployment in %s", (_name, source) => {
    expect(source).toContain("useLocalFormDraft");
    expect(source).toContain("saveDraft(form)");
    expect(source).toContain("clearDraft()");
    expect(source).toContain("isStaleDeploymentError");
    expect(source).toContain("window.location.reload()");
  });

  it("keeps only the pending Wessex prompt until a complete response", () => {
    expect(chat).toContain("FORM_DRAFT_KEY_PREFIX");
    expect(chat).toContain("writeBrowserFormDraft");
    expect(chat).toContain("clearBrowserFormDraft");
  });
});
