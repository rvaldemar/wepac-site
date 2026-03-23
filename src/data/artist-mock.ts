import type {
  User,
  Evaluation,
  EvaluationScore,
  StrategicMapScore,
  LifePlan,
  StrategicPlan,
  Task,
  Session,
  Conversation,
  AreaKey,
  AREA_KEYS,
} from "@/lib/types/artist";

// ===== USERS =====

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Ana Martins",
    email: "ana@example.com",
    role: "artist",
    onboarded: true,
    level: "seed",
    bio: "Violinista e compositora. Formada no Conservatório de Braga.",
    currentPhase: "development",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-03-20T00:00:00Z",
  },
  {
    id: "u2",
    name: "Pedro Silva",
    email: "pedro@example.com",
    role: "artist",
    onboarded: true,
    level: "seed",
    bio: "Pianista e professor de música.",
    currentPhase: "structuring",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-03-18T00:00:00Z",
  },
  {
    id: "u3",
    name: "Maria Costa",
    email: "maria@example.com",
    role: "artist",
    onboarded: true,
    level: "growth",
    bio: "Cantora lírica e performer.",
    currentPhase: "activation",
    createdAt: "2026-01-10T00:00:00Z",
    updatedAt: "2026-03-22T00:00:00Z",
  },
  {
    id: "u4",
    name: "João Ferreira",
    email: "joao@example.com",
    role: "artist",
    onboarded: false,
    level: "seed",
    currentPhase: "diagnosis",
    createdAt: "2026-03-20T00:00:00Z",
    updatedAt: "2026-03-20T00:00:00Z",
  },
  {
    id: "m1",
    name: "Ricardo Valdemar",
    email: "ricardo@wepac.pt",
    role: "mentor",
    onboarded: true,
    level: "partner",
    bio: "Diretor artístico da WEPAC.",
    currentPhase: "evaluation",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-03-23T00:00:00Z",
  },
  {
    id: "a1",
    name: "Admin WEPAC",
    email: "admin@wepac.pt",
    role: "admin",
    onboarded: true,
    level: "partner",
    currentPhase: "evaluation",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-03-23T00:00:00Z",
  },
];

// ===== EVALUATIONS =====

function makeScores(evalId: string, values: Record<AreaKey, number[]>): EvaluationScore[] {
  const scores: EvaluationScore[] = [];
  let id = 1;
  for (const area of Object.keys(values) as AreaKey[]) {
    values[area].forEach((score, idx) => {
      scores.push({
        id: `es-${evalId}-${id++}`,
        evaluationId: evalId,
        area,
        indicator: `indicator_${idx}`,
        score,
      });
    });
  }
  return scores;
}

export const mockEvaluations: Evaluation[] = [
  {
    id: "ev1",
    userId: "u1",
    evaluatorId: "u1",
    evaluationType: "self",
    moment: "entry",
    completedAt: "2026-01-20T00:00:00Z",
    scores: makeScores("ev1", {
      physical: [3, 4, 3, 3, 4, 3, 3],
      emotional: [3, 4, 4, 3, 2, 3, 3],
      character: [4, 4, 5, 4, 3, 4, 4],
      spiritual: [2, 3, 2, 3, 2, 2],
      intellectual: [4, 3, 3, 2, 2, 3, 3],
      social: [3, 3, 3, 2, 3, 3, 2],
    }),
  },
  {
    id: "ev2",
    userId: "u1",
    evaluatorId: "m1",
    evaluationType: "mentor",
    moment: "entry",
    completedAt: "2026-01-25T00:00:00Z",
    scores: makeScores("ev2", {
      physical: [3, 3, 3, 2, 3, 3, 3],
      emotional: [3, 4, 3, 3, 2, 3, 2],
      character: [4, 5, 5, 4, 3, 4, 3],
      spiritual: [2, 2, 2, 3, 2, 2],
      intellectual: [4, 3, 3, 2, 2, 3, 3],
      social: [3, 3, 2, 2, 2, 3, 2],
    }),
  },
  {
    id: "ev3",
    userId: "u1",
    evaluatorId: "u1",
    evaluationType: "self",
    moment: "mid",
    completedAt: "2026-03-01T00:00:00Z",
    scores: makeScores("ev3", {
      physical: [4, 4, 4, 3, 4, 4, 3],
      emotional: [4, 4, 4, 4, 3, 4, 3],
      character: [5, 5, 5, 4, 4, 5, 4],
      spiritual: [3, 3, 3, 3, 3, 3],
      intellectual: [4, 4, 4, 3, 3, 3, 4],
      social: [4, 3, 4, 3, 3, 4, 3],
    }),
  },
  {
    id: "ev4",
    userId: "u1",
    evaluatorId: "m1",
    evaluationType: "mentor",
    moment: "mid",
    completedAt: "2026-03-05T00:00:00Z",
    scores: makeScores("ev4", {
      physical: [4, 4, 3, 3, 4, 4, 3],
      emotional: [3, 4, 4, 3, 3, 4, 3],
      character: [4, 5, 5, 4, 4, 4, 4],
      spiritual: [3, 3, 3, 3, 3, 2],
      intellectual: [4, 4, 3, 3, 3, 3, 4],
      social: [3, 3, 3, 3, 3, 3, 3],
    }),
  },
];

