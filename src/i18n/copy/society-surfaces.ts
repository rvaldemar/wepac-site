import type { AppLocale } from "@/i18n/routing";

interface MetadataCopy {
  title: string;
  description: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
}

interface LabeledLine {
  title: string;
  line: string;
}

interface StageCopy {
  years: string;
  name: string;
  mode: string;
  line: string;
}

export interface AcademySurfaceCopy {
  metadata: MetadataCopy;
  stages: StageCopy[];
  curriculum: Array<[string, string]>;
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
  person: {
    eyebrow: string;
    titleLines: string[];
    lead: string;
    body: string;
  };
  stagesSection: { eyebrow: string; title: string };
  curriculumSection: {
    eyebrow: string;
    title: string;
    body: string;
    itemPrefix: string;
  };
  firstDoor: {
    eyebrow: string;
    title: string;
    lead: string;
    body: string;
    cta: string;
    imageAlt: string;
  };
  closing: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
}

export const academySurfaceCopy = {
  "pt-PT": {
    metadata: {
      title: "WEPAC Academy — do zero ao infinito e mais além",
      description:
        "Educação para uma vida inteira: Easy Peasy, Step Up e YUP, com a família por perto e a pessoa inteira sempre à vista.",
      openGraphTitle: "WEPAC Academy — do zero ao infinito e mais além",
      openGraphDescription:
        "Educação que cresce com cada pessoa e cada família, da descoberta ao legado.",
    },
    stages: [
      {
        years: "0—11",
        name: "Easy Peasy",
        mode: "Discovery",
        line: "Primeiros trilhos: corpo, ritmo, curiosidade, arte e uma família que aprende a ser o primeiro ambiente.",
      },
      {
        years: "12—21",
        name: "Step Up",
        mode: "Build",
        line: "Projetos reais, comunidade exigente e liberdade que cresce com responsabilidade demonstrada.",
      },
      {
        years: "22—∞",
        name: "YUP",
        mode: "Transform",
        line: "Your Unlocked Potential: autonomia adulta, obra, maestria, serviço e legado.",
      },
    ],
    curriculum: [
      ["Físico", "Corpo, energia, ritmo e hábitos como base de presença."],
      ["Emocional", "Nomear, regular, reparar e comunicar com verdade."],
      ["Carácter", "Hábitos, integridade e capacidade de terminar."],
      [
        "Espiritual",
        "Interioridade, sentido e reverência sem imposição de crença.",
      ],
      [
        "Intelectual",
        "Atenção, linguagem, curiosidade e qualidade de pensamento.",
      ],
      ["Social", "Convivência, conflito reparado, colaboração e serviço."],
    ],
    hero: {
      eyebrow: "WEPAC Society · Via educativa",
      title: "Do zero ao infinito — e mais além.",
      body: "Um caminho educativo que cresce com cada pessoa. Easy Peasy, Step Up e YUP adaptam a linguagem, as experiências e a responsabilidade a cada idade, mantendo sempre a pessoa inteira à vista.",
      primaryCta: "Começar o meu Life Plan",
      secondaryCta: "Conhecer os stages",
    },
    person: {
      eyebrow: "A pessoa antes do programa",
      titleLines: ["Uma vida.", "Seis pilares.", "Muitas práticas."],
      lead: "A música é uma disciplina. A pessoa é física, emocional, de carácter, espiritual, intelectual e social.",
      body: "O currículo não separa desenvolvimento humano de aprendizagem académica ou prática. Cada stage muda a linguagem, o grau de autonomia e a forma de prestar contas — sem reduzir ninguém a notas, talento ou performance.",
    },
    stagesSection: {
      eyebrow: "Três stages",
      title: "Discovery. Build. Transform.",
    },
    curriculumSection: {
      eyebrow: "Currículo integral",
      title: "Se não é observável, não é avaliável.",
      body: "Os pilares não são etiquetas. São ângulos de leitura do momento, vistos na prática e revistos em ciclos: ponto de partida, foco, ação, obra, feedback e movimento.",
      itemPrefix: "Pilar",
    },
    firstDoor: {
      eyebrow: "A primeira porta",
      title: "Easy Peasy",
      lead: "Grandes apresentações começam com pequenas aulas — e com um ambiente que deixa descobrir sem abandonar.",
      body: "Música e artes performativas para crianças, famílias, escolas e comunidades. A família participa no caminho: linguagem comum, rituais simples e prática que continua em casa.",
      cta: "Conhecer Easy Peasy",
      imageAlt: "Criança a tocar violino numa peça Easy Peasy",
    },
    closing: {
      eyebrow: "O primeiro passo",
      title: "Começa em casa. O Life Plan dá direção.",
      body: "O Life Plan ajuda-nos a compreender a pessoa, a família e o momento de vida antes de escolher um percurso. Nem todas as portas estão abertas na mesma fase: respondemos com verdade sobre o que já existe e o que ainda está a ganhar capacidade.",
      primaryCta: "Começar o meu Life Plan",
      secondaryCta: "Conhecer o caminho das famílias",
    },
  },
  "en-US": {
    metadata: {
      title: "WEPAC Academy — from zero to infinity and beyond",
      description:
        "Education for a lifetime: Easy Peasy, Step Up, and YUP, with family nearby and the whole person always in view.",
      openGraphTitle: "WEPAC Academy — from zero to infinity and beyond",
      openGraphDescription:
        "Education that grows with each person and family, from discovery to legacy.",
    },
    stages: [
      {
        years: "0—11",
        name: "Easy Peasy",
        mode: "Discovery",
        line: "First trails through body, rhythm, curiosity, art, and a family learning to be the first environment.",
      },
      {
        years: "12—21",
        name: "Step Up",
        mode: "Build",
        line: "Real projects, a demanding community, and freedom that grows with demonstrated responsibility.",
      },
      {
        years: "22—∞",
        name: "YUP",
        mode: "Transform",
        line: "Your Unlocked Potential: adult autonomy, work, mastery, service, and legacy.",
      },
    ],
    curriculum: [
      [
        "Physical",
        "Body, energy, rhythm, and habits as the foundation for presence.",
      ],
      ["Emotional", "Name, regulate, repair, and communicate truthfully."],
      ["Character", "Habits, integrity, and the ability to finish."],
      [
        "Spiritual",
        "Inner life, meaning, and reverence without imposing belief.",
      ],
      [
        "Intellectual",
        "Attention, language, curiosity, and quality of thought.",
      ],
      [
        "Social",
        "Living together, repaired conflict, collaboration, and service.",
      ],
    ],
    hero: {
      eyebrow: "WEPAC Society · Educational path",
      title: "From zero to infinity — and beyond.",
      body: "An educational journey that grows with each person. Easy Peasy, Step Up, and YUP adapt language, experiences, and responsibility to each age while keeping the whole person in view.",
      primaryCta: "Start my Life Plan",
      secondaryCta: "Explore the stages",
    },
    person: {
      eyebrow: "The person before the program",
      titleLines: ["One life.", "Six pillars.", "Many practices."],
      lead: "Music is a Discipline. A person is physical, emotional, of character, spiritual, intellectual, and social.",
      body: "The curriculum does not separate human development from academic learning or practice. Each Stage changes the language, degree of autonomy, and form of accountability without reducing anyone to grades, talent, or performance.",
    },
    stagesSection: {
      eyebrow: "Three stages",
      title: "Discovery. Build. Transform.",
    },
    curriculumSection: {
      eyebrow: "Whole-person curriculum",
      title: "If it cannot be observed, it cannot be assessed.",
      body: "The pillars are not labels. They are ways of reading the current moment, seen in practice and reviewed in cycles: starting point, focus, Action, work, feedback, and movement.",
      itemPrefix: "Pillar",
    },
    firstDoor: {
      eyebrow: "The first door",
      title: "Easy Peasy",
      lead: "Great performances begin with small lessons and an environment that makes room for discovery without leaving anyone behind.",
      body: "Music and performing arts for children, families, schools, and communities. The family takes part in the journey through shared language, simple rituals, and practice that continues at home.",
      cta: "Explore Easy Peasy",
      imageAlt: "Child playing violin in an Easy Peasy performance",
    },
    closing: {
      eyebrow: "The first step",
      title: "It starts at home. The Life Plan provides direction.",
      body: "The Life Plan helps us understand the person, family, and life moment before choosing a path. Not every door is open at the same stage: we answer honestly about what already exists and what is still building capacity.",
      primaryCta: "Start my Life Plan",
      secondaryCta: "Explore the path for families",
    },
  },
} satisfies Record<AppLocale, AcademySurfaceCopy>;

