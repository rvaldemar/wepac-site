// Merge fields available in confirmation-email notes and CTA links, so a
// form link can arrive prefilled (e.g. ?bilhete={{bilhete}}&email={{email}}).
export const EMAIL_MERGE_FIELDS = {
  nome: "Nome do comprador",
  email: "Email do comprador",
  bilhete: "Número do bilhete",
  evento: "Título do evento",
  tipo: "Nome do bilhete",
  lugares: "Número de lugares",
} as const;

export type EmailMergeField = keyof typeof EMAIL_MERGE_FIELDS;
export type EmailMergeValues = Record<EmailMergeField, string>;

const FIELD_PATTERN = /\{\{\s*([a-z_]+)\s*\}\}/g;

function mergeWith(
  template: string,
  values: EmailMergeValues,
  encode: (value: string) => string,
): string {
  return template.replace(FIELD_PATTERN, (match, key: string) =>
    key in values ? encode(values[key as EmailMergeField]) : match,
  );
}

// Plain text: values are inserted verbatim; callers escape the result for HTML.
export function mergeText(template: string, values: EmailMergeValues): string {
  return mergeWith(template, values, (v) => v);
}

// URLs: every value is percent-encoded so buyer data can never change the
// structure of the link.
export function mergeUrl(template: string, values: EmailMergeValues): string {
  return mergeWith(template, values, encodeURIComponent);
}

export const SAMPLE_MERGE_VALUES: EmailMergeValues = {
  nome: "Ana Silva",
  email: "ana.silva@example.com",
  bilhete: "1042",
  evento: "Festival Quem é o Teu Mestre?",
  tipo: "Festival – Bilhete Artista (Early Bird)",
  lugares: "1",
};
