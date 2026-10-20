import { describe, it, expect } from "vitest";
import { localizeEvent, localizeTier } from "@/lib/bilheteira/localize";

const event = {
  title: "Festival",
  subtitle: "Sub PT",
  description: "Descrição",
  seoDescription: null,
  directions: null,
  program: [{ time: "10h", title: "Abertura" }],
  faq: null,
  theme: { mode: "dark", heroTitle: "Quem é?", accent: "#E04E2F" },
  translations: { "en-US": { title: "Festival EN", description: "Description", heroTitle: "Who is?", program: [] } },
};

describe("localize", () => {
  it("keeps Portuguese for pt-PT", () => {
    expect(localizeEvent(event, "pt-PT")).toBe(event);
  });

  it("overrides translated fields and falls back for the rest", () => {
    const en = localizeEvent(event, "en-US");
    expect(en.title).toBe("Festival EN");
    expect(en.description).toBe("Description");
    expect(en.subtitle).toBe("Sub PT");
    expect(en.program).toEqual(event.program);
    expect(en.theme).toMatchObject({ heroTitle: "Who is?", accent: "#E04E2F", mode: "dark" });
  });

  it("localizes tier copy without touching prices", () => {
    const tier = {
      name: "Bilhete",
      description: "PT",
      lockedNote: null,
      ctaLabel: null,
      priceCents: 3500,
      translations: { "en-US": { name: "Ticket", lockedNote: "Soon" } },
    };
    expect(localizeTier(tier, "en-US")).toMatchObject({ name: "Ticket", description: "PT", lockedNote: "Soon", priceCents: 3500 });
  });
});
