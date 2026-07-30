import type { AppLocale } from "@/i18n/routing";

type Card = {
  title: string;
  description: string;
  subtitle?: string;
};

type ProjectCopy = {
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  highlights: string[];
};

type InstitutionalPagesCopy = {
  about: {
    metadataTitle: string;
    metadataDescription: string;
    eyebrow: string;
    heroLine1: string;
    heroLine2: string;
    introduction: string;
    mission: string;
    missionBody: string;
    vision: string;
    visionBody: string;
    values: string;
    valuesList: string[];
    methodology: string;
    howWeWork: string;
    methodologyBody: string;
    pillars: Card[];
    principles: Array<{ title: string; text: string }>;
  };
  methodology: {
    metadataTitle: string;
    metadataDescription: string;
    eyebrow: string;
    title: string;
    introduction: string;
    pillars: Card[];
    principlesTitle: string;
    principles: Array<{ title: string; text: string }>;
  };
  impact: {
    metadataTitle: string;
    metadataDescription: string;
    eyebrow: string;
    title: string;
    introduction: string;
    areasTitle: string;
    areas: Card[];
  };
  partnerships: {
    metadataTitle: string;
    metadataDescription: string;
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    introduction: string;
    collaboratorsTitle: string;
    collaborators: Card[];
    interested: string;
    ctaBody: string;
    cta: string;
  };
  services: {
    metadataTitle: string;
    metadataDescription: string;
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    introduction: string;
    services: Card[];
    genresTitle: string;
    genres: string[];
    calculatorLead: string;
    calculatorCta: string;
    contactCta: string;
  };
  programme: {
    metadataTitle: string;
    metadataDescription: string;
    eyebrow: string;
    title: string;
    empty: string;
  };
  projects: {
    metadataTitle: string;
    metadataDescription: string;
    eyebrow: string;
    title: string;
    introduction: string;
    learnMore: string;
    back: string;
    highlights: string;
    interested: string;
    contact: string;
    bySlug: Record<string, ProjectCopy>;
  };
  quote: {
    metadataTitle: string;
    metadataDescription: string;
    eyebrow: string;
    title: string;
    introduction: string;
  };
};

