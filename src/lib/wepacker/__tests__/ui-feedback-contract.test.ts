import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("WEPACKER UI feedback contracts", () => {
  it("keeps the message composer accessible, bounded and retryable", () => {
    const source = readFileSync(
      "src/app/[locale]/wepacker/(platform)/messages/page-client.tsx",
      "utf8",
    );

    expect(source).toContain("<textarea");
    expect(source).toContain("maxLength={10000}");
    expect(source).toContain('e.key === "Enter" && !e.shiftKey');
    expect(source.match(/role="alert"/g)).toHaveLength(2);
    expect(source).toContain("Promise.allSettled");
    expect(source).toContain("setSendError");
  });

  it("provides localized, accessible loaders without forced animation", () => {
    const source = readFileSync("src/components/RouteLoading.tsx", "utf8");
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-busy="true"');
    expect(source).toContain("motion-reduce:animate-none");
    expect(source).toContain('wp(locale, "A carregar conteúdo", "Loading content")');
  });

  it("does not change the already-correct intake form", () => {
    const source = readFileSync(
      "src/app/[locale]/wepacker/(public)/intake/page-client.tsx",
      "utf8",
    );
    expect(source).toContain("autoComplete=");
  });
});
