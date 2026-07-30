import type { AppLocale } from "@/i18n/routing";

type ArteACapelaCopy = {
  metadataTitle: string;
  metadataDescription: string;
  navAbout: string;
  navEvents: string;
  navTickets: string;
  heroLines: string[];
  heroItalicLines: string[];
  heroBody: string;
  buyTicket: string;
  viewTickets: string;
  viewProgramme: string;
  manifesto: { statement: string; body: string };
  galleryAlts: string[];
  pullQuote: string;
  stats: Array<{ title: string; caption: string }>;
  azulejosAlt: string;
  lisbonAlt: string;
  nextEvent: string;
  date: string;
  entrance: string;
  secureTicket: string;
  artist: string;
  noUpcomingEvent: {
    heading: string;
    body: string;
    ticketingHeading: string;
  };
  goToTickets: string;
  stainedGlassAlt: string;
  ticketing: string;
  venue: string;
  doors: string;
  limitedSeats: string;
  cancelled: string;
  chooseSeat: string;
  vatExempt: string;
  availability: string;
  noTickets: string;
  ticketingProgramme: string;
  footerTagline: string;
  socialNetworks: string;
  information: string;
  footerInfoLinks: Array<{ label: string; href: string }>;
  footerSignature: string;
};

const ptPT: ArteACapelaCopy = {
  metadataTitle:
    "Arte à Capela | WEPAC — Concertos em espaços patrimoniais",
  metadataDescription:
    "Concertos intimistas e experiências imersivas em capelas, igrejas e espaços históricos de Portugal.",
  navAbout: "Sobre",
  navEvents: "Eventos",
  navTickets: "Bilhetes",
  heroLines: ["A arte", "ganha", "nova vida"],
  heroItalicLines: ["dentro do", "património."],
  heroBody:
    "Concertos intimistas e experiências imersivas em capelas, igrejas e espaços históricos de Portugal.",
  buyTicket: "Comprar bilhete",
  viewTickets: "Ver bilheteira",
  viewProgramme: "Ver programação",
  manifesto: {
    statement:
      "Mais do que concertos — experiências que reativam o património. Cada evento cria uma ligação profunda entre o espaço, os artistas e o público.",
    body: "A Arte à Capela transforma capelas, igrejas e locais patrimoniais em cenários vivos para experiências artísticas memoráveis, aproximando o público da história, da música e da cultura de forma contemporânea.",
  },
  galleryAlts: [
    "Claustro de um edifício patrimonial",
    "Detalhe de talha dourada",
    "Vitral de uma capela histórica",
  ],
  pullQuote:
    "A música ressoa diferente entre pedras que guardam séculos de oração e silêncio.",
  stats: [
    { title: "Concertos", caption: "Intimistas" },
    { title: "Espaços", caption: "Históricos" },
    { title: "Programação", caption: "Curada" },
  ],
  azulejosAlt: "Painel de azulejos portugueses",
  lisbonAlt: "Vista de Lisboa a partir de um espaço patrimonial",
  nextEvent: "Próximo evento",
  date: "Data",
  entrance: "Entrada",
  secureTicket: "Garantir bilhete",
  artist: "Artista",
  noUpcomingEvent: {
    heading: "Ainda não há concerto marcado.",
    body: "Estamos a preparar a próxima experiência da Arte à Capela. Assim que a data for confirmada, os bilhetes ficam disponíveis na bilheteira.",
    ticketingHeading: "Ainda não há bilhetes à venda.",
  },
  goToTickets: "Ir para a bilheteira",
  stainedGlassAlt: "Túmulo sob um vitral histórico",
  ticketing: "Bilheteira",
  venue: "Local",
  doors: "Portas",
  limitedSeats:
    "Lugares limitados. Bilhete enviado por e-mail após confirmação do pagamento.",
  cancelled:
    "Pagamento cancelado. Se foi engano, podes tentar novamente.",
  chooseSeat: "Escolhe o teu lugar",
  vatExempt: "Preços isentos de IVA ao abrigo do art.º 9.º do CIVA.",
  availability: "Disponibilidade",
  noTickets: "Ainda não há bilhetes publicados para este evento.",
  ticketingProgramme:
    "A bilheteira reúne todos os eventos da WEPAC com lugares em aberto — a programação completa está sempre lá.",
  footerTagline:
    "Experiências culturais em espaços patrimoniais históricos de Portugal.",
  socialNetworks: "Redes sociais",
  information: "Informações",
  footerInfoLinks: [
    { label: "Sobre o Projeto", href: "/projetos/arte-a-capela" },
    { label: "Bilheteira", href: "/bilheteira" },
    { label: "Contacto", href: "/contacto" },
    { label: "Privacidade", href: "/privacidade" },
  ],
  footerSignature: "Portugal · Cultura · Património",
};

