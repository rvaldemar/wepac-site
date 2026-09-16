import type { AppLocale } from "@/i18n/routing";

type ArtistCopy = {
  metadataTitle: string;
  metadataDescription: string;
  watermark: string;
  heroLines: string[];
  heroSubtitle: string;
  seeHow: string;
  apply: string;
  definitionEyebrow: string;
  definitionTitle: string;
  definitionBody: string;
  definitionQuote: string;
  platformEyebrow: string;
  platformTitle: string;
  platformLead: string;
  platformFeatures: Array<{ title: string; desc: string }>;
  methodEyebrow: string;
  methodTitle: string;
  layer: (number: number) => string;
  pillarsSubtitle: string;
  pillars: Array<{ name: string; desc: string }>;
  principlesTitle: string;
  principlesSubtitle: string;
  principles: string[];
  valuesTitle: string;
  valuesSubtitle: string;
  values: string[];
  concepts: Array<{ title: string; type: string; desc: string }>;
  practiceEyebrow: string;
  practiceTitle: string;
  practiceCards: Array<{ title: string; items: string[]; note: string }>;
  teamEyebrow: string;
  teamTitle: string;
  teamBody: string;
  teamProfiles: string[];
  journeyEyebrow: string;
  journeyTitle: string;
  stageLabel: (number: number) => string;
  stages: Array<{ name: string; desc: string }>;
  fitTitle: string;
  isForYou: string;
  fitPositive: string[];
  isNotForYou: string;
  fitNegative: string[];
  applicationEyebrow: string;
  applicationTitle: string;
  applicationBody: string;
  footerTagline: string;
};

