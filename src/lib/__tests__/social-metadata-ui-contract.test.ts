import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("key page social metadata contract", () => {
  const pages = [
    "src/app/[locale]/society/page.tsx",
    "src/app/[locale]/wessex/page.tsx",
    "src/app/[locale]/arte-a-capela/page.tsx",
    "src/app/[locale]/bilheteira/page.tsx",
    "src/app/[locale]/bilheteira/[slug]/page.tsx",
  ];

  it.each(pages)("uses the shared localized social metadata helper in %s", (path) => {
    expect(readFileSync(path, "utf8")).toContain("buildSocialMetadata");
  });

  it("uses the dynamic event description and cover image", () => {
    const eventPage = readFileSync(pages[4], "utf8");
    expect(eventPage).toContain("description: event.description.slice(0, 160)");
    expect(eventPage).toContain("image: event.coverImage");
  });
});
