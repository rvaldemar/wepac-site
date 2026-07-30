import type { AppLocale } from "@/i18n/routing";
import type { ServiceType } from "@/data/wessex-pricing";

type WessexCopy = {
  page: {
    metadataTitle: string;
    metadataDescription: string;
    navAbout: string;
    navEvents: string;
    navIdea: string;
    navTestimonials: string;
    heroLead: string;
    heroEmphasis: string;
    heroBody: string;
    calculate: string;
    contact: string;
    trust: string[];
    about: string;
    aboutLead: string;
    aboutEmphasis: string;
    aboutBody: string[];
    eventsLead: string;
    eventCards: Array<{
      title: string;
      subtitle: string;
      image: string;
      items: string[];
    }>;
    features: Array<{ title: string; text: string }>;
    testimonials: string;
    testimonialItems: Array<{ name: string; quote: string }>;
    nextLead: string;
    nextBody: string;
    benefits: string[];
    copyright: string;
    privacy: string;
  };
  calculator: {
    ensemble: string;
    selectEnsemble: string;
    classical: string;
    bands: string;
    onRequest: string;
    musicians: (count: number) => string;
    serviceType: string;
    selectService: string;
    serviceLabels: Record<ServiceType, string>;
    bandCocktail: string;
    bandNote: string;
    addSound: string;
    quoteOnRequest: string;
    requestQuote: string;
    estimated: string;
    performancePrice: (duration: string) => string;
    includesSound: string;
    travel: string;
    order: string;
    customRequest: (name: string) => string;
    orderMessage: (
      name: string,
      musicians: string,
      service: string,
      sound: boolean,
      total: number,
    ) => string;
    ensembleNames: Record<string, string>;
    ensembleDescriptions: Record<string, string>;
    durationTwoHours: string;
  };
  chat: {
    welcome: string;
    error: string;
    consent: string;
    privacy: string;
    accept: string;
    placeholder: string;
    blockedPlaceholder: string;
    send: string;
    calculatorTab: string;
    assistantTab: string;
  };
};

