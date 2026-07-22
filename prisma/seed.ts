import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing platform data (leads/beta_signups/bilheteira untouched)
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.sessionAttendee.deleteMany();
  await prisma.session.deleteMany();
  await prisma.task.deleteMany();
  await prisma.monthlyAction.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.strategicPlan.deleteMany();
  await prisma.lifePlan.deleteMany();
  await prisma.strategicMapScore.deleteMany();
  await prisma.evaluationScore.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.stagePlacement.deleteMany();
  await prisma.cycleFacilitator.deleteMany();
  await prisma.cycleEnrollment.deleteMany();
  await prisma.packMembership.deleteMany();
  await prisma.communityPack.deleteMany();
  await prisma.mentorship.deleteMany();
  await prisma.personConnection.deleteMany();
  await prisma.cohortMembership.deleteMany();
  await prisma.cohort.deleteMany();
  await prisma.pack.deleteMany();
  await prisma.user.deleteMany();

  const password = hashSync("password123", 10);

  // ===== LEGACY DELIVERY FIXTURES =====
  // These rows exercise compatibility only. They are deliberately not seeded
  // into CommunityPack/CycleEnrollment/Mentorship because no relationship or
  // target mapping may be inferred from legacy data.
  const packArtist = await prisma.pack.create({
    data: {
      slug: "artist",
      name: "Pack Artista",
      tagline: "Excelência artística. Estrutura humana. Impacto real.",
      description:
        "Para artistas que precisam de estrutura humana, excelência artística, posicionamento e ativação profissional.",
      sortOrder: 0,
    },
  });

  const cohortAlpha = await prisma.cohort.create({
    data: {
      packId: packArtist.id,
      name: "Alpha",
      status: "active",
      startsAt: new Date("2026-01-15T00:00:00Z"),
    },
  });

  // ===== USERS =====
  const u1 = await prisma.user.create({
    data: {
      name: "Ana Martins",
      email: "ana@example.com",
      passwordHash: password,
      role: "member",
      onboarded: true,
      bio: "Violinista e compositora. Formada no Conservatório de Braga.",
    },
  });

  const u2 = await prisma.user.create({
    data: {
      name: "Pedro Silva",
      email: "pedro@example.com",
      passwordHash: password,
      role: "member",
      onboarded: true,
      bio: "Pianista e professor de música.",
    },
  });

  const u3 = await prisma.user.create({
    data: {
      name: "Maria Costa",
      email: "maria@example.com",
      passwordHash: password,
      role: "member",
      onboarded: true,
      bio: "Cantora lírica e performer.",
    },
  });

  const u4 = await prisma.user.create({
    data: {
      name: "João Ferreira",
      email: "joao@example.com",
      phone: "+351 912 345 678",
      role: "member",
      inviteToken: "jf-2026-abc",
      inviteExpiresAt: new Date("2026-08-30"),
      onboarded: false,
    },
  });

  const u5 = await prisma.user.create({
    data: {
      name: "Sofia Rocha",
      email: "sofia@example.com",
      passwordHash: password,
      role: "member",
      onboarded: false, // has not accepted the Agreement yet — forces the onboarding flow
    },
  });

  const m1 = await prisma.user.create({
    data: {
      name: "Ricardo Valdemar",
      email: "ricardo@wepac.pt",
      passwordHash: password,
      role: "mentor",
      onboarded: true,
      bio: "Diretor artístico da WEPAC.",
    },
  });

  const a1 = await prisma.user.create({
    data: {
      name: "Admin WEPAC",
      email: "admin@wepac.pt",
      passwordHash: password,
      role: "admin",
      onboarded: true,
    },
  });

  // ===== MEMBERSHIPS =====
  const mem1 = await prisma.cohortMembership.create({
    data: {
      cohortId: cohortAlpha.id,
      userId: u1.id,
      role: "member",
      level: "seed",
      currentPhase: "development",
    },
  });
  const mem2 = await prisma.cohortMembership.create({
    data: {
      cohortId: cohortAlpha.id,
      userId: u2.id,
      role: "member",
      level: "seed",
      currentPhase: "structuring",
    },
  });
  const mem3 = await prisma.cohortMembership.create({
    data: {
      cohortId: cohortAlpha.id,
      userId: u3.id,
      role: "member",
      level: "growth",
      currentPhase: "activation",
    },
  });
  await prisma.cohortMembership.create({
    data: {
      cohortId: cohortAlpha.id,
      userId: u4.id,
      role: "member",
      level: "seed",
      currentPhase: "diagnosis",
    },
  });
  await prisma.cohortMembership.create({
    data: {
      cohortId: cohortAlpha.id,
      userId: m1.id,
      role: "mentor",
      level: "partner",
      currentPhase: "consolidation",
    },
  });
  await prisma.cohortMembership.create({
    data: {
      cohortId: cohortAlpha.id,
      userId: u5.id,
      role: "member",
      level: "seed",
      currentPhase: "diagnosis",
    },
  });
  void mem2;
  void mem3;

  // ===== EVALUATIONS =====
  // Indicator keys per area for the artist pack (must mirror
  // src/lib/wepacker/types.ts ARTIST_INDICATORS ordering).
  const INDICATOR_KEYS: Record<string, string[]> = {
    physical: [
      "posture",
      "breathing",
      "body_awareness",
      "endurance",
      "self_care",
      "stage_presence_physical",
      "image",
    ],
    emotional: [
      "emotional_management",
      "authenticity",
      "expressiveness",
      "resilience",
      "feedback_relationship",
      "stage_relationship",
      "vulnerability",
    ],
    character: [
      "discipline",
      "punctuality",
      "commitment",
      "professional_ethics",
      "plan_follow_through",
      "responsibility",
      "prolonged_effort",
    ],
    spiritual: [
      "purpose_clarity",
      "art_life_coherence",
      "depth_of_vision",
      "beauty_relationship",
      "mission_sense",
      "interiority",
    ],
    intellectual: [
      "technical_knowledge",
      "artistic_culture",
      "analytical_capacity",
      "strategic_thinking",
      "market_understanding",
      "pedagogical_capacity",
      "repertoire_diversity",
    ],
    social: [
      "communication",
      "teamwork",
      "audience_relationship",
      "networking",
      "context_reading",
      "collaboration",
      "community_presence",
    ],
  };

  type AreaScores = Record<string, number[]>;

  async function createEvaluation(
    userId: string,
    evaluatorId: string,
    evaluationType: "self" | "mentor",
    moment: "entry" | "mid",
    completedAt: string,
    areaScores: AreaScores
  ) {
    const evaluation = await prisma.evaluation.create({
      data: {
        userId,
        evaluatorId,
        evaluationType,
        moment,
        completedAt: new Date(completedAt),
      },
    });

    for (const [area, scores] of Object.entries(areaScores)) {
      const keys = INDICATOR_KEYS[area];
      for (let i = 0; i < scores.length; i++) {
        await prisma.evaluationScore.create({
          data: {
            evaluationId: evaluation.id,
            area: area as
              | "physical"
              | "emotional"
              | "character"
              | "spiritual"
              | "intellectual"
              | "social",
            indicator: keys[i] ?? `indicator_${i}`,
            score: scores[i],
          },
        });
      }
    }

    return evaluation;
  }

  await createEvaluation(u1.id, u1.id, "self", "entry", "2026-01-20T00:00:00Z", {
    physical: [3, 4, 3, 3, 4, 3, 3],
    emotional: [3, 4, 4, 3, 2, 3, 3],
    character: [4, 4, 5, 4, 3, 4, 4],
    spiritual: [2, 3, 2, 3, 2, 2],
    intellectual: [4, 3, 3, 2, 2, 3, 3],
    social: [3, 3, 3, 2, 3, 3, 2],
  });

  await createEvaluation(u1.id, m1.id, "mentor", "entry", "2026-01-25T00:00:00Z", {
    physical: [3, 3, 3, 2, 3, 3, 3],
    emotional: [3, 4, 3, 3, 2, 3, 2],
    character: [4, 5, 5, 4, 3, 4, 3],
    spiritual: [2, 2, 2, 3, 2, 2],
    intellectual: [4, 3, 3, 2, 2, 3, 3],
    social: [3, 3, 2, 2, 2, 3, 2],
  });

  await createEvaluation(u1.id, u1.id, "self", "mid", "2026-03-01T00:00:00Z", {
    physical: [4, 4, 4, 3, 4, 4, 3],
    emotional: [4, 4, 4, 4, 3, 4, 3],
    character: [5, 5, 5, 4, 4, 5, 4],
    spiritual: [3, 3, 3, 3, 3, 3],
    intellectual: [4, 4, 4, 3, 3, 3, 4],
    social: [4, 3, 4, 3, 3, 4, 3],
  });

  await createEvaluation(u1.id, m1.id, "mentor", "mid", "2026-03-05T00:00:00Z", {
    physical: [4, 4, 3, 3, 4, 4, 3],
    emotional: [3, 4, 4, 3, 3, 4, 3],
    character: [4, 5, 5, 4, 4, 4, 4],
    spiritual: [3, 3, 3, 3, 3, 2],
    intellectual: [4, 4, 3, 3, 3, 3, 4],
    social: [3, 3, 3, 3, 3, 3, 3],
  });

  // ===== STRATEGIC MAP =====
  await prisma.strategicMapScore.createMany({
    data: [
      { userId: u1.id, evaluatorId: m1.id, month: "2026-02", longTermScore: 2, annualScore: 2, quarterlyScore: 3, monthlyScore: 3 },
      { userId: u1.id, evaluatorId: m1.id, month: "2026-03", longTermScore: 3, annualScore: 3, quarterlyScore: 4, monthlyScore: 4 },
    ],
  });

  // ===== LIFE PLAN =====
  await prisma.lifePlan.create({
    data: {
      userId: u1.id,
      whoIAm: "Sou uma violinista de 27 anos, nascida em Braga. A música sempre fez parte da minha vida — comecei a estudar violino aos 6 anos. Formei-me no Conservatório de Música e fiz uma licenciatura em Performação Musical no ESMAE. Para além de performer, sou compositora — a minha linguagem artística vive entre o clássico e o contemporâneo.",
      whereIAm: "Atualmente dou aulas particulares de violino e faço freelance em orquestras e eventos. Não tenho um plano claro de carreira, e sinto que estou a reagir ao mercado em vez de o moldar. Financeiramente instável, mas com talento reconhecido.",
      whereIGo: "Quero construir uma carreira sustentável como solista e compositora. Imagino-me a liderar projetos artísticos próprios, com uma marca pessoal forte e um público fiel. A longo prazo, quero combinar performance com criação e educação.",
      whyIDo: "Faço música porque acredito que ela transforma pessoas. O meu propósito é criar experiências que toquem profundamente quem as vive. A música é a minha linguagem — é assim que eu comunico verdade.",
      commitments: "Praticar diariamente com intenção. Investir na minha saúde física e mental. Ser pontual e cumprir compromissos. Aceitar feedback sem defensividade. Construir relações autênticas no meio artístico.",
    },
  });

  // ===== STRATEGIC PLAN =====
  const sp1 = await prisma.strategicPlan.create({
    data: {
      userId: u1.id,
      quarter: "2026-Q1",
      longTermVision: "Ser uma referência na cena de música de câmara em Portugal, com projetos artísticos próprios e presença internacional. Combinar performance, composição e educação como três pilares da minha carreira.",
      positioning: "Violinista e compositora contemporânea, com raízes clássicas e uma linguagem artística intimista e de alta qualidade.",
      focusAreas: ["physical", "intellectual", "social"],
      quarterlyReflection: "",
    },
  });

  const g1 = await prisma.goal.create({
    data: { strategicPlanId: sp1.id, scope: "annual", title: "Criar projeto artístico próprio", description: "Desenvolver um projeto de concerto solo com repertório original.", successCriteria: "Ter o programa completo e pelo menos 2 apresentações agendadas.", deadline: "2026-12-31", status: "in_progress" },
  });

  await prisma.goal.create({
    data: { strategicPlanId: sp1.id, scope: "annual", title: "Estabilidade financeira", description: "Construir uma base de rendimento previsível.", successCriteria: "3 fontes de rendimento activas e recorrentes.", deadline: "2026-12-31", status: "not_started" },
  });

  await prisma.goal.create({
    data: { strategicPlanId: sp1.id, scope: "quarterly", title: "Completar diagnóstico e plano", description: "Finalizar o processo de diagnóstico e definir plano trimestral.", successCriteria: "Plano trimestral definido e validado com mentor.", deadline: "2026-03-31", status: "completed" },
  });

  const g4 = await prisma.goal.create({
    data: { strategicPlanId: sp1.id, scope: "quarterly", title: "Definir posicionamento artístico", description: "Clarificar identidade artística e proposta de valor.", successCriteria: "Texto de posicionamento escrito e aprovado.", deadline: "2026-03-31", status: "in_progress" },
  });

  await prisma.monthlyAction.create({
    data: { strategicPlanId: sp1.id, month: "2026-03", title: "Escrever bio artística", goalId: g4.id, deadline: "2026-03-15", status: "done" },
  });

  await prisma.monthlyAction.create({
    data: { strategicPlanId: sp1.id, month: "2026-03", title: "Seleccionar repertório para projecto solo", goalId: g1.id, deadline: "2026-03-25", status: "in_progress" },
  });

  await prisma.monthlyAction.create({
    data: { strategicPlanId: sp1.id, month: "2026-03", title: "Agendar sessão de fotos profissional", deadline: "2026-03-30", status: "todo" },
  });

  // ===== TASKS =====
  await prisma.task.createMany({
    data: [
      { membershipId: mem1.id, assignedById: m1.id, title: "Completar legacy Self-Assessment de meio de percurso", description: "Preencher o legacy Self-Assessment dos Six Pillars para o momento intermédio.", origin: "mentor", deadline: "2026-03-05", status: "done" },
      { membershipId: mem1.id, assignedById: m1.id, title: "Escrever reflexão sobre sessão de grupo", description: "Reflexão pessoal sobre insights da última sessão de grupo.", origin: "session", deadline: "2026-03-20", status: "done" },
      { membershipId: mem1.id, title: "Preparar repertório para showcase", description: "Seleccionar e ensaiar 3 peças para o showcase interno.", origin: "plan", goalId: g1.id, deadline: "2026-03-28", status: "in_progress" },
      { membershipId: mem1.id, assignedById: m1.id, title: "Enviar fotos profissionais para branding", origin: "mentor", deadline: "2026-04-05", status: "todo" },
      { membershipId: mem1.id, title: "Revisão do PPV — secção 'Para onde quero ir'", origin: "self", deadline: "2026-04-10", status: "todo" },
      { membershipId: mem2.id, assignedById: m1.id, title: "Completar autoavaliação inicial", origin: "mentor", deadline: "2026-03-25", status: "in_progress" },
    ],
  });

  // ===== SESSIONS =====
  const s1 = await prisma.session.create({
    data: { cohortId: cohortAlpha.id, mentorId: m1.id, sessionType: "individual", scheduledAt: new Date("2026-01-22T10:00:00Z"), durationMinutes: 60, status: "completed", notes: "Sessão de diagnóstico inicial. Ana demonstra forte consciência técnica mas revela fragilidade na clareza de propósito e visão estratégica. Boa receptividade ao feedback.", notesPublished: true, discussionPoints: "Diagnóstico inicial, expectativas do programa, objectivos pessoais" },
  });
  await prisma.sessionAttendee.create({ data: { sessionId: s1.id, userId: u1.id, attended: true } });

  const s2 = await prisma.session.create({
    data: { cohortId: cohortAlpha.id, mentorId: m1.id, sessionType: "group", scheduledAt: new Date("2026-02-05T14:00:00Z"), durationMinutes: 90, status: "completed", notes: "Sessão de grupo sobre identidade artística. Exercício de posicionamento. Todos os membros participaram activamente.", notesPublished: true, discussionPoints: "Identidade artística, posicionamento, exercício de elevator pitch" },
  });
  await prisma.sessionAttendee.createMany({ data: [{ sessionId: s2.id, userId: u1.id, attended: true }, { sessionId: s2.id, userId: u2.id, attended: true }, { sessionId: s2.id, userId: u3.id, attended: true }] });

  const s3 = await prisma.session.create({
    data: { cohortId: cohortAlpha.id, mentorId: m1.id, sessionType: "individual", scheduledAt: new Date("2026-03-12T10:00:00Z"), durationMinutes: 60, status: "completed", notes: "Revisão de progresso. Ana está a evoluir bem no planeamento. Precisa de mais trabalho na componente espiritual — clareza de propósito.", notesPublished: true, discussionPoints: "Revisão de progresso, plano estratégico, próximos passos" },
  });
  await prisma.sessionAttendee.create({ data: { sessionId: s3.id, userId: u1.id, attended: true } });

  const s4 = await prisma.session.create({
    data: { cohortId: cohortAlpha.id, mentorId: m1.id, sessionType: "individual", scheduledAt: new Date("2026-08-26T10:00:00Z"), durationMinutes: 60, status: "scheduled", notesPublished: false },
  });
  await prisma.sessionAttendee.create({ data: { sessionId: s4.id, userId: u1.id, attended: false } });

  // ===== CONVERSATIONS =====
  const c1 = await prisma.conversation.create({ data: {} });
  await prisma.conversationParticipant.createMany({ data: [{ conversationId: c1.id, userId: u1.id }, { conversationId: c1.id, userId: m1.id }] });
  await prisma.message.createMany({
    data: [
      { conversationId: c1.id, userId: m1.id, body: "Ana, envio-te o feedback da última sessão. Está publicado nas notas. Tens alguma dúvida?", readAt: new Date("2026-03-13T10:00:00Z"), createdAt: new Date("2026-03-12T18:00:00Z") },
      { conversationId: c1.id, userId: u1.id, body: "Obrigada Ricardo! Li as notas, faz todo o sentido. Vou trabalhar nesse ponto da clareza de propósito. Posso enviar-te um rascunho da minha reflexão antes da próxima sessão?", readAt: new Date("2026-03-13T11:00:00Z"), createdAt: new Date("2026-03-13T09:30:00Z") },
      { conversationId: c1.id, userId: m1.id, body: "Claro, fico à espera. Envia quando tiveres.", readAt: new Date("2026-03-13T12:00:00Z"), createdAt: new Date("2026-03-13T11:15:00Z") },
      { conversationId: c1.id, userId: u1.id, body: "Ricardo, preparei a reflexão sobre propósito e missão. Também comecei a trabalhar no posicionamento artístico. Gostava de discutir isto na próxima sessão.", createdAt: new Date("2026-03-20T14:00:00Z") },
    ],
  });

  const c2 = await prisma.conversation.create({ data: {} });
  await prisma.conversationParticipant.createMany({ data: [{ conversationId: c2.id, userId: u2.id }, { conversationId: c2.id, userId: m1.id }] });
  await prisma.message.create({
    data: { conversationId: c2.id, userId: m1.id, body: "Pedro, bem-vindo ao WEPACKER. Tens a autoavaliação para completar — vê na plataforma.", readAt: new Date("2026-03-18T10:00:00Z"), createdAt: new Date("2026-03-18T09:00:00Z") },
  });

  // ===== BILHETEIRA WEPAC =====

  const deptsData = [
    {
      slug: "wessex",
      name: "Wessex",
      description: "Performance e criação contemporânea",
    },
    {
      slug: "easy-peasy",
      name: "Easy Peasy",
      description: "Educação artística",
    },
    {
      slug: "arte-a-capela",
      name: "Arte à Capela",
      description: "Património e espaços sagrados",
    },
  ];

  const depts: Record<string, { id: string }> = {};
  for (const d of deptsData) {
    const dept = await prisma.department.upsert({
      where: { slug: d.slug },
      update: { name: d.name, description: d.description },
      create: d,
    });
    depts[d.slug] = dept;
  }

  const capelaViva = await prisma.brand.upsert({
    where: { slug: "capela-viva" },
    update: {
      name: "Capela Viva",
      departmentId: depts["arte-a-capela"].id,
    },
    create: {
      slug: "capela-viva",
      name: "Capela Viva",
      departmentId: depts["arte-a-capela"].id,
    },
  });

  const adminPassword = hashSync("password123", 10);
  const seedAdmin = await prisma.ticketingAdmin.upsert({
    where: { email: "admin@wepac.pt" },
    update: { name: "Admin WEPAC" },
    create: {
      email: "admin@wepac.pt",
      name: "Admin WEPAC",
      passwordHash: adminPassword,
    },
  });

  const anandaSlug = "ananda-roda-iberia-antiga-2026-04-23";
  const anandaDescription = `Uma jornada sonora pelos séculos XV e XVI da Península Ibérica. Música profana e sacra, trazida ao mundo por Ananda Roda com a sua vihuela.

Ananda Roda é uma intérprete de cordas dedilhadas históricas — alaúde, arqui-alaúde e vihuela. Formada em Guitarra Clássica e Cordas Dedilhadas Históricas pelo Conservatório de Tatuí (Brasil) e actualmente a estudar alaúde renascentista na ESMAE (Politécnico do Porto).

Tem actuado em festivais internacionais pela Europa e integrado ensembles como Iberian Ensemble, Orquestra Barroca D'Alem Mar, CordeVoce e Ti'Sage. É a diretora artística do projeto Que he o que vejo?, grupo musical focado na interpretação historicamente informada.

Concerto inserido na programação regular de Capela Viva na Capela do Hospital de Jesus, Lisboa.`;

  const ananda = await prisma.event.upsert({
    where: { slug: anandaSlug },
    update: {},
    create: {
      slug: anandaSlug,
      title: "A Voz da Ibéria Antiga",
      subtitle: "Ananda Roda · vihuela",
      description: anandaDescription,
      departmentId: depts["arte-a-capela"].id,
      brandId: capelaViva.id,
      venue: "Capela do Hospital de Jesus",
      address: "Travessa da Arrochela, Lisboa",
      startsAt: new Date("2026-04-23T19:30:00+01:00"),
      doorsAt: new Date("2026-04-23T19:00:00+01:00"),
      durationMinutes: 60,
      capacity: 80,
      status: "published",
      createdById: seedAdmin.id,
    },
  });

  const existingTiers = await prisma.ticketTier.count({
    where: { eventId: ananda.id },
  });
  if (existingTiers === 0) {
    await prisma.ticketTier.createMany({
      data: [
        {
          eventId: ananda.id,
          name: "Bilhete",
          description: "Entrada regular — pagamento à porta.",
          priceCents: 1200,
          sortOrder: 0,
        },
        {
          eventId: ananda.id,
          name: "Amigo WEPAC",
          description: "Patrono — apoio directo ao programa Capela Viva.",
          priceCents: 2500,
          sortOrder: 1,
        },
      ],
    });
  }

  const catedraisSlug = "catedrais-interiores-2026-09-18";
  const catedraisDescription = `Um recital a solo de violoncelo dedicado às Suites para violoncelo solo de Bach, em diálogo com os caprichos de Duport e Popper. Um programa que atravessa três séculos de escrita para o instrumento, da disciplina barroca ao virtuosismo do século XIX.

Interpretado dentro de uma capela histórica, o recital explora a acústica do espaço como parte da experiência musical — a ressonância da pedra a moldar cada frase, o silêncio entre andamentos tão presente como as próprias notas.

Concerto inserido na programação regular de Capela Viva na Capela do Hospital de Jesus, Lisboa.`;

  const catedrais = await prisma.event.upsert({
    where: { slug: catedraisSlug },
    update: {},
    create: {
      slug: catedraisSlug,
      title: "Catedrais Interiores",
      subtitle: "António Cortez · violoncelo",
      description: catedraisDescription,
      departmentId: depts["arte-a-capela"].id,
      brandId: capelaViva.id,
      venue: "Capela do Hospital de Jesus",
      address: "Travessa da Arrochela, Lisboa",
      startsAt: new Date("2026-09-18T19:30:00+01:00"),
      doorsAt: new Date("2026-09-18T19:00:00+01:00"),
      durationMinutes: 60,
      capacity: 80,
      status: "published",
      createdById: seedAdmin.id,
    },
  });

  const existingCatedraisTiers = await prisma.ticketTier.count({
    where: { eventId: catedrais.id },
  });
  if (existingCatedraisTiers === 0) {
    await prisma.ticketTier.createMany({
      data: [
        {
          eventId: catedrais.id,
          name: "Bilhete",
          description: "Entrada regular — pagamento à porta.",
          priceCents: 1200,
          sortOrder: 0,
        },
      ],
    });
  }

  console.log("Seed completed successfully!");
  console.log(`Pack: ${packArtist.slug} · Cohort: ${cohortAlpha.name}`);
  console.log(`Users: ana@ / pedro@ / maria@ / joao@ / sofia@ example.com, ricardo@wepac.pt (mentor), admin@wepac.pt (admin) — password123`);
  console.log(`Bilheteira admin: admin@wepac.pt / password123`);
  console.log(`Evento seed: ${ananda.slug}, ${catedrais.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