const ptPT: InstitutionalPagesCopy = {
  about: {
    metadataTitle: "A WEPAC",
    metadataDescription: "A WEPAC. Missão, visão, metodologia e impacto.",
    eyebrow: "A WEPAC",
    heroLine1: "Cultura que",
    heroLine2: "transforma.",
    introduction:
      "A WEPAC é uma estrutura cultural multidisciplinar portuguesa dedicada à criação de projetos artísticos, educativos e comunitários. Trabalhamos na intersecção entre arte, educação e impacto social, promovendo o acesso à cultura e valorizando o património histórico.",
    mission: "Missão",
    missionBody:
      "Unimos arte, formação e impacto social para valorizar o património e transformar vidas com propostas inovadoras, acessíveis e de impacto real.",
    vision: "Visão",
    visionBody:
      "Ser referência em inovação artística e educativa, mostrando como a cultura transforma realidades com proximidade e profissionalismo.",
    values: "Valores",
    valuesList: [
      "Educação",
      "Acessibilidade cultural",
      "Inspiração artística",
      "Comunidade",
      "Sofisticação artística",
      "Proximidade com o território",
    ],
    methodology: "Metodologia",
    howWeWork: "Como trabalhamos",
    methodologyBody:
      "A WEPAC desenvolve uma metodologia própria que cruza a prática artística com a educação e o impacto social.",
    pillars: [
      {
        title: "O Criador",
        subtitle: "Inovação artística",
        description:
          "Exploramos linguagens artísticas contemporâneas e criamos experiências que desafiam convenções.",
      },
      {
        title: "O Sábio",
        subtitle: "Visão estratégica",
        description:
          "Cada projeto é desenhado com rigor metodológico e pensamento crítico sobre o papel da cultura na sociedade.",
      },
      {
        title: "O Cuidador",
        subtitle: "Impacto social",
        description:
          "Trabalhamos com e para as comunidades, garantindo que a arte chega a quem mais precisa.",
      },
    ],
    principles: [
      {
        title: "Proximidade",
        text: "Escuta ativa do território. Cada projeto nasce da relação com a comunidade.",
      },
      {
        title: "Acessibilidade",
        text: "A cultura deve ser para todos. Formatos inclusivos que eliminam barreiras.",
      },
      {
        title: "Excelência",
        text: "Profissionalismo em cada detalhe. Padrões elevados de qualidade artística.",
      },
      {
        title: "Sustentabilidade",
        text: "Modelos que geram valor a longo prazo para as comunidades.",
      },
    ],
  },
  methodology: {
    metadataTitle: "Metodologia",
    metadataDescription: "A metodologia educativa e artística da WEPAC.",
    eyebrow: "Metodologia",
    title: "Como trabalhamos",
    introduction:
      "A WEPAC desenvolve uma metodologia própria que cruza a prática artística com a educação e o impacto social. Acreditamos que a cultura é um motor de transformação e que a formação artística deve ser acessível a todos.",
    pillars: [
      {
        title: "O Criador",
        subtitle: "Inovação artística",
        description:
          "Inovação, imaginação e construção de novos formatos culturais. Exploramos linguagens artísticas contemporâneas e criamos experiências que desafiam convenções.",
      },
      {
        title: "O Sábio",
        subtitle: "Visão estratégica",
        description:
          "Estrutura, sabedoria e visão estratégica de longo prazo. Cada projeto é desenhado com rigor metodológico e pensamento crítico sobre o papel da cultura na sociedade.",
      },
      {
        title: "O Cuidador",
        subtitle: "Impacto social",
        description:
          "Cuidado, empatia, inclusão e impacto social real. Trabalhamos com e para as comunidades, garantindo que a arte chega a quem mais precisa.",
      },
    ],
    principlesTitle: "Princípios",
    principles: [
      {
        title: "Proximidade",
        text: "Trabalhamos lado a lado com as comunidades, escolas e instituições. Cada projeto nasce de uma escuta ativa do território.",
      },
      {
        title: "Acessibilidade",
        text: "A cultura deve ser para todos. Desenhamos formatos inclusivos que eliminam barreiras de acesso à experiência artística.",
      },
      {
        title: "Excelência",
        text: "Profissionalismo em cada detalhe. Da produção à performance, mantemos padrões elevados de qualidade artística.",
      },
      {
        title: "Sustentabilidade",
        text: "Projetos com impacto duradouro. Apostamos em modelos que geram valor a longo prazo para as comunidades.",
      },
    ],
  },
  impact: {
    metadataTitle: "Impacto",
    metadataDescription: "O impacto social dos projetos WEPAC.",
    eyebrow: "Impacto",
    title: "Impacto que queremos criar",
    introduction:
      "Comprometemo-nos a medir e a reportar o impacto do nosso trabalho nas comunidades, à medida que os projetos crescem.",
    areasTitle: "Áreas de impacto",
    areas: [
      {
        title: "Educação",
        description:
          "Programas educativos que desenvolvem competências artísticas, sociais e emocionais em crianças e jovens.",
      },
      {
        title: "Património",
        description:
          "Valorização de espaços patrimoniais através da programação artística, dando nova vida a monumentos históricos.",
      },
      {
        title: "Comunidade",
        description:
          "Criação de laços comunitários através da arte, promovendo a coesão social e a participação cultural.",
      },
    ],
  },
  partnerships: {
    metadataTitle: "Parcerias",
    metadataDescription:
      "Informação para instituições e patrocinadores que queiram colaborar com a WEPAC.",
    eyebrow: "Parcerias",
    titleLine1: "Vamos criar",
    titleLine2: "juntos.",
    introduction:
      "Procuramos parceiros que acreditem no poder transformador da cultura e da educação.",
    collaboratorsTitle: "Com quem colaboramos",
    collaborators: [
      {
        title: "Instituições culturais",
        description:
          "Museus, teatros, fundações e centros culturais que queiram enriquecer a sua programação.",
      },
      {
        title: "Escolas e autarquias",
        description:
          "Programas educativos artísticos para escolas, agrupamentos e municípios.",
      },
      {
        title: "Empresas",
        description:
          "Patrocínio de projetos culturais com impacto social e visibilidade para a marca.",
      },
      {
        title: "Organizadores de eventos",
        description:
          "Parcerias para festivais, ciclos de concertos e programação cultural.",
      },
      {
        title: "Espaços patrimoniais",
        description:
          "Programação artística para valorizar e dinamizar espaços históricos.",
      },
      {
        title: "Investigação",
        description:
          "Colaboração com universidades em projetos de investigação artística e educativa.",
      },
    ],
    interested: "Interessado?",
    ctaBody:
      "Conte-nos sobre o seu projeto ou ideia. Teremos todo o gosto em explorar formas de colaboração.",
    cta: "Contacte-nos",
  },
  services: {
    metadataTitle: "Serviços",
    metadataDescription:
      "Oferta musical da WEPAC para eventos privados e institucionais.",
    eyebrow: "Serviços",
    titleLine1: "Música para os",
    titleLine2: "seus eventos",
    introduction:
      "Performances musicais de excelência com curadoria artística dedicada para qualquer ocasião.",
    services: [
      {
        title: "Eventos Corporativos",
        description:
          "Música ao vivo para eventos empresariais, conferências, jantares de gala e lançamentos de produto.",
      },
      {
        title: "Casamentos & Celebrações",
        description:
          "Cerimónias e festas com curadoria musical personalizada, do clássico ao contemporâneo.",
      },
      {
        title: "Eventos Institucionais",
        description:
          "Programação musical para câmaras municipais, museus, fundações e instituições culturais.",
      },
      {
        title: "Curadoria Artística",
        description:
          "Consultoria e curadoria para festivais, ciclos de concertos e programação cultural.",
      },
    ],
    genresTitle: "Géneros musicais",
    genres: [
      "Música Clássica",
      "Jazz",
      "Fado",
      "Música Contemporânea",
      "World Music",
      "Música Antiga",
      "Música de Câmara",
      "Pop/Rock Acústico",
    ],
    calculatorLead: "Simule o investimento para o seu evento.",
    calculatorCta: "Simular orçamento",
    contactCta: "Ou contacte-nos diretamente",
  },
  programme: {
    metadataTitle: "Programação",
    metadataDescription: "Agenda de eventos, concertos e atividades da WEPAC.",
    eyebrow: "Programação",
    title: "Agenda",
    empty: "Sem eventos publicados de momento. Volta em breve.",
  },
  projects: {
    metadataTitle: "Projetos",
    metadataDescription:
      "Os projetos da WEPAC: Easy Peasy, Arte à Capela e Wessex.",
    eyebrow: "Projetos",
    title: "O que fazemos",
    introduction:
      "Três projetos, uma missão: usar a arte como motor de transformação social.",
    learnMore: "Saber mais →",
    back: "← Projetos",
    highlights: "Destaques",
    interested: "Interessado neste projeto?",
    contact: "Entre em contacto",
    bySlug: {
      "easy-peasy": {
        name: "Easy Peasy",
        tagline: "Música e artes para os mais jovens",
        description:
          "Projeto educativo focado em música e artes para crianças e jovens em escolas e comunidades.",
        longDescription:
          "O Easy Peasy é o projeto educativo da WEPAC que leva a música e as artes performativas a escolas e comunidades. Através de workshops, residências artísticas e programas curriculares, criamos experiências que despertam a criatividade e promovem o desenvolvimento pessoal dos mais jovens. Acreditamos que a educação artística é um motor de transformação social.",
        highlights: [
          "Workshops em escolas",
          "Residências artísticas",
          "Programas curriculares",
          "Formação de professores",
        ],
      },
      "arte-a-capela": {
        name: "Arte à Capela",
        tagline: "Arte em espaços de património",
        description:
          "Programação artística em espaços patrimoniais e espirituais, valorizando o património histórico.",
        longDescription:
          "O Arte à Capela transforma espaços patrimoniais e espirituais em palcos de experiências artísticas únicas. Capelas, igrejas e monumentos históricos ganham nova vida através de concertos, instalações e performances que criam um diálogo entre o passado e o presente. Este projeto valoriza o património ao mesmo tempo que o torna acessível a novos públicos.",
        highlights: [
          "Concertos em capelas e igrejas",
          "Instalações artísticas",
          "Valorização do património",
          "Experiências imersivas",
        ],
      },
      wessex: {
        name: "Wessex",
        tagline: "Performances musicais de excelência",
        description:
          "Performances musicais para eventos privados e institucionais, com curadoria artística dedicada.",
        longDescription:
          "O Wessex é o braço de serviços musicais da WEPAC, oferecendo performances de excelência para eventos privados, corporativos e institucionais. Com uma rede de músicos profissionais e curadoria artística dedicada, criamos experiências sonoras únicas que elevam qualquer ocasião. Da música clássica ao jazz, do fado à música contemporânea.",
        highlights: [
          "Eventos corporativos",
          "Casamentos e celebrações",
          "Eventos institucionais",
          "Curadoria artística",
        ],
      },
    },
  },
  quote: {
    metadataTitle: "Orçamento | Serviços Wessex",
    metadataDescription:
      "Simulador de orçamento para serviços musicais Wessex da WEPAC.",
    eyebrow: "Serviços · Wessex",
    title: "Orçamento",
    introduction: "Simule o investimento ou fale com o nosso assistente.",
  },
};

