import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

describe("public sitemap", () => {
  it("omits redirecting roots and contains direct project URLs", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).not.toContain("https://wepac.pt/");
    expect(urls).not.toContain("https://wepac.pt/en");
    expect(urls).toContain("https://wepac.pt/wessex");
    expect(urls).toContain("https://wepac.pt/arte-a-capela");
    expect(urls).not.toContain("https://wepac.pt/projetos/wessex");
    expect(urls).not.toContain("https://wepac.pt/projetos/arte-a-capela");
  });
});