const ptPT: ArtistCopy = {
  metadataTitle: "WEPAC for Artists",
  metadataDescription:
    "WEPAC for Artists aplica o caminho WEPAC à Discipline Arts: desenvolvimento humano integral, prática artística e relações reais.",
  watermark: "ARTISTAS",
  heroLines: ["Excelência artística.", "Estrutura humana.", "Impacto real."],
  heroSubtitle:
    "A Discipline Arts dentro do caminho de desenvolvimento da WEPAC.",
  seeHow: "Ver como funciona",
  apply: "Candidatar-me",
  definitionEyebrow: "Arts · Discipline",
  definitionTitle: "O que é WEPAC for Artists",
  definitionBody:
    "É a expressão da WEPAC para pessoas cuja prática é Arts. A Discipline dá contexto à prática artística, mas a My Journey continua a pertencer à Person — com Life Map, Trails, Goals, Actions e Sessions próprias.",
  definitionQuote:
    "Ajudamos artistas a tornarem-se artisticamente excelentes, humanamente estruturados e profissionalmente sustentáveis.",
  platformEyebrow: "Plataforma",
  platformTitle: "A tua plataforma de desenvolvimento",
  platformLead: "Tudo o que precisas, num único lugar.",
  platformFeatures: [
    {
      title: "My Journey",
      desc: "O teu percurso contínuo como Person, orientado pelo teu Stage e pelos Six Pillars.",
    },
    {
      title: "Life Map",
      desc: "Quem sou. Onde estou. Para onde vou. Porquê. O que me comprometo a fazer. Cinco reflexões que definem a tua direção.",
    },
    {
      title: "Trails and Goals",
      desc: "Transformações concretas e objetivos claros que ligam direção, prática e resultado.",
    },
    {
      title: "Actions",
      desc: "Próximos passos que pertencem à Person e podem ganhar contexto num Goal, Trail ou Session.",
    },
    {
      title: "Sessions",
      desc: "Encontros com participantes explícitos, formato derivado do grupo e registo do que ficou combinado.",
    },
    {
      title: "Mentorship",
      desc: "Uma relação direta e consentida entre Mentor e Mentee. Não é um contentor da tua Journey.",
    },
  ],
  methodEyebrow: "Método",
  methodTitle: "A nossa metodologia",
  layer: (number) => `Camada ${number}`,
  pillarsSubtitle: "Universais em toda a My Journey",
  pillars: [
    { name: "Physical", desc: "O corpo como base de presença, energia e prática" },
    {
      name: "Emotional",
      desc: "Vida emocional, expressão e capacidade de recuperação",
    },
    { name: "Character", desc: "Disciplina, ética e consistência" },
    { name: "Spiritual", desc: "Profundidade, propósito e sentido" },
    { name: "Intellectual", desc: "Pensamento, aprendizagem e visão" },
    { name: "Social", desc: "Relação, comunicação e comunidade" },
  ],
  principlesTitle: "Princípios",
  principlesSubtitle: "Como trabalhamos",
  principles: [
    "Verdade",
    "Liberdade com responsabilidade",
    "Estrutura",
    "Vínculo",
    "Presença",
    "Caráter",
  ],
  valuesTitle: "Valores",
  valuesSubtitle: "Para quê trabalhamos",
  values: [
    "Educação",
    "Acessibilidade",
    "Inspiração",
    "Comunidade",
    "Sofisticação",
    "Proximidade",
  ],
  concepts: [
    {
      title: "Arts",
      type: "Discipline",
      desc: "O contexto de prática desta experiência WEPAC.",
    },
    {
      title: "Pack",
      type: "Community",
      desc: "Um grupo de pessoas com pertença e relações reais — nunca um caminho de desenvolvimento.",
    },
    {
      title: "Academy",
      type: "Cycles",
      desc: "Experiências de aprendizagem com duração definida, início e fim.",
    },
    {
      title: "Mentorship",
      type: "Relationship",
      desc: "Uma relação consentida entre Mentor e Mentee, sem possuir a Journey.",
    },
  ],
  practiceEyebrow: "Na prática",
  practiceTitle: "Como o caminho ganha forma",
  practiceCards: [
    {
      title: "Desenvolvimento humano e artístico",
      items: [
        "Life Map pessoal",
        "Trails ligadas aos Six Pillars",
        "Goals que tornam a direção concreta",
        "Actions assumidas pela Person",
      ],
      note: "A Journey pertence sempre à Person.",
    },
    {
      title: "Mentorship e Sessions",
      items: [
        "Mentor e Mentee ligados por consentimento",
        "Sessions com participantes explícitos",
        "Preparação, notas e próximos passos",
      ],
      note: "Mentorship é uma Relationship, não um contentor.",
    },
    {
      title: "Arts como Discipline",
      items: [
        "Prática artística com intenção",
        "Desenvolvimento técnico e criativo",
        "Identidade, colaboração e contribuição",
      ],
      note: "Arts contextualiza a Journey; não cria outra hierarquia.",
    },
    {
      title: "Community e Cycles",
      items: [
        "Packs para pertença e relações",
        "Academy para experiências de aprendizagem",
        "Cycles com duração, início e fim definidos",
      ],
      note: "Comunidade e aprendizagem são contextos distintos.",
    },
  ],
  teamEyebrow: "Equipa",
  teamTitle: "Quem está por trás",
  teamBody:
    "WEPAC for Artists é sustentado por uma equipa multidisciplinar que acompanha o desenvolvimento da Person e da sua prática.",
  teamProfiles: [
    "Psicólogos",
    "Psiquiatras",
    "Pedagogos",
    "Professores",
    "Músicos profissionais",
    "Gestores de carreira",
    "Administradores",
    "Gestores de tráfego pago",
    "Gestores de redes sociais",
    "Produtores de conteúdo",
    "Técnicos de som e luz",
    "Edição de som",
    "Edição de vídeo e imagem",
  ],
  journeyEyebrow: "Percurso",
  journeyTitle: "Three Stages of My Journey",
  stageLabel: (number) => `Stage ${number}`,
  stages: [
    {
      name: "Easy Peasy",
      desc: "Explorar com segurança, ganhar consciência e criar bases sustentáveis.",
    },
    {
      name: "Step Up",
      desc: "Assumir responsabilidade, consolidar prática e transformar intenção em compromisso.",
    },
    {
      name: "YUP",
      desc: "Integrar identidade, autonomia e contribuição com impacto real nos outros.",
    },
  ],
  fitTitle: "Isto é para ti?",
  isForYou: "É para ti se:",
  fitPositive: [
    "Tens talento e queres estrutura para o sustentar",
    "Aceitas processo, exigência e verdade",
    "Queres construir uma carreira, não só fazer concertos",
    "Estás disponível para te desenvolver como pessoa, não só como performer",
  ],
  isNotForYou: "Não é para ti se:",
  fitNegative: [
    "Procuras visibilidade rápida sem trabalho",
    "Não aceitas feedback nem confronto construtivo",
    "Não tens disponibilidade para compromisso real",
    "Queres só um agente, não um sistema de desenvolvimento",
  ],
  applicationEyebrow: "Candidatura",
  applicationTitle: "Candidata-te ao WEPAC for Artists",
  applicationBody:
    "Preenche o formulário. A equipa analisa o teu perfil e entra em contacto.",
  footerTagline: "Cultura que transforma",
};