// ===== STRATEGIC MAP =====

export const mockStrategicMapScores: StrategicMapScore[] = [
  {
    id: "sm1",
    userId: "u1",
    evaluatorId: "m1",
    month: "2026-02",
    longTermScore: 2,
    annualScore: 2,
    quarterlyScore: 3,
    monthlyScore: 3,
  },
  {
    id: "sm2",
    userId: "u1",
    evaluatorId: "m1",
    month: "2026-03",
    longTermScore: 3,
    annualScore: 3,
    quarterlyScore: 4,
    monthlyScore: 4,
  },
];

// ===== LIFE PLAN =====

export const mockLifePlans: LifePlan[] = [
  {
    id: "lp1",
    userId: "u1",
    whoIAm:
      "Sou uma violinista de 27 anos, nascida em Braga. A música sempre fez parte da minha vida — comecei a estudar violino aos 6 anos. Formei-me no Conservatório de Música e fiz uma licenciatura em Performação Musical no ESMAE. Para além de performer, sou compositora — a minha linguagem artística vive entre o clássico e o contemporâneo.",
    whereIAm:
      "Atualmente dou aulas particulares de violino e faço freelance em orquestras e eventos. Não tenho um plano claro de carreira, e sinto que estou a reagir ao mercado em vez de o moldar. Financeiramente instável, mas com talento reconhecido.",
    whereIGo:
      "Quero construir uma carreira sustentável como solista e compositora. Imagino-me a liderar projetos artísticos próprios, com uma marca pessoal forte e um público fiel. A longo prazo, quero combinar performance com criação e educação.",
    whyIDo:
      "Faço música porque acredito que ela transforma pessoas. O meu propósito é criar experiências que toquem profundamente quem as vive. A música é a minha linguagem — é assim que eu comunico verdade.",
    commitments:
      "Praticar diariamente com intenção. Investir na minha saúde física e mental. Ser pontual e cumprir compromissos. Aceitar feedback sem defensividade. Construir relações autênticas no meio artístico.",
    updatedAt: "2026-03-15T00:00:00Z",
  },
];

// ===== STRATEGIC PLAN =====

export const mockStrategicPlans: StrategicPlan[] = [
  {
    id: "sp1",
    userId: "u1",
    quarter: "2026-Q1",
    longTermVision:
      "Ser uma referência na cena de música de câmara em Portugal, com projetos artísticos próprios e presença internacional. Combinar performance, composição e educação como três pilares da minha carreira.",
    positioning:
      "Violinista e compositora contemporânea, com raízes clássicas e uma linguagem artística intimista e de alta qualidade.",
    focusAreas: ["physical", "intellectual", "social"],
    quarterlyReflection: "",
    goals: [
      {
        id: "g1",
        strategicPlanId: "sp1",
        scope: "annual",
        title: "Criar projeto artístico próprio",
        description: "Desenvolver um projeto de concerto solo com repertório original.",
        successCriteria: "Ter o programa completo e pelo menos 2 apresentações agendadas.",
        deadline: "2026-12-31",
        status: "in_progress",
      },
      {
        id: "g2",
        strategicPlanId: "sp1",
        scope: "annual",
        title: "Estabilidade financeira",
        description: "Construir uma base de rendimento previsível.",
        successCriteria: "3 fontes de rendimento activas e recorrentes.",
        deadline: "2026-12-31",
        status: "not_started",
      },
      {
        id: "g3",
        strategicPlanId: "sp1",
        scope: "quarterly",
        title: "Completar diagnóstico e plano",
        description: "Finalizar o processo de diagnóstico e definir plano trimestral.",
        successCriteria: "Plano trimestral definido e validado com mentor.",
        deadline: "2026-03-31",
        status: "completed",
      },
      {
        id: "g4",
        strategicPlanId: "sp1",
        scope: "quarterly",
        title: "Definir posicionamento artístico",
        description: "Clarificar identidade artística e proposta de valor.",
        successCriteria: "Texto de posicionamento escrito e aprovado.",
        deadline: "2026-03-31",
        status: "in_progress",
      },
    ],
    monthlyActions: [
      {
        id: "ma1",
        strategicPlanId: "sp1",
        month: "2026-03",
        title: "Escrever bio artística",
        goalId: "g4",
        deadline: "2026-03-15",
        status: "done",
      },
      {
        id: "ma2",
        strategicPlanId: "sp1",
        month: "2026-03",
        title: "Seleccionar repertório para projecto solo",
        goalId: "g1",
        deadline: "2026-03-25",
        status: "in_progress",
      },
      {
        id: "ma3",
        strategicPlanId: "sp1",
        month: "2026-03",
        title: "Agendar sessão de fotos profissional",
        deadline: "2026-03-30",
        status: "todo",
      },
    ],
  },
];

