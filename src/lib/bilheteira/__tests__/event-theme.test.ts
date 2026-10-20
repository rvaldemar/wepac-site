import { describe, it, expect } from "vitest";
import { parseEventTheme, scheduleFromText, scheduleToText, themeVars } from "@/lib/bilheteira/event-theme";

describe("event theme", () => {
  it("defaults to the light ticketing look", () => {
    const t = parseEventTheme(null);
    expect(t).toMatchObject({ mode: "light", accent: null, titleStyle: "default", schedule: [] });
  });

  it("rejects unsafe colours and images", () => {
    const t = parseEventTheme({ accent: "red;}", heroImage: "javascript:alert(1)", mode: "dark" });
    expect(t.accent).toBeNull();
    expect(t.heroImage).toBeNull();
    expect(parseEventTheme({ heroImage: "//evil.example/x.png" }).heroImage).toBeNull();
    expect(parseEventTheme({ heroImage: "/images/x.webp" }).heroImage).toBe("/images/x.webp");
  });

  it("round-trips the schedule text format", () => {
    const text = "10h–18h30 | Festival\n19h30 | Concerto | e Prémios | Edição Orpheu";
    const lines = scheduleFromText(text);
    expect(lines).toEqual([
      { time: "10h–18h30", label: "Festival", detail: undefined, highlight: undefined },
      { time: "19h30", label: "Concerto", detail: "e Prémios", highlight: "Edição Orpheu" },
    ]);
    expect(scheduleToText(lines)).toBe(text);
  });

  it("uses the accent for calls to action in dark mode", () => {
    const vars = themeVars(parseEventTheme({ mode: "dark", accent: "#E04E2F" })) as Record<string, string>;
    expect(vars["--ev-bg"]).toBe("#0A0A0A");
    expect(vars["--ev-cta"]).toBe("#E04E2F");
  });
});