const ptPT: WessexCopy = {
  page: {
    metadataTitle: "Wessex | WEPAC — Música ao vivo para eventos especiais",
    metadataDescription:
      "Música ao vivo feita à medida para casamentos, eventos e celebrações íntimas. Do quarteto de cordas à serenata surpresa.",
    navAbout: "QUEM SOMOS",
    navEvents: "EVENTOS",
    navIdea: "A NOSSA IDEIA",
    navTestimonials: "DEPOIMENTOS",
    heroLead: "A música que transforma celebração em",
    heroEmphasis: "memória inesquecível",
    heroBody:
      "Música ao vivo feita à medida para casamentos, eventos e celebrações íntimas. Do quarteto de cordas à serenata surpresa, criamos experiências com elegância, emoção e impacto.",
    calculate: "Simular orçamento",
    contact: "Fala connosco",
    trust: [
      "Resposta em menos de 24h",
      "Sem compromisso inicial",
      "Proposta personalizada e gratuita",
    ],
    about: "Quem somos",
    aboutLead: "Mais do que música ao vivo.",
    aboutEmphasis: "Uma experiência construída para o teu momento.",
    aboutBody: [
      "A Wessex nasceu de uma convicção simples: a música tem o poder de elevar qualquer momento e, quando é feita com intenção, torna-se a memória que as pessoas guardam para sempre. Somos um ensemble de músicos profissionais especializados em eventos especiais. Cada performance é construída à medida do teu evento, do teu espaço e da emoção que queres criar.",
      "Trabalhamos com noivos que querem uma cerimónia que arrepia, com empresas que querem um jantar que impressiona e com pessoas que querem criar uma surpresa que não se esquece. O que une todos? A vontade de que a música faça a diferença.",
    ],
    eventsLead:
      "Uma performance para cada momento, adaptada a cada celebração.",
    eventCards: [
      {
        title: "Casamento",
        subtitle: "O dia mais importante merece a música mais especial.",
        image: "/images/wessex/card-casamento.jpg",
        items: [
          "Cerimónia: entrada da noiva, troca de alianças, saída",
          "Cocktail: ambiente elegante e envolvente",
          "Jantar e receção: repertório personalizado",
          "Formatos: solo, duo, trio ou quarteto",
          "Com ou sem voz",
          "Repertório 100% adaptado ao casal",
        ],
      },
      {
        title: "Cocktail & Celebrações",
        subtitle:
          "Para os momentos que não precisam de ser grandes, só de ser inesquecíveis.",
        image: "/images/wessex/card-cocktail.jpg",
        items: [
          "Jantares privados e aniversários em casa",
          "Pedidos de casamento e serenatas surpresa",
          "Celebrações íntimas e momentos especiais",
          "Rooftops, jardins, restaurantes e hotéis",
          "Formatos compactos a partir de duo",
          "Organização total do momento surpresa",
        ],
      },
      {
        title: "Corporativo",
        subtitle:
          "A música certa transforma um evento de empresa num momento de prestígio.",
        image: "/images/wessex/card-corporativo.jpg",
        items: [
          "Jantares de gala e eventos de empresa",
          "Lançamentos de produto e apresentações VIP",
          "Cocktails e receções corporativas",
          "Espaços corporativos, hotéis e auditórios",
          "Tom elegante e profissional garantido",
          "Proposta comercial detalhada para RH e Marketing",
        ],
      },
    ],
    features: [
      {
        title: "Música à medida",
        text: "Nenhuma performance é igual à anterior. O repertório, o formato e a intensidade são pensados especificamente para o teu evento, o teu espaço e a emoção que queres criar.",
      },
      {
        title: "Músicos profissionais",
        text: "Formação clássica, experiência em eventos premium e capacidade de adaptar qualquer género musical — do clássico ao contemporâneo, com elegância e precisão.",
      },
      {
        title: "Flexibilidade de formatos",
        text: "Solo, duo, trio ou quarteto, com ou sem voz. Adaptamos o ensemble ao teu orçamento, ao espaço disponível e ao momento do evento em que queremos causar mais impacto.",
      },
      {
        title: "História e impacto musical",
        text: "A nossa missão não é apenas tocar bem: é fazer as pessoas sentir. Cada nota é colocada com intenção. O objetivo é sempre o mesmo: criar o momento que todos vão querer reviver.",
      },
    ],
    testimonials: "Depoimentos",
    testimonialItems: [
      {
        name: "Giovanna Fraga",
        quote:
          "A música no nosso casamento foi incrível! Tocada pelo Grupo Wessex, com emoção e sensibilidade, tornou o momento ainda mais especial. Convidados encantados e um dia inesquecível. Obrigada!",
      },
      {
        name: "Pedro Azevedo",
        quote:
          "A música no nosso casamento foi simplesmente emocionante! Cada nota trouxe um toque especial ao momento, tornando tudo ainda mais inesquecível. A sensibilidade e o talento fizeram toda a diferença.",
      },
      {
        name: "Dinamene Silva",
        quote:
          "Que momento mágico! A música tornou o nosso pedido de casamento ainda mais especial e emocionante. Cada nota transmitiu amor e tornou o momento inesquecível.",
      },
      {
        name: "Chef Eunice Silveira",
        quote:
          "O talento do saxofonista trouxe um toque de elegância e animação à festa de 18 anos da minha cliente. A música envolvente criou uma atmosfera incrível e encantou toda a gente.",
      },
    ],
    nextLead: "O próximo será o seu",
    nextBody:
      "Preencha o formulário para podermos preparar uma proposta personalizada.",
    benefits: [
      "Consultoria de repertório gratuita",
      "Registo em vídeo do momento",
      "Prioridade de data",
    ],
    copyright: "© 2026. Todos os direitos reservados.",
    privacy: "Termos e Privacidade",
  },
  calculator: {
    ensemble: "Ensemble",
    selectEnsemble: "Seleciona o ensemble",
    classical: "Ensembles clássicos",
    bands: "Bandas",
    onRequest: "Sob consulta",
    musicians: (count) => `${count} músicos`,
    serviceType: "Tipo de serviço",
    selectService: "Seleciona o tipo de serviço",
    serviceLabels: {
      cerimonias: "Cerimónias / Eventos (1h)",
      cocktails: "Cocktails / Copo d'Água (1h)",
      experiencia_completa: "Experiência completa",
    },
    bandCocktail: "Cocktails / Copo d'Água (2h)",
    bandNote:
      "As bandas atuam apenas em formato Cocktails / Copo d'Água (2 horas).",
    addSound: "Adicionar equipa de som (+200€)",
    quoteOnRequest: "Orçamento sob consulta",
    requestQuote: "Pedir orçamento",
    estimated: "Valor estimado",
    performancePrice: (duration) => `Preço para ${duration} de performance`,
    includesSound: "Inclui equipa de som (200€)",
    travel:
      "Eventos fora de Lisboa: taxa de deslocação calculada via viamichelin.pt (combustível + portagens + estadia, se aplicável).",
    order: "Encomendar",
    customRequest: (name) =>
      `Pedido Wessex: ${name} — gostaria de receber um orçamento personalizado.`,
    orderMessage: (name, musicians, service, sound, total) =>
      `Encomenda Wessex:\n• Ensemble: ${name}${musicians}\n• Serviço: ${service}${sound ? "\n• + Equipa de som (200€)" : ""}\n• Total estimado: ${total}€\n\n`,
    ensembleNames: {
      solo: "Solo instrumental",
      duetos: "Duetos",
      trios: "Trios",
      quarteto: "Quarteto",
      "quarteto-voz": "Quarteto + voz",
      orquestra: "Orquestra",
      "orquestra-voz": "Orquestra & voz",
      som: "Equipa de som",
      "banda-jazz": "Banda de jazz",
      "banda-pop": "Banda pop",
      "banda-bossa": "Banda bossa",
      "ensemble-personalizado": "Ensemble personalizado",
      "musica-medida": "Música à medida",
    },
    ensembleDescriptions: {
      "ensemble-personalizado":
        "Combinação à medida de instrumentos e vozes para o seu evento. Orçamento sob consulta.",
      "musica-medida":
        "Composições e arranjos originais criados exclusivamente para o seu evento. Orçamento sob consulta.",
    },
    durationTwoHours: "2 horas",
  },
  chat: {
    welcome:
      "Olá! Sou o assistente da WEPAC. Posso ajudar-te com informações sobre os nossos projetos, orçamentos de serviços musicais, sugestões de repertório ou qualquer questão sobre a WEPAC. Como posso ajudar?",
    error:
      "Desculpa, ocorreu um erro. Tenta novamente ou contacta-nos através de info@wepac.pt.",
    consent:
      "Ao utilizar este chat, consentes o tratamento dos dados pessoais partilhados para fins de contacto comercial.",
    privacy: "Política de Privacidade",
    accept: "Concordo e quero continuar",
    placeholder: "Escreve aqui a tua questão...",
    blockedPlaceholder: "Aceita os termos acima para continuar",
    send: "Enviar",
    calculatorTab: "Simulador",
    assistantTab: "Assistente IA",
  },
};

