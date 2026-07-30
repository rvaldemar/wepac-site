export type WepackerLocale = "pt-PT" | "en-US";

export function normalizeWepackerLocale(locale: string): WepackerLocale {
  return locale === "en-US" ? "en-US" : "pt-PT";
}

export function wp<T>(locale: string, portuguese: T, english: T): T {
  return normalizeWepackerLocale(locale) === "en-US" ? english : portuguese;
}

export function formatWepackerDate(
  locale: string,
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(normalizeWepackerLocale(locale), options).format(
    value instanceof Date ? value : new Date(value),
  );
}