// ===== TASKS =====

export const mockTasks: Task[] = [
  {
    id: "t1",
    userId: "u1",
    assignedById: "m1",
    title: "Completar autoavaliação de meio de percurso",
    description: "Preencher a autoavaliação das 6 áreas para o momento intermédio.",
    origin: "mentor",
    deadline: "2026-03-05",
    status: "done",
    comments: [],
  },
  {
    id: "t2",
    userId: "u1",
    assignedById: "m1",
    title: "Escrever reflexão sobre sessão de grupo",
    description: "Reflexão pessoal sobre insights da última sessão de grupo.",
    origin: "session",
    deadline: "2026-03-20",
    status: "done",
    comments: [],
  },
  {
    id: "t3",
    userId: "u1",
    title: "Preparar repertório para showcase",
    description: "Seleccionar e ensaiar 3 peças para o showcase interno.",
    origin: "plan",
    goalId: "g1",
    deadline: "2026-03-28",
    status: "in_progress",
    comments: [],
  },
  {
    id: "t4",
    userId: "u1",
    assignedById: "m1",
    title: "Enviar fotos profissionais para branding",
    origin: "mentor",
    deadline: "2026-04-05",
    status: "todo",
    comments: [],
  },
  {
    id: "t5",
    userId: "u1",
    title: "Revisão do PPV — secção 'Para onde quero ir'",
    origin: "self",
    deadline: "2026-04-10",
    status: "todo",
    comments: [],
  },
  {
    id: "t6",
    userId: "u2",
    assignedById: "m1",
    title: "Completar autoavaliação inicial",
    origin: "mentor",
    deadline: "2026-03-25",
    status: "in_progress",
    comments: [],
  },
];

// ===== SESSIONS =====

export const mockSessions: Session[] = [
  {
    id: "s1",
    mentorId: "m1",
    sessionType: "individual",
    scheduledAt: "2026-01-22T10:00:00Z",
    durationMinutes: 60,
    status: "completed",
    notes: "Sessão de diagnóstico inicial. Ana demonstra forte consciência técnica mas revela fragilidade na clareza de propósito e visão estratégica. Boa receptividade ao feedback.",
    notesPublished: true,
    discussionPoints: "Diagnóstico inicial, expectativas do programa, objectivos pessoais",
    attendees: [{ id: "sa1", sessionId: "s1", userId: "u1", attended: true }],
  },
  {
    id: "s2",
    mentorId: "m1",
    sessionType: "group",
    scheduledAt: "2026-02-05T14:00:00Z",
    durationMinutes: 90,
    status: "completed",
    notes: "Sessão de grupo sobre identidade artística. Exercício de posicionamento. Todos os artistas participaram activamente.",
    notesPublished: true,
    discussionPoints: "Identidade artística, posicionamento, exercício de elevator pitch",
    attendees: [
      { id: "sa2", sessionId: "s2", userId: "u1", attended: true },
      { id: "sa3", sessionId: "s2", userId: "u2", attended: true },
      { id: "sa4", sessionId: "s2", userId: "u3", attended: true },
    ],
  },
  {
    id: "s3",
    mentorId: "m1",
    sessionType: "individual",
    scheduledAt: "2026-03-12T10:00:00Z",
    durationMinutes: 60,
    status: "completed",
    notes: "Revisão de progresso. Ana está a evoluir bem no planeamento. Precisa de mais trabalho na componente espiritual — clareza de propósito.",
    notesPublished: true,
    discussionPoints: "Revisão de progresso, plano estratégico, próximos passos",
    attendees: [{ id: "sa5", sessionId: "s3", userId: "u1", attended: true }],
  },
  {
    id: "s4",
    mentorId: "m1",
    sessionType: "individual",
    scheduledAt: "2026-03-26T10:00:00Z",
    durationMinutes: 60,
    status: "scheduled",
    notesPublished: false,
    attendees: [{ id: "sa6", sessionId: "s4", userId: "u1", attended: false }],
  },
];

