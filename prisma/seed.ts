import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
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
  await prisma.user.deleteMany();

  const password = hashSync("password123", 10);

  // ===== USERS =====
  const u1 = await prisma.user.create({
    data: {
      name: "Ana Martins",
      email: "ana@example.com",
      passwordHash: password,
      role: "artist",
      onboarded: true,
      level: "seed",
      bio: "Violinista e compositora. Formada no Conservatório de Braga.",
      currentPhase: "development",
    },
  });

  const u2 = await prisma.user.create({
    data: {
      name: "Pedro Silva",
      email: "pedro@example.com",
      passwordHash: password,
      role: "artist",
      onboarded: true,
      level: "seed",
      bio: "Pianista e professor de música.",
      currentPhase: "structuring",
    },
  });

  const u3 = await prisma.user.create({
    data: {
      name: "Maria Costa",
      email: "maria@example.com",
      passwordHash: password,
      role: "artist",
      onboarded: true,
      level: "growth",
      bio: "Cantora lírica e performer.",
      currentPhase: "activation",
    },
  });

  const u4 = await prisma.user.create({
    data: {
      name: "João Ferreira",
      email: "joao@example.com",
      phone: "+351 912 345 678",
      role: "artist",
      inviteToken: "jf-2026-abc",
      inviteExpiresAt: new Date("2026-04-30"),
      onboarded: false,
      level: "seed",
      currentPhase: "diagnosis",
    },
  });

  const m1 = await prisma.user.create({
    data: {
      name: "Ricardo Valdemar",
      email: "ricardo@wepac.pt",
      passwordHash: password,
      role: "mentor",
      onboarded: true,
      level: "partner",
      bio: "Diretor artístico da WEPAC.",
      currentPhase: "evaluation",
    },
  });

  const a1 = await prisma.user.create({
    data: {
      name: "Admin WEPAC",
      email: "admin@wepac.pt",
      passwordHash: password,
      role: "admin",
      onboarded: true,
      level: "partner",
      currentPhase: "evaluation",
    },
  });

  // ===== EVALUATIONS =====
  type AreaScores = {
    physical: number[];
    emotional: number[];
    character: number[];
    spiritual: number[];
    intellectual: number[];
    social: number[];
  };

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
      for (let i = 0; i < scores.length; i++) {
        await prisma.evaluationScore.create({
          data: {
            evaluationId: evaluation.id,
            area: area as keyof AreaScores,
            indicator: `indicator_${i}`,
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
      { userId: u1.id, assignedById: m1.id, title: "Completar autoavaliação de meio de percurso", description: "Preencher a autoavaliação das 6 áreas para o momento intermédio.", origin: "mentor", deadline: "2026-03-05", status: "done" },
      { userId: u1.id, assignedById: m1.id, title: "Escrever reflexão sobre sessão de grupo", description: "Reflexão pessoal sobre insights da última sessão de grupo.", origin: "session", deadline: "2026-03-20", status: "done" },
      { userId: u1.id, title: "Preparar repertório para showcase", description: "Seleccionar e ensaiar 3 peças para o showcase interno.", origin: "plan", goalId: g1.id, deadline: "2026-03-28", status: "in_progress" },
      { userId: u1.id, assignedById: m1.id, title: "Enviar fotos profissionais para branding", origin: "mentor", deadline: "2026-04-05", status: "todo" },
      { userId: u1.id, title: "Revisão do PPV — secção 'Para onde quero ir'", origin: "self", deadline: "2026-04-10", status: "todo" },
      { userId: u2.id, assignedById: m1.id, title: "Completar autoavaliação inicial", origin: "mentor", deadline: "2026-03-25", status: "in_progress" },
    ],
  });

  // ===== SESSIONS =====
  const s1 = await prisma.session.create({
    data: { mentorId: m1.id, sessionType: "individual", scheduledAt: new Date("2026-01-22T10:00:00Z"), durationMinutes: 60, status: "completed", notes: "Sessão de diagnóstico inicial. Ana demonstra forte consciência técnica mas revela fragilidade na clareza de propósito e visão estratégica. Boa receptividade ao feedback.", notesPublished: true, discussionPoints: "Diagnóstico inicial, expectativas do programa, objectivos pessoais" },
  });
  await prisma.sessionAttendee.create({ data: { sessionId: s1.id, userId: u1.id, attended: true } });

  const s2 = await prisma.session.create({
    data: { mentorId: m1.id, sessionType: "group", scheduledAt: new Date("2026-02-05T14:00:00Z"), durationMinutes: 90, status: "completed", notes: "Sessão de grupo sobre identidade artística. Exercício de posicionamento. Todos os artistas participaram activamente.", notesPublished: true, discussionPoints: "Identidade artística, posicionamento, exercício de elevator pitch" },
  });
  await prisma.sessionAttendee.createMany({ data: [{ sessionId: s2.id, userId: u1.id, attended: true }, { sessionId: s2.id, userId: u2.id, attended: true }, { sessionId: s2.id, userId: u3.id, attended: true }] });

  const s3 = await prisma.session.create({
    data: { mentorId: m1.id, sessionType: "individual", scheduledAt: new Date("2026-03-12T10:00:00Z"), durationMinutes: 60, status: "completed", notes: "Revisão de progresso. Ana está a evoluir bem no planeamento. Precisa de mais trabalho na componente espiritual — clareza de propósito.", notesPublished: true, discussionPoints: "Revisão de progresso, plano estratégico, próximos passos" },
  });
  await prisma.sessionAttendee.create({ data: { sessionId: s3.id, userId: u1.id, attended: true } });

  const s4 = await prisma.session.create({
    data: { mentorId: m1.id, sessionType: "individual", scheduledAt: new Date("2026-03-26T10:00:00Z"), durationMinutes: 60, status: "scheduled", notesPublished: false },
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
    data: { conversationId: c2.id, userId: m1.id, body: "Pedro, bem-vindo ao programa. Tens a autoavaliação para completar — vê na plataforma.", readAt: new Date("2026-03-18T10:00:00Z"), createdAt: new Date("2026-03-18T09:00:00Z") },
  });

  console.log("Seed completed successfully!");
  console.log(`Users: ${u1.id}, ${u2.id}, ${u3.id}, ${u4.id}, ${m1.id}, ${a1.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
