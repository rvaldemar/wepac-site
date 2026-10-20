import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/email-security", async () => {
  const actual = await vi.importActual<typeof import("@/lib/email-security")>(
    "@/lib/email-security",
  );
  return { ...actual, emailTransporter: { sendMail: vi.fn() } };
});

import { renderTicketEmail, type TicketEmailData } from "@/lib/bilheteira/ticket-email";
import { mergeText, mergeUrl, SAMPLE_MERGE_VALUES } from "@/lib/bilheteira/email-merge";

const base: TicketEmailData = {
  to: "ana@example.com",
  buyerName: "Ana <Silva>",
  eventTitle: "Festival",
  startsAt: new Date("2026-11-21T10:00:00Z"),
  venue: "Capela",
  tierName: "Bilhete Artista",
  priceCents: 1500,
  totalCents: 1500,
  seats: 2,
  ticketId: "tk_1",
  ticketSerial: 1042,
};

describe("email merge fields", () => {
  it("replaces known fields and leaves unknown ones", () => {
    expect(mergeText("Olá {{nome}} {{x}}", SAMPLE_MERGE_VALUES)).toBe("Olá Ana Silva {{x}}");
  });

  it("percent-encodes values inside URLs", () => {
    const url = mergeUrl("https://forms.example/r?b={{bilhete}}&e={{email}}&n={{nome}}", {
      ...SAMPLE_MERGE_VALUES,
      nome: "Ana & Rui?x=1",
    });
    expect(url).toBe(
      "https://forms.example/r?b=1042&e=ana.silva%40example.com&n=Ana%20%26%20Rui%3Fx%3D1",
    );
  });
});

describe("renderTicketEmail", () => {
  it("shows the real total for bundles, not price × seats", () => {
    const { html } = renderTicketEmail(base);
    expect(html).toContain("15 €");
    expect(html).not.toContain("30 €");
    expect(html).toContain("1042");
  });

  it("renders notes escaped and the CTA with a prefilled link", () => {
    const { html } = renderTicketEmail({
      ...base,
      tierEmailNote: "Olá {{nome}},\n\nA candidatura abre em breve.",
      eventEmailNote: "Até dia 21.",
      emailCtaLabel: "Candidatar",
      emailCtaUrl: "https://forms.example/c?bilhete={{bilhete}}&email={{email}}",
    });
    expect(html).toContain("Olá Ana &lt;Silva&gt;,");
    expect(html).toContain("A candidatura abre em breve.");
    expect(html).toContain("Até dia 21.");
    expect(html).toContain("https://forms.example/c?bilhete=1042&amp;email=ana%40example.com");
    expect(html).toContain("Candidatar");
  });

  it("drops a CTA whose link is not https", () => {
    const { html } = renderTicketEmail({
      ...base,
      emailCtaLabel: "Abrir",
      emailCtaUrl: "javascript:alert(1)",
    });
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain(">Abrir<");
  });
});