const enUS: InstitutionalPagesCopy = {
  about: {
    metadataTitle: "About WEPAC",
    metadataDescription: "WEPAC's mission, vision, methodology and impact.",
    eyebrow: "WEPAC",
    heroLine1: "Culture that",
    heroLine2: "transforms.",
    introduction:
      "WEPAC is a Portuguese multidisciplinary cultural organisation dedicated to creating artistic, educational and community projects. We work where art, education and social impact meet, broadening access to culture and celebrating historical heritage.",
    mission: "Mission",
    missionBody:
      "We bring together art, education and social impact to celebrate heritage and transform lives through innovative, accessible work with real impact.",
    vision: "Vision",
    visionBody:
      "To be a reference in artistic and educational innovation, showing how culture transforms lives through proximity and professionalism.",
    values: "Values",
    valuesList: [
      "Education",
      "Cultural accessibility",
      "Artistic inspiration",
      "Community",
      "Artistic sophistication",
      "Connection to place",
    ],
    methodology: "Methodology",
    howWeWork: "How we work",
    methodologyBody:
      "WEPAC has developed its own methodology, bringing artistic practice together with education and social impact.",
    pillars: [
      {
        title: "The Creator",
        subtitle: "Artistic innovation",
        description:
          "We explore contemporary artistic languages and create experiences that challenge convention.",
      },
      {
        title: "The Sage",
        subtitle: "Strategic vision",
        description:
          "Every project combines methodological rigour with critical thinking about culture's role in society.",
      },
      {
        title: "The Caregiver",
        subtitle: "Social impact",
        description:
          "We work with and for communities, making sure art reaches those who need it most.",
      },
    ],
    principles: [
      {
        title: "Proximity",
        text: "We listen closely to each place. Every project grows from a relationship with its community.",
      },
      {
        title: "Accessibility",
        text: "Culture should be for everyone. Inclusive formats remove barriers.",
      },
      {
        title: "Excellence",
        text: "Professionalism in every detail, with high standards of artistic quality.",
      },
      {
        title: "Sustainability",
        text: "Models that create long-term value for communities.",
      },
    ],
  },
  methodology: {
    metadataTitle: "Methodology",
    metadataDescription: "WEPAC's educational and artistic methodology.",
    eyebrow: "Methodology",
    title: "How we work",
    introduction:
      "WEPAC has developed its own methodology, bringing artistic practice together with education and social impact. We believe culture can drive transformation and that arts education should be accessible to everyone.",
    pillars: [
      {
        title: "The Creator",
        subtitle: "Artistic innovation",
        description:
          "Innovation, imagination and new cultural formats. We explore contemporary artistic languages and create experiences that challenge convention.",
      },
      {
        title: "The Sage",
        subtitle: "Strategic vision",
        description:
          "Structure, wisdom and long-term strategic vision. Every project combines methodological rigour with critical thinking about culture's role in society.",
      },
      {
        title: "The Caregiver",
        subtitle: "Social impact",
        description:
          "Care, empathy, inclusion and real social impact. We work with and for communities, making sure art reaches those who need it most.",
      },
    ],
    principlesTitle: "Principles",
    principles: [
      {
        title: "Proximity",
        text: "We work side by side with communities, schools and institutions. Every project begins by listening closely to its place.",
      },
      {
        title: "Accessibility",
        text: "Culture should be for everyone. We design inclusive formats that remove barriers to artistic experiences.",
      },
      {
        title: "Excellence",
        text: "Professionalism in every detail. From production to performance, we uphold high standards of artistic quality.",
      },
      {
        title: "Sustainability",
        text: "Projects with lasting impact. We build models that create long-term value for communities.",
      },
    ],
  },
  impact: {
    metadataTitle: "Impact",
    metadataDescription: "The social impact of WEPAC projects.",
    eyebrow: "Impact",
    title: "The impact we want to create",
    introduction:
      "We are committed to measuring and reporting the impact of our work in communities as our projects grow.",
    areasTitle: "Areas of impact",
    areas: [
      {
        title: "Education",
        description:
          "Education programmes that develop artistic, social and emotional skills in children and young people.",
      },
      {
        title: "Heritage",
        description:
          "Bringing heritage sites to life through artistic programming and giving historic monuments new purpose.",
      },
      {
        title: "Community",
        description:
          "Building community ties through art, strengthening social cohesion and participation in culture.",
      },
    ],
  },
  partnerships: {
    metadataTitle: "Partnerships",
    metadataDescription:
      "Information for institutions and sponsors interested in working with WEPAC.",
    eyebrow: "Partnerships",
    titleLine1: "Let's create",
    titleLine2: "together.",
    introduction:
      "We are looking for partners who believe in the transformative power of culture and education.",
    collaboratorsTitle: "Who we work with",
    collaborators: [
      {
        title: "Cultural institutions",
        description:
          "Museums, theatres, foundations and cultural centres seeking to enrich their programmes.",
      },
      {
        title: "Schools and local authorities",
        description:
          "Arts education programmes for schools, school groups and municipalities.",
      },
      {
        title: "Businesses",
        description:
          "Sponsorship of cultural projects with social impact and meaningful brand visibility.",
      },
      {
        title: "Event organisers",
        description:
          "Partnerships for festivals, concert series and cultural programmes.",
      },
      {
        title: "Heritage venues",
        description:
          "Artistic programming that celebrates and activates historic spaces.",
      },
      {
        title: "Research",
        description:
          "Collaboration with universities on artistic and educational research projects.",
      },
    ],
    interested: "Interested?",
    ctaBody:
      "Tell us about your project or idea. We would love to explore ways of working together.",
    cta: "Contact us",
  },
  services: {
    metadataTitle: "Services",
    metadataDescription:
      "WEPAC's music offering for private and institutional events.",
    eyebrow: "Services",
    titleLine1: "Music for",
    titleLine2: "your events",
    introduction:
      "Exceptional musical performances with dedicated artistic curation for every occasion.",
    services: [
      {
        title: "Corporate events",
        description:
          "Live music for corporate events, conferences, gala dinners and product launches.",
      },
      {
        title: "Weddings & celebrations",
        description:
          "Ceremonies and celebrations with tailored musical curation, from classical to contemporary.",
      },
      {
        title: "Institutional events",
        description:
          "Music programmes for municipalities, museums, foundations and cultural institutions.",
      },
      {
        title: "Artistic curation",
        description:
          "Consulting and curation for festivals, concert series and cultural programmes.",
      },
    ],
    genresTitle: "Musical genres",
    genres: [
      "Classical Music",
      "Jazz",
      "Fado",
      "Contemporary Music",
      "World Music",
      "Early Music",
      "Chamber Music",
      "Acoustic Pop/Rock",
    ],
    calculatorLead: "Estimate the investment for your event.",
    calculatorCta: "Calculate a quote",
    contactCta: "Or contact us directly",
  },
  programme: {
    metadataTitle: "Programme",
    metadataDescription: "WEPAC's calendar of events, concerts and activities.",
    eyebrow: "Programme",
    title: "Calendar",
    empty: "There are no published events right now. Check back soon.",
  },
  projects: {
    metadataTitle: "Projects",
    metadataDescription:
      "WEPAC projects: Easy Peasy, Arte à Capela and Wessex.",
    eyebrow: "Projects",
    title: "What we do",
    introduction:
      "Three projects, one mission: using art as a force for social transformation.",
    learnMore: "Learn more →",
    back: "← Projects",
    highlights: "Highlights",
    interested: "Interested in this project?",
    contact: "Get in touch",
    bySlug: {
      "easy-peasy": {
        name: "Easy Peasy",
        tagline: "Music and arts for younger generations",
        description:
          "An education project focused on music and the arts for children and young people in schools and communities.",
        longDescription:
          "Easy Peasy is WEPAC's education project, bringing music and the performing arts into schools and communities. Through workshops, artist residencies and curriculum programmes, we create experiences that spark creativity and support young people's personal development. We believe arts education can drive social transformation.",
        highlights: [
          "School workshops",
          "Artist residencies",
          "Curriculum programmes",
          "Teacher training",
        ],
      },
      "arte-a-capela": {
        name: "Arte à Capela",
        tagline: "Art in heritage spaces",
        description:
          "Artistic programming in heritage and spiritual spaces, celebrating historic places.",
        longDescription:
          "Arte à Capela turns heritage and spiritual spaces into stages for distinctive artistic experiences. Chapels, churches and historic monuments come alive through concerts, installations and performances that create a dialogue between past and present. The project celebrates heritage while opening it to new audiences.",
        highlights: [
          "Concerts in chapels and churches",
          "Art installations",
          "Celebrating heritage",
          "Immersive experiences",
        ],
      },
      wessex: {
        name: "Wessex",
        tagline: "Exceptional musical performances",
        description:
          "Musical performances for private and institutional events, with dedicated artistic curation.",
        longDescription:
          "Wessex is WEPAC's music services arm, offering exceptional performances for private, corporate and institutional events. With a network of professional musicians and dedicated artistic curation, we create distinctive sound experiences that elevate every occasion — from classical music and jazz to fado and contemporary music.",
        highlights: [
          "Corporate events",
          "Weddings and celebrations",
          "Institutional events",
          "Artistic curation",
        ],
      },
    },
  },
  quote: {
    metadataTitle: "Quote | Wessex Services",
    metadataDescription:
      "Quote calculator for WEPAC's Wessex music services.",
    eyebrow: "Services · Wessex",
    title: "Quote",
    introduction: "Estimate the investment or talk to our assistant.",
  },
};

const dictionaries: Record<AppLocale, InstitutionalPagesCopy> = {
  "pt-PT": ptPT,
  "en-US": enUS,
};

export function getInstitutionalPagesCopy(
  locale: string,
): InstitutionalPagesCopy {
  return dictionaries[locale === "en-US" ? "en-US" : "pt-PT"];
}
