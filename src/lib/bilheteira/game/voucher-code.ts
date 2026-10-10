import { randomInt } from "node:crypto";

// No 0/O/1/I to keep codes unambiguous when read aloud at the box office.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** e.g. "AC-7K3M-Q9ZT" — "AC" = Arte à Capela. */
export function generateVoucherCode(
  rand: (max: number) => number = (max) => randomInt(max),
): string {
  const block = () =>
    Array.from({ length: 4 }, () => ALPHABET[rand(ALPHABET.length)]).join("");
  return `AC-${block()}-${block()}`;
}

export function normalizeVoucherCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length === 10 && cleaned.startsWith("AC")) {
    return `AC-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
  }
  if (cleaned.length === 8) {
    return `AC-${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
  }
  return raw.trim().toUpperCase();
}

export const VOUCHER_CODE_RE = /^AC-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
