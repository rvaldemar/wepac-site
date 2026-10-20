// Admin date inputs (datetime-local) are Lisbon wall-clock times. Converting
// on the server with an explicit zone keeps sales windows and reveal times
// right regardless of the server's own TZ.
const LISBON_TZ = "Europe/Lisbon";

function lisbonParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LISBON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour"), mi: get("minute") };
}

export function toLisbonInput(value: Date | null | undefined): string {
  if (!value) return "";
  const p = lisbonParts(value);
  return `${p.y}-${p.mo}-${p.d}T${p.h}:${p.mi}`;
}

export function fromLisbonInput(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  // Start from the wall time read as UTC, then correct by Lisbon's offset at
  // that instant (twice, to settle across a DST boundary).
  let utc = Date.UTC(y, mo - 1, d, h, mi);
  for (let i = 0; i < 2; i++) {
    const p = lisbonParts(new Date(utc));
    const shown = Date.UTC(+p.y, +p.mo - 1, +p.d, +p.h, +p.mi);
    utc += Date.UTC(y, mo - 1, d, h, mi) - shown;
  }
  const result = new Date(utc);
  return Number.isNaN(result.getTime()) ? null : result;
}
