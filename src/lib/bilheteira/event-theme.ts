import type { CSSProperties } from "react";

// Per-event identity for the landing: a campaign can bring its own palette,
// type treatment, hero image and headline schedule without event-specific
// code. Everything is optional; an empty theme renders the default WEPAC
// ticketing look.
export type ScheduleLine = { time: string; label: string; detail?: string; highlight?: string };

export type EventTheme = {
  mode: "light" | "dark";
  accent: string | null;
  titleStyle: "default" | "condensed";
  heroTitle: string | null;
  eyebrow: string | null;
  tagline: string | null;
  heroImage: string | null;
  schedule: ScheduleLine[];
};

const HEX = /^#[0-9a-fA-F]{6}$/;

function str(value: unknown, max = 300): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().slice(0, max);
  return v || null;
}

function safeImage(value: unknown): string | null {
  const v = str(value, 500);
  if (!v) return null;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  try {
    return new URL(v).protocol === "https:" ? v : null;
  } catch {
    return null;
  }
}

export function parseEventTheme(value: unknown): EventTheme {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const accent = str(raw.accent, 7);
  const schedule = Array.isArray(raw.schedule)
    ? raw.schedule
        .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
        .map((r) => ({
          time: str(r.time, 40) ?? "",
          label: str(r.label, 120) ?? "",
          detail: str(r.detail, 200) ?? undefined,
          highlight: str(r.highlight, 120) ?? undefined,
        }))
        .filter((r) => r.time && r.label)
        .slice(0, 6)
    : [];
  return {
    mode: raw.mode === "dark" ? "dark" : "light",
    accent: accent && HEX.test(accent) ? accent : null,
    titleStyle: raw.titleStyle === "condensed" ? "condensed" : "default",
    heroTitle: str(raw.heroTitle, 160),
    eyebrow: str(raw.eyebrow, 80),
    tagline: str(raw.tagline, 240),
    heroImage: safeImage(raw.heroImage),
    schedule,
  };
}

// Admin text format for the hero schedule, one line per row:
// «10h–18h30 | Festival | detalhe opcional | destaque opcional».
export function scheduleFromText(text: string): ScheduleLine[] {
  return text
    .split("\n")
    .map((line) => line.split("|").map((p) => p.trim()))
    .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
    .slice(0, 6)
    .map(([time, label, detail, highlight]) => ({
      time,
      label,
      detail: detail || undefined,
      highlight: highlight || undefined,
    }));
}

export function scheduleToText(lines: ScheduleLine[]): string {
  return lines
    .map((l) => {
      const parts = [l.time, l.label];
      if (l.detail || l.highlight) parts.push(l.detail ?? "");
      if (l.highlight) parts.push(l.highlight);
      return parts.join(" | ");
    })
    .join("\n");
}

// CSS variables consumed by the landing components. Light mode reproduces the
// default ticketing look; dark mode is the campaign treatment.
export function themeVars(theme: EventTheme): CSSProperties {
  const dark = theme.mode === "dark";
  const accent = theme.accent ?? (dark ? "#FFFFFF" : "#000000");
  const vars: Record<string, string> = dark
    ? {
        "--ev-bg": "#0A0A0A",
        "--ev-ink": "#FFFFFF",
        "--ev-muted": "rgba(255,255,255,0.68)",
        "--ev-faint": "rgba(255,255,255,0.5)",
        "--ev-line": "rgba(255,255,255,0.16)",
        "--ev-card": "#141414",
        "--ev-card-dim": "#0f0f0f",
        "--ev-field": "#0A0A0A",
        "--ev-accent": accent,
        "--ev-cta": theme.accent ?? "#FFFFFF",
        "--ev-cta-ink": theme.accent ? "#FFFFFF" : "#000000",
        "--ev-badge": "#FFFFFF",
        "--ev-badge-ink": "#000000",
      }
    : {
        "--ev-bg": "#f5f4f0",
        "--ev-ink": "#000000",
        "--ev-muted": "rgba(0,0,0,0.68)",
        "--ev-faint": "rgba(0,0,0,0.5)",
        "--ev-line": "rgba(0,0,0,0.12)",
        "--ev-card": "#FFFFFF",
        "--ev-card-dim": "rgba(255,255,255,0.6)",
        "--ev-field": "#FFFFFF",
        "--ev-accent": accent,
        "--ev-cta": theme.accent ?? "#000000",
        "--ev-cta-ink": "#FFFFFF",
        "--ev-badge": "#000000",
        "--ev-badge-ink": "#FFFFFF",
      };
  return vars as CSSProperties;
}