const enUS: ArtistCopy = {
  metadataTitle: "WEPAC for Artists",
  metadataDescription:
    "WEPAC for Artists brings the WEPAC path to the Arts Discipline: whole-person development, artistic practice and real relationships.",
  watermark: "ARTISTS",
  heroLines: ["Artistic excellence.", "Human foundations.", "Real impact."],
  heroSubtitle: "The Arts Discipline within WEPAC's development path.",
  seeHow: "See how it works",
  apply: "Apply",
  definitionEyebrow: "Arts · Discipline",
  definitionTitle: "What is WEPAC for Artists?",
  definitionBody:
    "It is WEPAC's expression for people whose practice is Arts. The Discipline provides context for artistic practice, while My Journey continues to belong to the Person — with their own Life Map, Trails, Goals, Actions and Sessions.",
  definitionQuote:
    "We help artists become artistically excellent, personally grounded and professionally sustainable.",
  platformEyebrow: "Platform",
  platformTitle: "Your development platform",
  platformLead: "Everything you need, in one place.",
  platformFeatures: [
    {
      title: "My Journey",
      desc: "Your continuous path as a Person, guided by your Stage and the Six Pillars.",
    },
    {
      title: "Life Map",
      desc: "Who am I? Where am I? Where am I going? Why? What will I commit to doing? Five reflections that define your direction.",
    },
    {
      title: "Trails and Goals",
      desc: "Concrete transformations and clear goals that connect direction, practice and outcomes.",
    },
    {
      title: "Actions",
      desc: "Next steps that belong to the Person and can gain context within a Goal, Trail or Session.",
    },
    {
      title: "Sessions",
      desc: "Meetings with explicit participants, a format shaped by the group and a record of what was agreed.",
    },
    {
      title: "Mentorship",
      desc: "A direct, consent-based relationship between Mentor and Mentee. It is not a container for your Journey.",
    },
  ],
  methodEyebrow: "Method",
  methodTitle: "Our methodology",
  layer: (number) => `Layer ${number}`,
  pillarsSubtitle: "Universal across My Journey",
  pillars: [
    { name: "Physical", desc: "The body as the foundation for presence, energy and practice" },
    { name: "Emotional", desc: "Emotional life, expression and resilience" },
    { name: "Character", desc: "Discipline, ethics and consistency" },
    { name: "Spiritual", desc: "Depth, purpose and meaning" },
    { name: "Intellectual", desc: "Thinking, learning and vision" },
    { name: "Social", desc: "Relationships, communication and community" },
  ],
  principlesTitle: "Principles",
  principlesSubtitle: "How we work",
  principles: [
    "Truth",
    "Freedom with responsibility",
    "Structure",
    "Connection",
    "Presence",
    "Character",
  ],
  valuesTitle: "Values",
  valuesSubtitle: "What we work towards",
  values: [
    "Education",
    "Accessibility",
    "Inspiration",
    "Community",
    "Sophistication",
    "Proximity",
  ],
  concepts: [
    {
      title: "Arts",
      type: "Discipline",
      desc: "The practice context for this WEPAC experience.",
    },
    {
      title: "Pack",
      type: "Community",
      desc: "A group of people with real belonging and relationships — never a development path.",
    },
    {
      title: "Academy",
      type: "Cycles",
      desc: "Learning experiences with a defined duration, beginning and end.",
    },
    {
      title: "Mentorship",
      type: "Relationship",
      desc: "A consent-based relationship between Mentor and Mentee that does not own the Journey.",
    },
  ],
  practiceEyebrow: "In practice",
  practiceTitle: "How the path takes shape",
  practiceCards: [
    {
      title: "Human and artistic development",
      items: [
        "A personal Life Map",
        "Trails connected to the Six Pillars",
        "Goals that make direction concrete",
        "Actions owned by the Person",
      ],
      note: "The Journey always belongs to the Person.",
    },
    {
      title: "Mentorship and Sessions",
      items: [
        "Mentor and Mentee connected by consent",
        "Sessions with explicit participants",
        "Preparation, notes and next steps",
      ],
      note: "Mentorship is a Relationship, not a container.",
    },
    {
      title: "Arts as a Discipline",
      items: [
        "Intentional artistic practice",
        "Technical and creative development",
        "Identity, collaboration and contribution",
      ],
      note: "Arts gives the Journey context; it does not create another hierarchy.",
    },
    {
      title: "Community and Cycles",
      items: [
        "Packs for belonging and relationships",
        "Academy for learning experiences",
        "Cycles with a defined duration, beginning and end",
      ],
      note: "Community and learning are distinct contexts.",
    },
  ],
  teamEyebrow: "Team",
  teamTitle: "Who is behind it",
  teamBody:
    "WEPAC for Artists is supported by a multidisciplinary team that accompanies the development of the Person and their practice.",
  teamProfiles: [
    "Psychologists",
    "Psychiatrists",
    "Education specialists",
    "Teachers",
    "Professional musicians",
    "Career managers",
    "Administrators",
    "Paid-media managers",
    "Social-media managers",
    "Content producers",
    "Sound and lighting technicians",
    "Sound editors",
    "Video and image editors",
  ],
  journeyEyebrow: "Journey",
  journeyTitle: "Three Stages of My Journey",
  stageLabel: (number) => `Stage ${number}`,
  stages: [
    {
      name: "Easy Peasy",
      desc: "Explore safely, build awareness and create sustainable foundations.",
    },
    {
      name: "Step Up",
      desc: "Take responsibility, consolidate practice and turn intention into commitment.",
    },
    {
      name: "YUP",
      desc: "Integrate identity, autonomy and contribution with real impact on others.",
    },
  ],
  fitTitle: "Is this for you?",
  isForYou: "It is for you if:",
  fitPositive: [
    "You have talent and want the structure to sustain it",
    "You accept process, high standards and truth",
    "You want to build a career, not only perform concerts",
    "You are willing to develop as a person, not only as a performer",
  ],
  isNotForYou: "It is not for you if:",
  fitNegative: [
    "You want quick visibility without the work",
    "You do not accept feedback or constructive challenge",
    "You are not available for a real commitment",
    "You only want an agent, not a development system",
  ],
  applicationEyebrow: "Application",
  applicationTitle: "Apply to WEPAC for Artists",
  applicationBody:
    "Complete the form. Our team will review your profile and get in touch.",
  footerTagline: "Culture that transforms",
};

const dictionaries: Record<AppLocale, ArtistCopy> = {
  "pt-PT": ptPT,
  "en-US": enUS,
};

export function getArtistCopy(locale: string): ArtistCopy {
  return dictionaries[locale === "en-US" ? "en-US" : "pt-PT"];
}