// ===== CONVERSATIONS =====

export const mockConversations: Conversation[] = [
  {
    id: "c1",
    participants: ["u1", "m1"],
    messages: [
      {
        id: "msg1",
        conversationId: "c1",
        userId: "m1",
        body: "Ana, envio-te o feedback da última sessão. Está publicado nas notas. Tens alguma dúvida?",
        readAt: "2026-03-13T10:00:00Z",
        createdAt: "2026-03-12T18:00:00Z",
      },
      {
        id: "msg2",
        conversationId: "c1",
        userId: "u1",
        body: "Obrigada Ricardo! Li as notas, faz todo o sentido. Vou trabalhar nesse ponto da clareza de propósito. Posso enviar-te um rascunho da minha reflexão antes da próxima sessão?",
        readAt: "2026-03-13T11:00:00Z",
        createdAt: "2026-03-13T09:30:00Z",
      },
      {
        id: "msg3",
        conversationId: "c1",
        userId: "m1",
        body: "Claro, fico à espera. Envia quando tiveres.",
        readAt: "2026-03-13T12:00:00Z",
        createdAt: "2026-03-13T11:15:00Z",
      },
      {
        id: "msg4",
        conversationId: "c1",
        userId: "u1",
        body: "Ricardo, preparei a reflexão sobre propósito e missão. Também comecei a trabalhar no posicionamento artístico. Gostava de discutir isto na próxima sessão.",
        createdAt: "2026-03-20T14:00:00Z",
      },
    ],
  },
  {
    id: "c2",
    participants: ["u2", "m1"],
    messages: [
      {
        id: "msg5",
        conversationId: "c2",
        userId: "m1",
        body: "Pedro, bem-vindo ao programa. Tens a autoavaliação para completar — vê na plataforma.",
        readAt: "2026-03-18T10:00:00Z",
        createdAt: "2026-03-18T09:00:00Z",
      },
    ],
  },
];

// ===== HELPER FUNCTIONS =====

export function getCurrentUser(): User {
  return mockUsers[0]; // Ana Martins (artist)
}

export function getMentor(): User {
  return mockUsers.find((u) => u.role === "mentor")!;
}

export function getArtists(): User[] {
  return mockUsers.filter((u) => u.role === "artist");
}

export function getUserEvaluations(userId: string): Evaluation[] {
  return mockEvaluations.filter((e) => e.userId === userId);
}

export function getUserTasks(userId: string): Task[] {
  return mockTasks.filter((t) => t.userId === userId);
}

export function getUserSessions(userId: string): Session[] {
  return mockSessions.filter((s) =>
    s.attendees.some((a) => a.userId === userId)
  );
}

export function getUserConversations(userId: string): Conversation[] {
  return mockConversations.filter((c) => c.participants.includes(userId));
}

export function computeAreaScores(
  userId: string,
  moment: "entry" | "mid" | "exit"
): Record<AreaKey, { selfAvg: number; mentorAvg: number; composite: number }> {
  const evals = mockEvaluations.filter(
    (e) => e.userId === userId && e.moment === moment
  );
  const selfEval = evals.find((e) => e.evaluationType === "self");
  const mentorEval = evals.find((e) => e.evaluationType === "mentor");

  const areas = ["physical", "emotional", "character", "spiritual", "intellectual", "social"] as AreaKey[];
  const result = {} as Record<AreaKey, { selfAvg: number; mentorAvg: number; composite: number }>;

  for (const area of areas) {
    const selfScores = selfEval?.scores.filter((s) => s.area === area).map((s) => s.score) ?? [];
    const mentorScores = mentorEval?.scores.filter((s) => s.area === area).map((s) => s.score) ?? [];

    const selfAvg = selfScores.length > 0 ? selfScores.reduce((a, b) => a + b, 0) / selfScores.length : 0;
    const mentorAvg = mentorScores.length > 0 ? mentorScores.reduce((a, b) => a + b, 0) / mentorScores.length : 0;

    let composite: number;
    if (selfAvg > 0 && mentorAvg > 0) {
      composite = selfAvg * 0.4 + mentorAvg * 0.6;
    } else if (selfAvg > 0) {
      composite = selfAvg;
    } else {
      composite = mentorAvg;
    }

    result[area] = { selfAvg: Math.round(selfAvg * 10) / 10, mentorAvg: Math.round(mentorAvg * 10) / 10, composite: Math.round(composite * 10) / 10 };
  }

  return result;
}