export interface ArtsCompanySurfaceCopy {
  metadata: MetadataCopy;
  hero: { eyebrow: string; title: string; body: string };
  company: {
    eyebrow: string;
    titleLines: string[];
    lead: string;
    body: string;
  };
  chooseDoor: string;
  wessex: { eyebrow: string; body: string; cta: string; imageAlt: string };
  arteACapela: { eyebrow: string; body: string; cta: string; imageAlt: string };
  circulation: {
    eyebrow: string;
    title: string;
    body: string;
    cards: Array<{ name: string; line: string; href: string }>;
    open: string;
  };
  closing: {
    eyebrow: string;
    title: string;
    primaryCta: string;
    secondaryCta: string;
  };
}

export const artsCompanySurfaceCopy = {
  "pt-PT": {
    metadata: {
      title: "WEPAC Companhia de Artes — obra com presença",
      description:
        "A casa de criação, produção e programação artística da WEPAC: Wessex e Arte à Capela, cada uma com a sua porta.",
    },
    hero: {
      eyebrow: "WEPAC Society · Cultura em prática",
      title: "Não é só arte. Existe método.",
      body: "Criação, produção e programação com a mesma régua: excelência no que se faz, estrutura humana por baixo e impacto real à saída.",
    },
    company: {
      eyebrow: "A Companhia",
      titleLines: ["Duas marcas.", "Duas portas.", "Uma casa."],
      lead: "Wessex leva música de excelência a momentos que importam. Arte à Capela devolve presença e vida a espaços de património.",
      body: "Cada marca mantém identidade, linguagem e landing próprias — ligadas pela WEPAC e pela exigência de obra acabada.",
    },
    chooseDoor: "Escolhe a porta",
    wessex: {
      eyebrow: "Música ao vivo · Curadoria · Produção",
      body: "Música com presença para casamentos, eventos privados, empresas e instituições.",
      cta: "Entrar na Wessex",
      imageAlt: "Violinista Wessex em atuação",
    },
    arteACapela: {
      eyebrow: "Património · Concertos · Experiências",
      body: "Concertos intimistas e experiências imersivas em capelas, igrejas e lugares de memória.",
      cta: "Entrar na Arte à Capela",
      imageAlt: "Interior de uma igreja histórica — Arte à Capela",
    },
    circulation: {
      eyebrow: "Obra em circulação",
      title: "Ver. Ouvir. Estar lá.",
      body: "A cultura vive na agenda, na bilheteira, no palco, no espaço e na memória de quem esteve presente.",
      cards: [
        {
          name: "Agenda",
          line: "Programação WEPAC e próximos encontros.",
          href: "/programacao",
        },
        {
          name: "Bilheteira",
          line: "Eventos publicados e bilhetes disponíveis.",
          href: "/bilheteira",
        },
        {
          name: "Criar connosco",
          line: "Parcerias, espaços, programação e produção.",
          href: "/contacto",
        },
      ],
      open: "Abrir",
    },
    closing: {
      eyebrow: "Cultura como prática",
      title: "Uma obra ganha valor quando encontra a realidade.",
      primaryCta: "Ver programação",
      secondaryCta: "Falar com a WEPAC",
    },
  },
  "en-US": {
    metadata: {
      title: "WEPAC Arts Company — work with presence",
      description:
        "WEPAC's home for artistic creation, production, and programming: Wessex and Arte à Capela, each with its own door.",
    },
    hero: {
      eyebrow: "WEPAC Society · Culture in practice",
      title: "It is not just art. There is a method.",
      body: "Creation, production, and programming held to the same standard: excellence in the work, human structure underneath, and real impact beyond it.",
    },
    company: {
      eyebrow: "The Arts Company",
      titleLines: ["Two brands.", "Two doors.", "One home."],
      lead: "Wessex brings excellent music to moments that matter. Arte à Capela brings presence and life back to heritage spaces.",
      body: "Each brand keeps its own identity, language, and landing page, connected by WEPAC and a shared commitment to finished work.",
    },
    chooseDoor: "Choose a door",
    wessex: {
      eyebrow: "Live music · Curation · Production",
      body: "Music with presence for weddings, private events, companies, and institutions.",
      cta: "Enter Wessex",
      imageAlt: "Wessex violinist performing",
    },
    arteACapela: {
      eyebrow: "Heritage · Concerts · Experiences",
      body: "Intimate concerts and immersive experiences in chapels, churches, and places of memory.",
      cta: "Enter Arte à Capela",
      imageAlt: "Interior of a historic church — Arte à Capela",
    },
    circulation: {
      eyebrow: "Work in circulation",
      title: "See it. Hear it. Be there.",
      body: "Culture lives in the calendar, box office, stage, space, and memory of those who were there.",
      cards: [
        {
          name: "Calendar",
          line: "WEPAC programming and upcoming gatherings.",
          href: "/programacao",
        },
        {
          name: "Box office",
          line: "Published events and available tickets.",
          href: "/bilheteira",
        },
        {
          name: "Create with us",
          line: "Partnerships, venues, programming, and production.",
          href: "/contacto",
        },
      ],
      open: "Open",
    },
    closing: {
      eyebrow: "Culture as practice",
      title: "Work gains value when it meets reality.",
      primaryCta: "View the program",
      secondaryCta: "Talk to WEPAC",
    },
  },
} satisfies Record<AppLocale, ArtsCompanySurfaceCopy>;