const enUS: ArteACapelaCopy = {
  metadataTitle: "Arte à Capela | WEPAC — Concerts in heritage spaces",
  metadataDescription:
    "Intimate concerts and immersive experiences in Portugal's chapels, churches and historic spaces.",
  navAbout: "About",
  navEvents: "Events",
  navTickets: "Tickets",
  heroLines: ["Art", "finds", "new life"],
  heroItalicLines: ["within our", "heritage."],
  heroBody:
    "Intimate concerts and immersive experiences in Portugal's chapels, churches and historic spaces.",
  buyTicket: "Buy a ticket",
  viewTickets: "View tickets",
  viewProgramme: "View programme",
  manifesto: {
    statement:
      "More than concerts — experiences that bring heritage back to life. Every event creates a deep connection between the space, the artists and the audience.",
    body: "Arte à Capela turns chapels, churches and heritage sites into living settings for memorable artistic experiences, bringing audiences closer to history, music and culture in a contemporary way.",
  },
  galleryAlts: [
    "Cloister in a heritage building",
    "Detail of gilded woodcarving",
    "Stained glass in a historic chapel",
  ],
  pullQuote:
    "Music resonates differently among stones that hold centuries of prayer and silence.",
  stats: [
    { title: "Concerts", caption: "Intimate" },
    { title: "Spaces", caption: "Historic" },
    { title: "Programme", caption: "Curated" },
  ],
  azulejosAlt: "Panel of Portuguese tiles",
  lisbonAlt: "View of Lisbon from a heritage site",
  nextEvent: "Next event",
  date: "Date",
  entrance: "Admission",
  secureTicket: "Reserve a ticket",
  artist: "Artist",
  noUpcomingEvent: {
    heading: "There is no concert scheduled yet.",
    body: "We are preparing the next Arte à Capela experience. Tickets will become available as soon as the date is confirmed.",
    ticketingHeading: "There are no tickets on sale yet.",
  },
  goToTickets: "Go to tickets",
  stainedGlassAlt: "Tomb beneath historic stained glass",
  ticketing: "Tickets",
  venue: "Venue",
  doors: "Doors",
  limitedSeats:
    "Limited capacity. Your ticket will be sent by email after payment is confirmed.",
  cancelled:
    "Payment was cancelled. If that was a mistake, you can try again.",
  chooseSeat: "Choose your ticket",
  vatExempt: "Prices are VAT-exempt under article 9 of the Portuguese VAT Code.",
  availability: "Availability",
  noTickets: "There are no published tickets for this event yet.",
  ticketingProgramme:
    "The ticket office lists every WEPAC event with places available, so the complete programme is always there.",
  footerTagline:
    "Cultural experiences in Portugal's historic heritage spaces.",
  socialNetworks: "Social media",
  information: "Information",
  footerInfoLinks: [
    { label: "About the project", href: "/projetos/arte-a-capela" },
    { label: "Tickets", href: "/bilheteira" },
    { label: "Contact", href: "/contacto" },
    { label: "Privacy", href: "/privacidade" },
  ],
  footerSignature: "Portugal · Culture · Heritage",
};

const dictionaries: Record<AppLocale, ArteACapelaCopy> = {
  "pt-PT": ptPT,
  "en-US": enUS,
};

export function getArteACapelaCopy(locale: string): ArteACapelaCopy {
  return dictionaries[locale === "en-US" ? "en-US" : "pt-PT"];
}
