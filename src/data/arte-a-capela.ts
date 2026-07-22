// Editorial copy transcribed verbatim from docs/design/arte-a-capela-figma-spec.md,
// plus the fallback event content rendered when no published Event exists for
// this department yet. Portuguese copy is intentional (user-facing content).

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

// There is no real Arte à Capela event to attach a programme to yet — the
// previous programme rows (and the `programmeEventSlug` gate pinning them to
// one seeded event) were placeholder content transcribed from a designer's
// Figma mockup, not a real concert. Do not reintroduce a static programme
// here; it belongs on the real Event once one exists.

// Rendered when no published upcoming Event exists for the arte-a-capela
// department. Deliberately has no title/artist/venue — those would have to
// be invented, and this is a real cultural organisation's website.
export const noUpcomingEvent = {
  heading: "Ainda não há concerto marcado.",
  body: "Estamos a preparar a próxima experiência da Arte à Capela. Assim que a data for confirmada, os bilhetes ficam disponíveis na bilheteira.",
  // Deliberately distinct from `heading` above — the event section (#evento)
  // and the ticketing block both render a "no concert yet" message in
  // display serif on the same page, and a design review ruled that the two
  // must never repeat the identical sentence in that voice.
  ticketingHeading: "Ainda não há bilhetes à venda.",
};

export const footerTagline =
  "Experiências culturais em espaços patrimoniais históricos de Portugal.";

// Arte à Capela has no social accounts of its own — it lives as a highlight on
// the WEPAC account, which is the handle the rest of the site links to (see the
// contacto page). The three per-brand handles that were here previously were
// invented and pointed at accounts that do not exist. Do not add a handle here
// without opening it first.
export const footerSocialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/wepac.oficial/" },
];

export const footerInfoLinks = [
  { label: "Sobre o Projecto", href: "/projetos/arte-a-capela" },
  { label: "Bilheteira", href: "/bilheteira" },
  { label: "Contacto", href: "/contacto" },
  { label: "Privacidade", href: "/privacidade" },
];