export interface LifePlanSurfaceCopy {
  metadata: MetadataCopy;
  path: Array<{ number: string; name: string; line: string }>;
  situations: LabeledLine[];
  outcomes: string[];
  hero: {
    eyebrow: string;
    titleLines: string[];
    body: string;
    cta: string;
  };
  entry: {
    eyebrow: string;
    title: string;
    lead: string;
    body: string;
  };
  movement: { eyebrow: string; title: string };
  relevance: {
    eyebrow: string;
    title: string;
    body: string;
    itemPrefix: string;
  };
  outcomesSection: { eyebrow: string; title: string; body: string };
  privacy: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  limits: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  continuity: {
    eyebrow: string;
    title: string;
    body: string;
  };
  closing: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
}

export const lifePlanSurfaceCopy = {
  "pt-PT": {
    metadata: {
      title: "Life Plan — Projeto de Plano de Vida | WEPAC Society",
      description:
        "O Life Plan ajuda pessoas e famílias a transformar contexto e reflexão em prioridades, objetivos, um ciclo de ação e um próximo passo.",
      openGraphTitle: "Life Plan — Projeto de Plano de Vida | WEPAC Society",
      openGraphDescription:
        "Perceber onde estás, escolher para onde vais e definir o que fazes a seguir.",
    },
    path: [
      {
        number: "01",
        name: "Life Map",
        line: "O mapa pessoal: quem sou, onde estou, para onde quero ir, porquê e que compromissos assumo.",
      },
      {
        number: "02",
        name: "Mapa de desenvolvimento",
        line: "Ler as seis áreas da vida e reconhecer o que pede atenção.",
      },
      {
        number: "03",
        name: "Foco de ciclo",
        line: "Escolher o que merece trabalho agora, sem tentar resolver tudo.",
      },
      {
        number: "04",
        name: "Projeto ou artefacto",
        line: "Dar forma concreta ao compromisso através de obra reconhecível.",
      },
      {
        number: "05",
        name: "Feedback",
        line: "Recolher evidência, escuta e aprendizagem enquanto o trabalho acontece.",
      },
      {
        number: "06",
        name: "Revisão",
        line: "Comparar intenção, ação e resultado para decidir o que muda.",
      },
      {
        number: "07",
        name: "Life Map revisto",
        line: "Atualizar o mapa e abrir o ciclo seguinte com melhor direção.",
      },
    ],
    situations: [
      {
        title: "Uma decisão importante",
        line: "Quando existem vários caminhos possíveis, mas ainda falta uma direção suficientemente clara.",
      },
      {
        title: "Uma transição",
        line: "Mudanças educativas, profissionais, familiares ou pessoais que pedem novas prioridades.",
      },
      {
        title: "Muito movimento, pouco avanço",
        line: "Quando a agenda está cheia, mas o essencial continua sem espaço, sequência ou compromisso.",
      },
      {
        title: "Um caminho em família",
        line: "Quando é preciso construir linguagem comum sem transformar pessoas diferentes num plano único.",
      },
    ],
    outcomes: [
      "Um ponto de partida descrito com honestidade e contexto.",
      "Um Life Map criado ou atualizado pela própria pessoa.",
      "Prioridades e objetivos para o momento atual.",
      "Um ciclo de ação com compromissos proporcionais.",
      "Um próximo passo concreto e uma base para o rever.",
    ],
    hero: {
      eyebrow: "WEPAC Society · Life Plan",
      titleLines: ["Onde estás.", "Para onde vais.", "O que fazes a seguir."],
      body: "O Life Plan — Projeto de Plano de Vida — transforma reflexão em direção, prioridades e próximos passos que cabem na vida real.",
      cta: "Começar o meu Life Plan",
    },
    entry: {
      eyebrow: "O produto de entrada",
      title: "Um plano para viver. Não um formulário para arquivar.",
      lead: "O Life Plan é o processo que liga o teu ponto de partida às escolhas e Actions do próximo ciclo.",
      body: "O Life Map é uma parte central desse processo: o mapa pessoal, vivo e atualizável. O Life Map orienta; o Life Plan organiza o que fazer agora e como voltar a olhar para o caminho.",
    },
    movement: {
      eyebrow: "Da leitura ao movimento",
      title: "O mapa abre a vista. O plano põe o caminho em movimento.",
    },
    relevance: {
      eyebrow: "Quando faz sentido",
      title: "Não precisas de estar perdido para precisar de direção.",
      body: "O Life Plan pode ser individual ou familiar. O ponto de partida é sempre a situação concreta — não uma versão idealizada da pessoa ou da família.",
      itemPrefix: "Situação",
    },
    outcomesSection: {
      eyebrow: "O que fica contigo",
      title: "Clareza suficiente para dar o próximo passo.",
      body: "A forma concreta de entrega é confirmada antes de começar. O Life Plan deixa estes resultados essenciais, sem prometer uma transformação automática.",
    },
    privacy: {
      eyebrow: "A pessoa é dona do mapa",
      title: "Privado por princípio.",
      paragraphs: [
        "O Life Map pertence à pessoa. Família, mentor, facilitador, Pack ou equipa não recebem acesso automático ao seu conteúdo.",
        "Num Life Plan familiar, cada pessoa mantém o seu espaço. Só se torna comum o que for escolhido para ser partilhado como prioridade, compromisso ou Action da família.",
      ],
    },
    limits: {
      eyebrow: "Limites claros",
      title: "Direção não é decisão por ti.",
      paragraphs: [
        "O Life Plan organiza reflexão e Action; não avalia o valor de uma pessoa, não garante resultados e não transfere a responsabilidade pelas escolhas.",
        "Não substitui acompanhamento médico, psicológico, jurídico ou financeiro quando essas competências são necessárias.",
      ],
    },
    continuity: {
      eyebrow: "Depois do Life Plan",
      title: "O plano dá direção. A continuidade mantém o caminho vivo.",
      body: "A continuidade pode acontecer através das subscrições e formas de acompanhamento disponíveis. Benefícios, condições, periodicidade e limites de capacidade são apresentados com clareza antes de qualquer adesão.",
    },
    closing: {
      eyebrow: "O teu ponto de partida",
      title: "Não precisas do caminho inteiro. Precisas do próximo passo.",
      body: "Conta-nos onde estás e o que gostarias de construir. A equipa responde sobre o enquadramento possível para começar.",
      primaryCta: "Começar o meu Life Plan",
      secondaryCta: "Ver Life Plan para famílias",
    },
  },
  "en-US": {
    metadata: {
      title: "Life Plan — Life Planning Project | WEPAC Society",
      description:
        "The Life Plan helps people and families turn context and reflection into priorities, goals, an Action cycle, and a next step.",
      openGraphTitle: "Life Plan — Life Planning Project | WEPAC Society",
      openGraphDescription:
        "Understand where you are, choose where you are going, and define what you do next.",
    },
    path: [
      {
        number: "01",
        name: "Life Map",
        line: "The personal map: who I am, where I am, where I want to go, why, and what I commit to.",
      },
      {
        number: "02",
        name: "Development Map",
        line: "Read the six areas of life and recognize what needs attention.",
      },
      {
        number: "03",
        name: "Cycle focus",
        line: "Choose what deserves work now without trying to solve everything.",
      },
      {
        number: "04",
        name: "Project or artifact",
        line: "Give the commitment a concrete form through recognizable work.",
      },
      {
        number: "05",
        name: "Feedback",
        line: "Gather evidence, listening, and learning while the work happens.",
      },
      {
        number: "06",
        name: "Review",
        line: "Compare intention, action, and result to decide what changes.",
      },
      {
        number: "07",
        name: "Revised Life Map",
        line: "Update the map and open the next cycle with better direction.",
      },
    ],
    situations: [
      {
        title: "An important decision",
        line: "When several paths are possible but there is not yet enough direction to choose.",
      },
      {
        title: "A transition",
        line: "Educational, professional, family, or personal changes that require new priorities.",
      },
      {
        title: "A lot of motion, little progress",
        line: "When the calendar is full but what matters still lacks space, sequence, or commitment.",
      },
      {
        title: "A path as a family",
        line: "When a family needs shared language without turning different people into one plan.",
      },
    ],
    outcomes: [
      "A starting point described with honesty and context.",
      "A Life Map created or updated by the person.",
      "Priorities and goals for the current moment.",
      "An Action cycle with proportionate commitments.",
      "A concrete next step and a basis for reviewing it.",
    ],
    hero: {
      eyebrow: "WEPAC Society · Life Plan",
      titleLines: [
        "Where are you?",
        "Where are you going?",
        "What do you do next?",
      ],
      body: "The Life Plan turns reflection into direction, priorities, and next steps that fit real life.",
      cta: "Start my Life Plan",
    },
    entry: {
      eyebrow: "The entry product",
      title: "A plan to live. Not a form to file away.",
      lead: "The Life Plan connects your starting point to the choices and Actions in your next cycle.",
      body: "The Life Map is central to that process: a personal, living, updateable map. The Life Map provides direction; the Life Plan organizes what to do now and when to look at the path again.",
    },
    movement: {
      eyebrow: "From insight to movement",
      title: "The map opens the view. The plan puts the journey in motion.",
    },
    relevance: {
      eyebrow: "When it makes sense",
      title: "You do not need to be lost to need direction.",
      body: "The Life Plan can be individual or family-based. The starting point is always the real situation, not an idealized version of a person or family.",
      itemPrefix: "Situation",
    },
    outcomesSection: {
      eyebrow: "What stays with you",
      title: "Enough clarity to take the next step.",
      body: "The exact delivery format is confirmed before you begin. The Life Plan leaves these essential outcomes without promising automatic transformation.",
    },
    privacy: {
      eyebrow: "The person owns the map",
      title: "Private by principle.",
      paragraphs: [
        "The Life Map belongs to the person. Family, Mentor, facilitator, Pack, or team do not receive automatic access to its contents.",
        "In a family Life Plan, each person keeps their own space. Only what they choose to share becomes a family priority, commitment, or Action.",
      ],
    },
    limits: {
      eyebrow: "Clear boundaries",
      title: "Direction does not mean deciding for you.",
      paragraphs: [
        "The Life Plan organizes reflection and Action. It does not assess a person's worth, guarantee outcomes, or transfer responsibility for their choices.",
        "It does not replace medical, psychological, legal, or financial support when those skills are needed.",
      ],
    },
    continuity: {
      eyebrow: "After the Life Plan",
      title: "The plan provides direction. Continuity keeps the journey alive.",
      body: "Continuity can happen through the available subscriptions and forms of support. Benefits, terms, frequency, and capacity limits are explained clearly before you join.",
    },
    closing: {
      eyebrow: "Your starting point",
      title: "You do not need the whole path. You need the next step.",
      body: "Tell us where you are and what you would like to build. The team will explain the available starting point.",
      primaryCta: "Start my Life Plan",
      secondaryCta: "View Life Plan for families",
    },
  },
} satisfies Record<AppLocale, LifePlanSurfaceCopy>;

