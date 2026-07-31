import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getSocietyCopy } from "@/i18n/copy/society";

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        shape(item),
      ]),
    );
  }
  return typeof value;
}

describe("Society narrative", () => {
  const pt = getSocietyCopy("pt-PT");
  const en = getSocietyCopy("en-US");

  it("keeps both locales structurally complete", () => {
    expect(shape(en)).toEqual(shape(pt));
  });

  it("puts the Life Plan at the center and keeps the public punchline", () => {
    expect(pt.hero.title).toBe("From packers to WEPACkers.");
    expect(pt.hero.subtitle).toContain("Life Plan");
    expect(pt.lifePlan.title).toContain("Life Plan");
    expect(pt.lifePlan.lead).toContain("Life Map");
    expect(en.hero.subtitle).toContain("Life Plan");
    expect(pt.applications.items.map((item) => item.name)).toEqual([
      "Carreira",
      "Relações",
      "Educação",
      "Família",
    ]);
  });

  it("uses Pack only as community and never as a package or subscription", () => {
    const packCopy = JSON.stringify(pt.packs).toLowerCase();
    expect(packCopy).toContain("comunidade");
    expect(packCopy).not.toContain("pacote");
    expect(packCopy).not.toContain("subscri");
    expect(JSON.stringify(en.packs).toLowerCase()).toContain("community");
  });

  it("keeps subscription continuity separate in Upgraded Backpack", () => {
    const upgraded = pt.platform.products.find(
      (product) => product.name === "Upgraded Backpack",
    );
    expect(upgraded?.state).toBe("Subscrição disponível");
    expect(upgraded?.line).toContain("depois do Life Plan");
  });

  it("states the current proof without claiming ownership of people's results", () => {
    expect(pt.proof.body).toContain("Dezenas");
    expect(pt.proof.body).toContain("três atletas medalhados");
    expect(pt.proof.body).toContain("Jotta Pê");
    expect(pt.proof.support).toContain("Os resultados pertencem às pessoas");
    expect(pt.proof.body).not.toMatch(/\bBGA\b/i);
  });

  it("spells zero out in the Academy line and includes the organizations offer", () => {
    expect(pt.academy.title).toBe("Do zero ao infinito — e mais além.");
    expect(pt.academy.title).not.toMatch(/\b0\b/);
    expect(pt.organizations.body).toContain("equipas de RH");
    expect(pt.organizations.privacyBody).toContain("consentimento explícito");
    expect(en.organizations.body).toContain("HR teams");
  });

  it("keeps the three Academy stages as equal parts of one route", () => {
    expect(pt.academy.stages.map((stage) => stage.name)).toEqual([
      "Easy Peasy",
      "Step Up",
      "YUP",
    ]);
    expect(en.academy.stages.map((stage) => stage.name)).toEqual([
      "Easy Peasy",
      "Step Up",
      "YUP",
    ]);
  });

  it("does not leave navigation pointing at removed Society sections", () => {
    const header = readFileSync(resolve(process.cwd(), "src/components/society/SocietyHeader.tsx"), "utf8");
    const footer = readFileSync(resolve(process.cwd(), "src/components/society/SocietyFooter.tsx"), "utf8");

    expect(header).not.toContain("/society#organizations");
    expect(footer).not.toContain("/society#mission");
  });
});