const enUS: WessexCopy = {
  page: {
    metadataTitle: "Wessex | WEPAC — Live music for special events",
    metadataDescription:
      "Tailored live music for weddings, events and intimate celebrations. From string quartets to surprise serenades.",
    navAbout: "ABOUT US",
    navEvents: "EVENTS",
    navIdea: "OUR APPROACH",
    navTestimonials: "TESTIMONIALS",
    heroLead: "Music that turns a celebration into an",
    heroEmphasis: "unforgettable memory",
    heroBody:
      "Live music tailored to weddings, events and intimate celebrations. From a string quartet to a surprise serenade, we create experiences with elegance, emotion and impact.",
    calculate: "Calculate a quote",
    contact: "Talk to us",
    trust: [
      "Response within 24 hours",
      "No initial commitment",
      "Free personalised proposal",
    ],
    about: "About us",
    aboutLead: "More than live music.",
    aboutEmphasis: "An experience created for your moment.",
    aboutBody: [
      "Wessex grew from a simple conviction: music can elevate any moment and, when performed with intention, becomes a memory people keep forever. We are an ensemble of professional musicians specialising in special events. Every performance is tailored to your event, your venue and the emotion you want to create.",
      "We work with couples who want a moving ceremony, companies that want an impressive dinner and people planning a surprise nobody will forget. What do they all share? A desire for music to make a difference.",
    ],
    eventsLead: "A performance for every moment, tailored to each celebration.",
    eventCards: [
      {
        title: "Weddings",
        subtitle: "Your most important day deserves the most special music.",
        image: "/images/wessex/card-casamento.jpg",
        items: [
          "Ceremony: entrance, vows and recessional",
          "Cocktail: an elegant, engaging atmosphere",
          "Dinner and reception: a personalised repertoire",
          "Formats: solo, duo, trio or quartet",
          "With or without vocals",
          "A repertoire tailored entirely to the couple",
        ],
      },
      {
        title: "Cocktails & celebrations",
        subtitle:
          "For moments that do not need to be big — only unforgettable.",
        image: "/images/wessex/card-cocktail.jpg",
        items: [
          "Private dinners and at-home birthdays",
          "Proposals and surprise serenades",
          "Intimate celebrations and special moments",
          "Rooftops, gardens, restaurants and hotels",
          "Compact formats starting with a duo",
          "Complete planning for the surprise",
        ],
      },
      {
        title: "Corporate",
        subtitle:
          "The right music turns a corporate event into a prestigious occasion.",
        image: "/images/wessex/card-corporativo.jpg",
        items: [
          "Gala dinners and company events",
          "Product launches and VIP presentations",
          "Cocktails and corporate receptions",
          "Corporate venues, hotels and auditoriums",
          "A consistently elegant and professional tone",
          "Detailed proposals for HR and Marketing teams",
        ],
      },
    ],
    features: [
      {
        title: "Tailored music",
        text: "No two performances are the same. The repertoire, format and intensity are designed specifically for your event, venue and the emotion you want to create.",
      },
      {
        title: "Professional musicians",
        text: "Classical training, experience at premium events and the ability to adapt any musical genre — from classical to contemporary — with elegance and precision.",
      },
      {
        title: "Flexible formats",
        text: "Solo, duo, trio or quartet, with or without vocals. We adapt the ensemble to your budget, available space and the moment where music will make the greatest impact.",
      },
      {
        title: "Story and musical impact",
        text: "Our mission is not simply to play well; it is to make people feel. Every note has intention. The goal is always the same: to create a moment everyone will want to relive.",
      },
    ],
    testimonials: "Testimonials",
    testimonialItems: [
      {
        name: "Giovanna Fraga",
        quote:
          "The music at our wedding was incredible. Wessex performed with such emotion and sensitivity that it made the moment even more special. Our guests were delighted, and the day was unforgettable. Thank you!",
      },
      {
        name: "Pedro Azevedo",
        quote:
          "The music at our wedding was deeply moving. Every note added something special and made the moment even more unforgettable. The sensitivity and talent made all the difference.",
      },
      {
        name: "Dinamene Silva",
        quote:
          "What a magical moment. The music made our proposal even more special and emotional. Every note conveyed love and made the moment unforgettable.",
      },
      {
        name: "Chef Eunice Silveira",
        quote:
          "The saxophonist's talent brought elegance and energy to my client's eighteenth-birthday celebration. The music created an incredible atmosphere and delighted everyone.",
      },
    ],
    nextLead: "Your event could be next",
    nextBody: "Complete the form so we can prepare a personalised proposal.",
    benefits: [
      "Free repertoire consultation",
      "A video recording of the moment",
      "Priority date booking",
    ],
    copyright: "© 2026. All rights reserved.",
    privacy: "Terms and Privacy",
  },
  calculator: {
    ensemble: "Ensemble",
    selectEnsemble: "Select an ensemble",
    classical: "Classical ensembles",
    bands: "Bands",
    onRequest: "Price on request",
    musicians: (count) => `${count} musicians`,
    serviceType: "Service type",
    selectService: "Select a service type",
    serviceLabels: {
      cerimonias: "Ceremonies / Events (1 hour)",
      cocktails: "Cocktails / Reception (1 hour)",
      experiencia_completa: "Complete experience",
    },
    bandCocktail: "Cocktails / Reception (2 hours)",
    bandNote:
      "Bands are available only for a two-hour cocktail or reception format.",
    addSound: "Add a sound team (+€200)",
    quoteOnRequest: "Price on request",
    requestQuote: "Request a quote",
    estimated: "Estimated price",
    performancePrice: (duration) => `Price for a ${duration} performance`,
    includesSound: "Includes sound team (€200)",
    travel:
      "Events outside Lisbon: travel costs are calculated via viamichelin.pt (fuel, tolls and accommodation where applicable).",
    order: "Book",
    customRequest: (name) =>
      `Wessex enquiry: ${name} — I would like a personalised quote.`,
    orderMessage: (name, musicians, service, sound, total) =>
      `Wessex booking:\n• Ensemble: ${name}${musicians}\n• Service: ${service}${sound ? "\n• + Sound team (€200)" : ""}\n• Estimated total: €${total}\n\n`,
    ensembleNames: {
      solo: "Instrumental solo",
      duetos: "Duos",
      trios: "Trios",
      quarteto: "Quartet",
      "quarteto-voz": "Quartet + vocals",
      orquestra: "Orchestra",
      "orquestra-voz": "Orchestra & vocals",
      som: "Sound team",
      "banda-jazz": "Jazz band",
      "banda-pop": "Pop band",
      "banda-bossa": "Bossa band",
      "ensemble-personalizado": "Custom ensemble",
      "musica-medida": "Bespoke music",
    },
    ensembleDescriptions: {
      "ensemble-personalizado":
        "A tailored combination of instruments and voices for your event. Price on request.",
      "musica-medida":
        "Original compositions and arrangements created exclusively for your event. Price on request.",
    },
    durationTwoHours: "2 hours",
  },
  chat: {
    welcome:
      "Hello! I am WEPAC's assistant. I can help with information about our projects, music-service quotes, repertoire ideas or any question about WEPAC. How can I help?",
    error:
      "Sorry, something went wrong. Please try again or contact us at info@wepac.pt.",
    consent:
      "By using this chat, you consent to the processing of personal data you share for commercial contact purposes.",
    privacy: "Privacy Policy",
    accept: "I agree and want to continue",
    placeholder: "Type your question here...",
    blockedPlaceholder: "Accept the terms above to continue",
    send: "Send",
    calculatorTab: "Calculator",
    assistantTab: "AI assistant",
  },
};

const dictionaries: Record<AppLocale, WessexCopy> = {
  "pt-PT": ptPT,
  "en-US": enUS,
};

export function getWessexCopy(locale: string): WessexCopy {
  return dictionaries[locale === "en-US" ? "en-US" : "pt-PT"];
}
