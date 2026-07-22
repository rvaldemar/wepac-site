// Editorial copy transcribed verbatim from docs/design/arte-a-capela-figma-spec.md,
// plus the fallback event content rendered when no published Event exists for
// this department yet. Portuguese copy is intentional (user-facing content).

export type ProgrammeRow = {
  work: string;
  composer: string;
};

export const manifesto = {
  statement:
    "Mais do que concertos — experiências que reativam o património. Cada evento cria uma ligação profunda entre o espaço, os artistas e o público.",
  body: "A Arte à Capela transforma capelas, igrejas e locais patrimoniais em cenários vivos para experiências artísticas memoráveis, aproximando o público da história, da música e da cultura de forma contemporânea.",
};

export const pullQuote =
  "A música ressoa diferente entre pedras que guardam séculos de oração e silêncio.";

export const stats: { title: string; caption: string }[] = [
  { title: "Concertos", caption: "Intimistas" },
  { title: "Espaços", caption: "Históricos" },
  { title: "Programação", caption: "Curada" },
];

// The schema has no column for a concert programme (Event/TicketTier only
// carry title/subtitle/description), so this list is always static — it
// renders regardless of which Event is live. See spec section 7.
export const fallbackProgramme: ProgrammeRow[] = [
  { work: "Suíte Nº 1 em Sol Maior", composer: "J. S. Bach" },
  { work: "Capricho Nº 8", composer: "J.-L. Duport" },
  { work: "Suíte Nº 3 em Dó Maior", composer: "J. S. Bach" },
  { work: "Capricho Nº 11", composer: "J.-L. Duport" },
  { work: "Capricho Nº 27", composer: "D. Popper" },
];

// Rendered verbatim when no published upcoming Event exists for the
// arte-a-capela department (see spec section 7 + section 9).
export const fallbackEvent = {
  title: "Catedrais Interiores",
  artist: "António Cortez",
  artistCaption: "Violoncelo",
  dateShort: "18 de junho",
  dateFull: "18 de junho de 2026",
  venue: "A confirmar",
  priceCents: 1200,
  priceLabel: "12€",
};

export const footerTagline =
  "Experiências culturais em espaços patrimoniais históricos de Portugal.";

export const footerSocialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/arteacapela/" },
  { label: "Facebook", href: "https://www.facebook.com/arteacapela/" },
  { label: "YouTube", href: "https://www.youtube.com/@arteacapela" },
];

export const footerInfoLinks = [
  { label: "Sobre o Projecto", href: "/projetos/arte-a-capela" },
  { label: "Bilheteira", href: "/bilheteira" },
  { label: "Contacto", href: "/contacto" },
];