export interface FamilySurfaceCopy {
  metadata: MetadataCopy;
  familyMoments: LabeledLine[];
  stages: StageCopy[];
  process: Array<{ number: string; title: string; line: string }>;
  signal: {
    person: string;
    individual: string;
    shared: string;
    journey: string;
    family: string;
    values: string[];
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
  firstTeam: {
    eyebrow: string;
    title: string;
    lead: string;
    body: string;
  };
  moments: { eyebrow: string; title: string };
  scales: {
    eyebrow: string;
    title: string;
    body: string;
    personEyebrow: string;
    personTitle: string;
    personItems: string[];
    familyEyebrow: string;
    familyTitle: string;
    familyItems: string[];
  };
  ages: { eyebrow: string; title: string; body: string; cta: string };
  processSection: { eyebrow: string; title: string; body: string };
  privacy: { eyebrow: string; title: string; items: string[] };
  closing: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
}

export const familySurfaceCopy = {
  "pt-PT": {
    metadata: {
      title: "Life Plan para famílias | WEPAC Society",
      description:
        "Um Life Plan para ajudar cada pessoa e a família a construir linguagem comum, prioridades e próximos passos sem apagar a individualidade.",
      openGraphTitle: "O caminho começa em casa | WEPAC Society",
      openGraphDescription:
        "Um Life Plan para pessoas diferentes construírem direção e compromissos comuns.",
    },
    familyMoments: [
      {
        title: "Falamos muito. Decidimos pouco.",
        line: "As mesmas conversas voltam, mas falta uma forma comum de escolher prioridades e assumir compromissos.",
      },
      {
        title: "Cada pessoa vive numa agenda.",
        line: "A logística funciona, mas o tempo partilhado, os rituais e o que importa à família ficam para depois.",
      },
      {
        title: "Uma transição está a mexer com todos.",
        line: "Adolescência, escola, universidade, trabalho, mudança de casa ou carreira alteram mais do que uma rotina.",
      },
      {
        title: "Queremos ajudar sem controlar.",
        line: "Pais e filhos precisam de equilibrar cuidado, autonomia, responsabilidade e espaço para escolher.",
      },
      {
        title: "Temos objetivos, mas não direção comum.",
        line: "Cada pessoa sabe o que quer fazer; ainda falta perceber o que a família quer proteger e construir junta.",
      },
      {
        title: "É tempo de voltar a alinhar.",
        line: "Não é preciso esperar por uma crise para rever o momento, reparar tensões e escolher o próximo passo.",
      },
    ],
    stages: [
      {
        years: "0—11",
        name: "Easy Peasy",
        mode: "Discovery",
        line: "A família é o primeiro ambiente: presença, ritmo, curiosidade, limites e descoberta acompanhada.",
      },
      {
        years: "12—21",
        name: "Step Up",
        mode: "Build",
        line: "Identidade, escolhas educativas e autonomia crescente, com responsabilidade e conversas que não fogem ao essencial.",
      },
      {
        years: "22—∞",
        name: "YUP",
        mode: "Transform",
        line: "Your Unlocked Potential: vida adulta, relações, carreira, cuidado entre gerações e mudanças que continuam a pedir direção.",
      },
    ],
    process: [
      {
        number: "01",
        title: "Contar onde estão",
        line: "A família partilha o momento, as perguntas e o que gostaria de construir.",
      },
      {
        number: "02",
        title: "Definir quem participa",
        line: "Antes de começar, clarificamos quem participa, o que é comum e o que permanece individual.",
      },
      {
        number: "03",
        title: "Escolher o que é comum",
        line: "A família identifica prioridades e compromissos que precisam mesmo de ser partilhados.",
      },
      {
        number: "04",
        title: "Definir o próximo ciclo",
        line: "Os objetivos ganham Actions proporcionais, responsáveis claros e um próximo passo.",
      },
      {
        number: "05",
        title: "Rever sem dramatizar",
        line: "O que aconteceu volta a ser visto para aprender, ajustar e escolher o movimento seguinte.",
      },
    ],
    signal: {
      person: "Pessoa",
      individual: "Individual",
      shared: "Comum",
      journey: "Caminho",
      family: "Família",
      values: ["Cuidado", "Autonomia", "Compromisso"],
    },
    hero: {
      eyebrow: "WEPAC Society · Famílias",
      title: "O caminho começa em casa.",
      body: "Um Life Plan para ajudar cada pessoa e a família a encontrar linguagem comum, prioridades e próximos passos — sem apagar a individualidade de ninguém.",
      primaryCta: "Começar o Life Plan da família",
      secondaryCta: "Ver como funciona",
    },
    firstTeam: {
      eyebrow: "A primeira equipa",
      title: "Uma família não é uma pessoa em tamanho grande.",
      lead: "É um sistema de pessoas inteiras: ligadas, diferentes e responsáveis pelo modo como vivem juntas.",
      body: "O Life Plan familiar não procura uniformizar vontades nem entregar aos pais o mapa dos filhos. Ajuda a distinguir o que pertence a cada pessoa do que precisa de conversa, decisão e compromisso partilhado.",
    },
    moments: {
      eyebrow: "Situações que reconhecemos",
      title: "A vida familiar raramente avisa antes de mudar.",
    },
    scales: {
      eyebrow: "Duas escalas",
      title: "O que é meu. O que é nosso.",
      body: "Um Life Plan familiar saudável não confunde proximidade com acesso total. Torna visível a relação entre autonomia individual e responsabilidade partilhada.",
      personEyebrow: "Cada pessoa",
      personTitle: "Identidade e direção próprias.",
      personItems: [
        "O seu Life Map e a sua voz.",
        "Prioridades e objetivos pessoais.",
        "Escolhas adequadas à idade e à autonomia.",
        "Privacidade que não depende do papel na família.",
      ],
      familyEyebrow: "A família",
      familyTitle: "Linguagem e compromissos comuns.",
      familyItems: [
        "Prioridades que precisam de cooperação.",
        "Rituais, decisões e acordos explícitos.",
        "Responsáveis e próximos passos visíveis.",
        "Uma forma de rever sem procurar culpados.",
      ],
    },
    ages: {
      eyebrow: "Do zero ao infinito — e mais além",
      title: "A família muda. O caminho educativo muda com ela.",
      body: "Cada Stage calibra a linguagem, a autonomia e o papel da família. Nenhuma idade transforma uma pessoa num projeto de outra.",
      cta: "Conhecer a WEPAC Academy",
    },
    processSection: {
      eyebrow: "Como funciona",
      title: "Da conversa ao próximo ciclo.",
      body: "O enquadramento concreto é confirmado antes de começar. O processo adapta-se à composição e ao momento da família, preservando estes princípios.",
    },
    privacy: {
      eyebrow: "Privacidade e cuidado",
      title: "Estar em família não elimina fronteiras.",
      items: [
        "Partimos do princípio de que o Life Map pertence à pessoa e não é automaticamente visível aos restantes familiares.",
        "A participação de menores só avança depois de confirmados responsáveis, consentimentos e forma de participação.",
        "O que é partilhado com a família é acordado antes de começar, respeitando a idade e as responsabilidades legais.",
        "Pais e responsáveis não recebem por defeito acesso total ao Backpack de outra pessoa.",
        "Compromissos comuns ficam separados de notas, objetivos e reflexões individuais.",
        "O Life Plan não substitui apoio médico, psicológico, jurídico ou financeiro quando necessário.",
      ],
    },
    closing: {
      eyebrow: "O primeiro passo pode ser comum",
      title:
        "Cada pessoa tem o seu mapa. A família pode escolher o caminho que faz junta.",
      body: "Conta-nos em que momento estão e o que gostariam de construir. A equipa responde sobre o enquadramento possível para começar.",
      primaryCta: "Começar o Life Plan da família",
      secondaryCta: "Conhecer o Life Plan",
    },
  },
  "en-US": {
    metadata: {
      title: "Life Plan for families | WEPAC Society",
      description:
        "A Life Plan that helps each person and the family build shared language, priorities, and next steps without erasing individuality.",
      openGraphTitle: "The journey starts at home | WEPAC Society",
      openGraphDescription:
        "A Life Plan for different people to build shared direction and commitments.",
    },
    familyMoments: [
      {
        title: "We talk a lot. We decide very little.",
        line: "The same conversations return, but there is no shared way to choose priorities and make commitments.",
      },
      {
        title: "Each person lives in a different calendar.",
        line: "The logistics work, but shared time, rituals, and what matters to the family keep being postponed.",
      },
      {
        title: "A transition is affecting everyone.",
        line: "Adolescence, school, college, work, a move, or a career change alter more than a routine.",
      },
      {
        title: "We want to help without controlling.",
        line: "Parents and children need to balance care, autonomy, responsibility, and room to choose.",
      },
      {
        title: "We have goals, but no shared direction.",
        line: "Each person knows what they want to do; the family still needs to choose what it wants to protect and build together.",
      },
      {
        title: "It is time to realign.",
        line: "A family does not need to wait for a crisis to review the moment, repair tension, and choose the next step.",
      },
    ],
    stages: [
      {
        years: "0—11",
        name: "Easy Peasy",
        mode: "Discovery",
        line: "The family is the first environment: presence, rhythm, curiosity, boundaries, and supported discovery.",
      },
      {
        years: "12—21",
        name: "Step Up",
        mode: "Build",
        line: "Identity, educational choices, and growing autonomy, with responsibility and conversations that face what matters.",
      },
      {
        years: "22—∞",
        name: "YUP",
        mode: "Transform",
        line: "Your Unlocked Potential: adult life, relationships, career, intergenerational care, and changes that continue to require direction.",
      },
    ],
    process: [
      {
        number: "01",
        title: "Tell us where you are",
        line: "The family shares its current moment, questions, and what it would like to build.",
      },
      {
        number: "02",
        title: "Define who takes part",
        line: "Before starting, we clarify who participates, what is shared, and what remains individual.",
      },
      {
        number: "03",
        title: "Choose what is shared",
        line: "The family identifies priorities and commitments that genuinely need to be shared.",
      },
      {
        number: "04",
        title: "Define the next cycle",
        line: "Goals gain proportionate Actions, clear owners, and a next step.",
      },
      {
        number: "05",
        title: "Review without drama",
        line: "The family looks at what happened to learn, adjust, and choose the next movement.",
      },
    ],
    signal: {
      person: "Person",
      individual: "Individual",
      shared: "Shared",
      journey: "Journey",
      family: "Family",
      values: ["Care", "Autonomy", "Commitment"],
    },
    hero: {
      eyebrow: "WEPAC Society · Families",
      title: "The journey starts at home.",
      body: "A Life Plan that helps each person and the family find shared language, priorities, and next steps without erasing anyone's individuality.",
      primaryCta: "Start the family's Life Plan",
      secondaryCta: "See how it works",
    },
    firstTeam: {
      eyebrow: "The first team",
      title: "A family is not one person made larger.",
      lead: "It is a system of whole people: connected, different, and responsible for how they live together.",
      body: "A family Life Plan does not make everyone's wishes the same or hand children's maps to their parents. It helps distinguish what belongs to each person from what needs shared conversation, decision, and commitment.",
    },
    moments: {
      eyebrow: "Situations we recognize",
      title: "Family life rarely warns you before it changes.",
    },
    scales: {
      eyebrow: "Two scales",
      title: "What is mine. What is ours.",
      body: "A healthy family Life Plan does not confuse closeness with total access. It makes visible the relationship between individual autonomy and shared responsibility.",
      personEyebrow: "Each person",
      personTitle: "Their own identity and direction.",
      personItems: [
        "Their Life Map and their voice.",
        "Personal priorities and goals.",
        "Choices appropriate to age and autonomy.",
        "Privacy that does not depend on a family role.",
      ],
      familyEyebrow: "The family",
      familyTitle: "Shared language and commitments.",
      familyItems: [
        "Priorities that require cooperation.",
        "Rituals, decisions, and explicit agreements.",
        "Clear owners and visible next steps.",
        "A way to review without looking for someone to blame.",
      ],
    },
    ages: {
      eyebrow: "From zero to infinity — and beyond",
      title: "The family changes. The educational journey changes with it.",
      body: "Each Stage calibrates language, autonomy, and the family's role. No age makes one person someone else's project.",
      cta: "Explore WEPAC Academy",
    },
    processSection: {
      eyebrow: "How it works",
      title: "From the conversation to the next cycle.",
      body: "The exact format is confirmed before starting. The process adapts to the family's composition and current moment while preserving these principles.",
    },
    privacy: {
      eyebrow: "Privacy and care",
      title: "Being a family does not erase boundaries.",
      items: [
        "The Life Map belongs to the person and is not automatically visible to other family members.",
        "A minor participates only after the responsible adults, consent, and participation format are confirmed.",
        "What is shared with the family is agreed before starting, with respect for age and legal responsibilities.",
        "Parents and guardians do not receive default access to another person's Backpack.",
        "Shared commitments remain separate from individual notes, goals, and reflections.",
        "The Life Plan does not replace medical, psychological, legal, or financial support when needed.",
      ],
    },
    closing: {
      eyebrow: "The first step can be shared",
      title:
        "Each person has their own map. The family can choose the path it walks together.",
      body: "Tell us about your current moment and what you would like to build. The team will explain the available starting point.",
      primaryCta: "Start the family's Life Plan",
      secondaryCta: "Explore the Life Plan",
    },
  },
} satisfies Record<AppLocale, FamilySurfaceCopy>;

export type GenericIntakeSource =
  | "society"
  | "life-plan"
  | "familias"
  | "academy"
  | "upgraded-backpack"
  | "organizations";

export interface IntakePageSurfaceCopy {
  metadata: MetadataCopy;
  signIn: string;
  defaultEyebrow: string;
  title: string;
  subtitle: string;
  defaultIntro: string;
  directionLine: string;
  reassurance: string;
  contexts: Partial<
    Record<GenericIntakeSource, { eyebrow: string; intro: string }>
  >;
}

export const intakePageSurfaceCopy = {
  "pt-PT": {
    metadata: {
      title: "Life Plan — WEPACKER",
      description:
        "Encontra o teu ponto de partida. O Life Plan ajuda-te a perceber onde estás, para onde queres ir e qual é o próximo passo.",
    },
    signIn: "Entrar",
    defaultEyebrow: "Life Plan · Ponto de partida",
    title: "Onde estás. Para onde vais. O que fazes a seguir.",
    subtitle: "Tudo começa no Life Plan.",
    defaultIntro:
      "Conta-nos em que momento estás e o que gostarias de construir.",
    directionLine:
      "Ajudamos-te a encontrar direção e a transformar essa direção num próximo passo.",
    reassurance:
      "Este é um primeiro contacto; não precisas de ter as respostas todas. A equipa entra em contacto para encontrar contigo o ponto de partida.",
    contexts: {
      familias: {
        eyebrow: "Life Plan · Famílias",
        intro:
          "Conta-nos em que momento está a tua família e o que gostariam de construir em conjunto.",
      },
      academy: {
        eyebrow: "Life Plan · Academy",
        intro:
          "Conta-nos em que momento estás e o que queres desenvolver através da educação.",
      },
      "upgraded-backpack": {
        eyebrow: "Life Plan · Continuidade",
        intro:
          "A continuidade começa por perceber o teu ponto de partida. Conta-nos onde estás e o que procuras acompanhar.",
      },
      organizations: {
        eyebrow: "Life Plan · Organizações e RH",
        intro:
          "Conta-nos sobre a organização, as pessoas que gostariam de envolver e a cadência de acompanhamento que procuram.",
      },
    },
  },
  "en-US": {
    metadata: {
      title: "Life Plan — WEPACKER",
      description:
        "Find your starting point. The Life Plan helps you understand where you are, where you want to go, and what to do next.",
    },
    signIn: "Sign in",
    defaultEyebrow: "Life Plan · Starting point",
    title: "Where are you? Where are you going? What do you do next?",
    subtitle: "It all starts with the Life Plan.",
    defaultIntro:
      "Tell us about your current moment and what you would like to build.",
    directionLine:
      "We help you find direction and turn that direction into a next step.",
    reassurance:
      "This is a first conversation; you do not need to have every answer. The team will contact you to find the right starting point together.",
    contexts: {
      familias: {
        eyebrow: "Life Plan · Families",
        intro:
          "Tell us about your family's current moment and what you would like to build together.",
      },
      academy: {
        eyebrow: "Life Plan · Academy",
        intro:
          "Tell us about your current moment and what you want to develop through education.",
      },
      "upgraded-backpack": {
        eyebrow: "Life Plan · Continuity",
        intro:
          "Continuity begins by understanding your starting point. Tell us where you are and what kind of follow-up you are looking for.",
      },
      organizations: {
        eyebrow: "Life Plan · Organizations and HR",
        intro:
          "Tell us about the organization, the people you would like to involve, and the follow-up cadence you are looking for.",
      },
    },
  },
} satisfies Record<AppLocale, IntakePageSurfaceCopy>;

export interface IntakeFormSurfaceCopy {
  entrantTypeLabels: Record<string, string>;
  focusLabels: Record<string, string>;
  validation: {
    nameRequired: string;
    emailRequired: string;
    emailInvalid: string;
    entrantTypeRequired: string;
    focusRequired: string;
    currentMomentRequired: string;
    motivationRequired: string;
  };
  serialized: {
    entrantType: string;
    focus: string;
    currentMoment: string;
    source: string;
    motivation: string;
  };
  successTitle: string;
  successBody: string;
  submitError: string;
  fields: {
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    entrantType: string;
    focus: string;
    choose: string;
    currentMoment: string;
    currentMomentPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    practiceArea: string;
    practiceAreaPlaceholder: string;
    socialLinks: string;
    socialLinksPlaceholder: string;
    motivation: string;
    motivationPlaceholder: string;
  };
  artisticFieldsVisible: string;
  artisticFieldsHidden: string;
  privacyPrefix: string;
  privacyLink: string;
  privacySuffix: string;
  loading: string;
  submit: string;
}

export const intakeFormSurfaceCopy = {
  "pt-PT": {
    entrantTypeLabels: {
      person: "Pessoa",
      family: "Família",
      organization: "Organização",
      artist: "Artista",
    },
    focusLabels: {
      education: "Educação",
      relationships: "Relações / família",
      career: "Carreira",
      "personal-project": "Projeto pessoal",
      "organization-community": "Organização / comunidade",
      "artistic-practice": "Prática artística",
      continuity: "Continuidade / subscrição",
      other: "Outro",
    },
    validation: {
      nameRequired: "O nome é obrigatório.",
      emailRequired: "O email é obrigatório.",
      emailInvalid: "Introduz um email válido.",
      entrantTypeRequired: "Escolhe como estás a entrar.",
      focusRequired: "Escolhe o que queres trabalhar ou construir.",
      currentMomentRequired: "Conta-nos em que momento te encontras.",
      motivationRequired:
        "Conta-nos onde estás e o que gostarias de construir.",
    },
    serialized: {
      entrantType: "Entro como",
      focus: "Quero trabalhar ou construir",
      currentMoment: "Momento atual",
      source: "Origem",
      motivation: "Onde estou e o que gostaria de construir",
    },
    successTitle: "Ponto de partida recebido",
    successBody:
      "Vamos entrar em contacto para encontrar contigo o próximo passo.",
    submitError: "Não foi possível enviar o ponto de partida. Tenta novamente.",
    fields: {
      name: "Nome",
      namePlaceholder: "Ex.: Maria Silva",
      email: "Email",
      emailPlaceholder: "Ex.: maria@exemplo.com",
      entrantType: "Entro como",
      focus: "O que quero trabalhar ou construir?",
      choose: "Escolhe uma opção",
      currentMoment: "Em que momento me encontro?",
      currentMomentPlaceholder: "Ex.: estou a tomar uma decisão importante",
      phone: "Telefone",
      phonePlaceholder: "Ex.: 912 345 678",
      practiceArea: "Área de prática",
      practiceAreaPlaceholder: "Ex.: teatro, música, artes visuais",
      socialLinks: "Portefólio / redes sociais",
      socialLinksPlaceholder: "Ex.: https://instagram.com/maria",
      motivation: "Onde estás e o que gostarias de construir?",
      motivationPlaceholder:
        "Conta-nos o que está a acontecer e o que gostarias que fosse diferente.",
    },
    artisticFieldsVisible: "Campos opcionais de prática artística disponíveis.",
    artisticFieldsHidden: "Campos de prática artística ocultos.",
    privacyPrefix:
      "Os dados que preenches aqui são usados apenas para compreender o teu ponto de partida e entrar em contacto contigo. Consulta a",
    privacyLink: "política de privacidade",
    privacySuffix: ".",
    loading: "A enviar...",
    submit: "Dar o primeiro passo",
  },
  "en-US": {
    entrantTypeLabels: {
      person: "Person",
      family: "Family",
      organization: "Organization",
      artist: "Artist",
    },
    focusLabels: {
      education: "Education",
      relationships: "Relationships / family",
      career: "Career",
      "personal-project": "Personal project",
      "organization-community": "Organization / community",
      "artistic-practice": "Artistic practice",
      continuity: "Continuity / subscription",
      other: "Other",
    },
    validation: {
      nameRequired: "Name is required.",
      emailRequired: "Email is required.",
      emailInvalid: "Enter a valid email address.",
      entrantTypeRequired: "Choose how you are starting.",
      focusRequired: "Choose what you want to work on or build.",
      currentMomentRequired: "Tell us about your current moment.",
      motivationRequired:
        "Tell us where you are and what you would like to build.",
    },
    serialized: {
      entrantType: "Starting as",
      focus: "What I want to work on or build",
      currentMoment: "Current moment",
      source: "Source",
      motivation: "Where I am and what I would like to build",
    },
    successTitle: "Starting point received",
    successBody: "We will contact you to find the next step together.",
    submitError: "We could not send your starting point. Please try again.",
    fields: {
      name: "Name",
      namePlaceholder: "e.g. Maria Silva",
      email: "Email",
      emailPlaceholder: "e.g. maria@example.com",
      entrantType: "I am starting as",
      focus: "What do I want to work on or build?",
      choose: "Choose an option",
      currentMoment: "What moment am I in?",
      currentMomentPlaceholder: "e.g. I am making an important decision",
      phone: "Phone",
      phonePlaceholder: "e.g. +1 555 123 4567",
      practiceArea: "Practice area",
      practiceAreaPlaceholder: "e.g. theater, music, visual arts",
      socialLinks: "Portfolio / social media",
      socialLinksPlaceholder: "e.g. https://instagram.com/maria",
      motivation: "Where are you and what would you like to build?",
      motivationPlaceholder:
        "Tell us what is happening and what you would like to be different.",
    },
    artisticFieldsVisible: "Optional artistic practice fields are available.",
    artisticFieldsHidden: "Artistic practice fields are hidden.",
    privacyPrefix:
      "We use the information you provide only to understand your starting point and contact you. Read our",
    privacyLink: "privacy policy",
    privacySuffix: ".",
    loading: "Sending...",
    submit: "Take the first step",
  },
} satisfies Record<AppLocale, IntakeFormSurfaceCopy>;
