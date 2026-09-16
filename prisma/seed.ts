import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { assertDisposableSeedTarget } from "./seed-safety";

assertDisposableSeedTarget();
const prisma = new PrismaClient();

async function resetWepackerFixtures() {
  // This seed is only for disposable local/E2E databases. Public leads,
  // applications and ticketing data intentionally remain untouched.
  // Support Preview audit is append-only during normal operation. The guarded
  // disposable seed gets a transaction-local DELETE-only escape hatch and
  // removes protected events before their grants, Sessions and People.
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('wepac.support_preview_seed_reset', 'on', true)`;
    await tx.supportPreviewAuditEvent.deleteMany();
    await tx.supportPreviewGrant.deleteMany();
  });
  await prisma.emailOutbox.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.action.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.sessionAttendee.deleteMany();
  await prisma.session.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.strategicPlan.deleteMany();
  await prisma.lifeMapVersion.deleteMany();
  await prisma.lifeMap.deleteMany();
  await prisma.trail.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.stagePlacement.deleteMany();
  await prisma.cycleFacilitator.deleteMany();
  await prisma.cycleEnrollment.deleteMany();
  await prisma.packMembership.deleteMany();
  await prisma.pack.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.discipline.deleteMany();
  await prisma.mentorship.deleteMany();
  await prisma.personConnection.deleteMany();

  // Release A temporarily retains the physical legacy tables for deployment
  // compatibility. Release B drops them. This static block makes the local/E2E
  // reset work on either side of that contraction without exposing retired
  // models through Prisma or creating any legacy fixture.
  await prisma.$executeRaw`
    DO $cleanup$
    BEGIN
      IF to_regclass('public.evaluation_scores') IS NOT NULL THEN
        EXECUTE 'DELETE FROM "evaluation_scores"';
      END IF;
      IF to_regclass('public.evaluations') IS NOT NULL THEN
        EXECUTE 'DELETE FROM "evaluations"';
      END IF;
      IF to_regclass('public.strategic_map_scores') IS NOT NULL THEN
        EXECUTE 'DELETE FROM "strategic_map_scores"';
      END IF;
      IF to_regclass('public.monthly_actions') IS NOT NULL THEN
        EXECUTE 'DELETE FROM "monthly_actions"';
      END IF;
      IF to_regclass('public.comments') IS NOT NULL THEN
        EXECUTE 'DELETE FROM "comments"';
      END IF;
      IF to_regclass('public.tasks') IS NOT NULL THEN
        EXECUTE 'DELETE FROM "tasks"';
      END IF;
      IF to_regclass('public.cohort_memberships') IS NOT NULL THEN
        EXECUTE 'DELETE FROM "cohort_memberships"';
      END IF;
      IF to_regclass('public.cohorts') IS NOT NULL THEN
        EXECUTE 'DELETE FROM "cohorts"';
      END IF;
      IF to_regclass('public.packs') IS NOT NULL THEN
        EXECUTE 'DELETE FROM "packs"';
      END IF;
    END
    $cleanup$
  `;

  await prisma.user.deleteMany();
}

async function seedWepacker() {
  await resetWepackerFixtures();

  const platformPasswordHash = hashSync("wepack2026", 12);

  // `User` remains the physical authentication identity in Release A. Each
  // fixture represents one Person/WEPACker; relationship roles are explicit
  // graph edges rather than inferred from account role or shared delivery.
  const ana = await prisma.user.create({
    data: {
      name: "Ana Martins",
      email: "ana@example.com",
      passwordHash: platformPasswordHash,
      role: "member",
      onboarded: true,
      bio: "Violinista e compositora. Formada no Conservatório de Braga.",
    },
  });

  const pedro = await prisma.user.create({
    data: {
      name: "Pedro Silva",
      email: "pedro@example.com",
      passwordHash: platformPasswordHash,
      role: "member",
      onboarded: true,
      bio: "Pianista e professor de música.",
    },
  });

  const maria = await prisma.user.create({
    data: {
      name: "Maria Costa",
      email: "maria@example.com",
      passwordHash: platformPasswordHash,
      role: "member",
      onboarded: true,
      bio: "Cantora lírica e performer.",
    },
  });

  await prisma.user.create({
    data: {
      name: "João Ferreira",
      email: "joao@example.com",
      phone: "+351 912 345 678",
      role: "member",
      inviteToken: "00000000-0000-4000-8000-000000000001",
      inviteExpiresAt: new Date("2026-08-30T00:00:00Z"),
      onboarded: false,
    },
  });

  await prisma.user.create({
    data: {
      name: "Sofia Rocha",
      email: "sofia@example.com",
      passwordHash: platformPasswordHash,
      role: "member",
      onboarded: false,
    },
  });

  const rui = await prisma.user.create({
    data: {
      name: "Rui Valdemar Santos",
      email: "rui@wepac.pt",
      passwordHash: platformPasswordHash,
      role: "member",
      onboarded: true,
      bio: "Mentor WEPAC.",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Admin WEPAC",
      email: "admin@wepac.pt",
      passwordHash: platformPasswordHash,
      role: "admin",
      onboarded: true,
    },
  });

  await prisma.agreement.createMany({
    data: [ana, pedro, maria, rui, admin].map((person) => ({
      userId: person.id,
      version: "1.0",
    })),
  });

  await prisma.stagePlacement.createMany({
    data: [ana, pedro, maria, rui].map((person) => ({
      userId: person.id,
      stage: "yup" as const,
      status: "active" as const,
      source: "explicit" as const,
    })),
  });

  const arts = await prisma.discipline.create({
    data: {
      slug: "arts",
      name: "Arts",
      description:
        "Serious artistic practice through which the Six Pillars are trained.",
    },
  });

  const cycle = await prisma.cycle.create({
    data: {
      slug: "arts-foundations-2026",
      name: "Arts Foundations 2026",
      description: "A time-bounded YUP Academy experience in Arts.",
      status: "active",
      stage: "yup",
      primaryDisciplineId: arts.id,
      createdById: admin.id,
      startsAt: new Date("2026-01-15T00:00:00Z"),
      endsAt: new Date("2026-12-15T00:00:00Z"),
      source: "explicit",
    },
  });

  await prisma.cycleEnrollment.createMany({
    data: [ana, pedro, maria].map((person) => ({
      cycleId: cycle.id,
      userId: person.id,
      status: "active" as const,
      source: "invitation" as const,
      invitedAt: new Date("2026-01-05T10:00:00Z"),
      joinedAt: new Date("2026-01-08T10:00:00Z"),
    })),
  });

  await prisma.cycleFacilitator.create({
    data: {
      cycleId: cycle.id,
      userId: rui.id,
      role: "lead",
      status: "active",
      source: "invitation",
      invitedAt: new Date("2026-01-02T10:00:00Z"),
      acceptedAt: new Date("2026-01-03T10:00:00Z"),
    },
  });

  const ruisPack = await prisma.pack.create({
    data: {
      slug: "ruis-pack",
      name: "Rui's Pack",
      description: "A real community of people who know they belong.",
      status: "active",
      source: "explicit",
      createdById: rui.id,
      personalOwnerId: rui.id,
      createdAt: new Date("2026-01-09T10:00:00Z"),
      activatedAt: new Date("2026-01-10T10:00:00Z"),
    },
  });

  await prisma.packMembership.createMany({
    data: [
      {
        packId: ruisPack.id,
        userId: rui.id,
        invitedById: rui.id,
        role: "owner",
        status: "active",
        source: "explicit",
        invitedAt: new Date("2026-01-09T10:00:00Z"),
        joinedAt: new Date("2026-01-09T10:00:00Z"),
      },
      {
        packId: ruisPack.id,
        userId: ana.id,
        invitedById: rui.id,
        role: "member",
        status: "active",
        source: "invitation",
        invitedAt: new Date("2026-01-09T11:00:00Z"),
        joinedAt: new Date("2026-01-10T10:00:00Z"),
      },
    ],
  });

  const mentorship = await prisma.mentorship.create({
    data: {
      mentorId: rui.id,
      menteeId: ana.id,
      invitedById: rui.id,
      status: "active",
      source: "invitation",
      invitedAt: new Date("2026-01-10T12:00:00Z"),
      mentorAcceptedAt: new Date("2026-01-10T12:00:00Z"),
      menteeAcceptedAt: new Date("2026-01-11T12:00:00Z"),
      activatedAt: new Date("2026-01-11T12:00:00Z"),
    },
  });

  await prisma.lifeMap.create({
    data: {
      userId: ana.id,
      whoIAm: "Sou violinista e compositora, com raízes clássicas.",
      whereIAm: "Estou a construir uma prática sustentável e intencional.",
      whereIGo: "Quero liderar projetos artísticos próprios.",
      whyIDo: "Acredito que a música transforma pessoas e comunidades.",
      commitments:
        "Praticar com intenção, cuidar do corpo e cumprir compromissos.",
    },
  });

  const trail = await prisma.trail.create({
    data: {
      userId: ana.id,
      title: "Build an original chamber project",
      purpose: "Turn artistic identity into a complete public work.",
      whyItMatters: "It integrates craft, voice and sustainable practice.",
      destination: "A premiered chamber programme with original repertoire.",
      areas: ["physical", "character", "intellectual", "social"],
    },
  });

  const strategicPlan = await prisma.strategicPlan.create({
    data: {
      userId: ana.id,
      quarter: "2026-Q1",
      longTermVision:
        "Lead original chamber projects with a sustainable artistic practice.",
      positioning:
        "Contemporary violinist and composer rooted in classical practice.",
      focusAreas: ["physical", "intellectual", "social"],
    },
  });

  const goal = await prisma.goal.create({
    data: {
      strategicPlanId: strategicPlan.id,
      scope: "annual",
      title: "Create an original artistic project",
      description: "Develop a solo concert with original repertoire.",
      successCriteria: "Complete programme and two confirmed performances.",
      deadline: "2026-12-31",
      status: "in_progress",
    },
  });

  await prisma.action.createMany({
    data: [
      {
        assigneeId: ana.id,
        createdById: ana.id,
        title: "Select repertoire for the original programme",
        origin: "plan",
        status: "in_progress",
        dueAt: new Date("2026-03-25T18:00:00Z"),
        strategicPlanId: strategicPlan.id,
        goalId: goal.id,
        trailId: trail.id,
        cycleId: cycle.id,
      },
      {
        assigneeId: ana.id,
        createdById: ana.id,
        title: "Write the artistic positioning statement",
        origin: "self",
        status: "pending",
        dueAt: new Date("2026-04-10T18:00:00Z"),
        trailId: trail.id,
      },
    ],
  });

  const individualSession = await prisma.session.create({
    data: {
      cycleId: cycle.id,
      mentorshipId: mentorship.id,
      organizerId: rui.id,
      kind: "recon",
      scheduledAt: new Date("2026-01-22T10:00:00Z"),
      durationMinutes: 60,
      status: "completed",
      discussionPoints: "Identity, expectations and personal direction",
      attendees: {
        create: {
          userId: ana.id,
          attended: true,
          privateNote: "Organizer-only fixture note.",
          sharedNote: "Clarify the next artistic experiment.",
          sharedNotePublished: true,
          outcome: "A first bounded Trail and next Action were identified.",
        },
      },
    },
  });

  await prisma.action.create({
    data: {
      assigneeId: ana.id,
      createdById: ana.id,
      title: "Draft the first artistic experiment",
      origin: "session_proposal",
      status: "pending",
      dueAt: new Date("2026-02-05T18:00:00Z"),
      trailId: trail.id,
      sourceSessionId: individualSession.id,
      cycleId: cycle.id,
      mentorshipId: mentorship.id,
    },
  });

  await prisma.session.create({
    data: {
      cycleId: cycle.id,
      organizerId: rui.id,
      kind: "checkpoint",
      scheduledAt: new Date("2026-02-05T14:00:00Z"),
      durationMinutes: 90,
      status: "completed",
      discussionPoints: "Practice, collaboration and feedback",
      attendees: {
        create: [ana, pedro, maria].map((person) => ({
          userId: person.id,
          attended: true,
        })),
      },
    },
  });

  await prisma.session.create({
    data: {
      mentorshipId: mentorship.id,
      organizerId: rui.id,
      kind: "checkpoint",
      scheduledAt: new Date("2026-08-26T10:00:00Z"),
      durationMinutes: 60,
      status: "scheduled",
      attendees: { create: { userId: ana.id } },
    },
  });

  const conversation = await prisma.conversation.create({ data: {} });
  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: conversation.id, userId: ana.id },
      { conversationId: conversation.id, userId: rui.id },
    ],
  });
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      userId: ana.id,
      body: "Partilho o rascunho quando estiver pronto.",
    },
  });

  return { arts, cycle, ruisPack, mentorship };
}

async function seedTicketing() {
  const departments = [
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

  const departmentIds: Record<string, string> = {};
  for (const department of departments) {
    const row = await prisma.department.upsert({
      where: { slug: department.slug },
      update: {
        name: department.name,
        description: department.description,
      },
      create: department,
    });
    departmentIds[department.slug] = row.id;
  }

  const capelaViva = await prisma.brand.upsert({
    where: { slug: "capela-viva" },
    update: {
      name: "Capela Viva",
      departmentId: departmentIds["arte-a-capela"],
    },
    create: {
      slug: "capela-viva",
      name: "Capela Viva",
      departmentId: departmentIds["arte-a-capela"],
    },
  });

  const ticketingPasswordHash = hashSync(
    process.env.SEED_ADMIN_PASSWORD ?? "admin123",
    12,
  );
  const ticketingAdmin = await prisma.ticketingAdmin.upsert({
    where: { email: "admin@wepac.pt" },
    update: { name: "Admin WEPAC" },
    create: {
      email: "admin@wepac.pt",
      name: "Admin WEPAC",
      passwordHash: ticketingPasswordHash,
    },
  });

  const event = await prisma.event.upsert({
    where: { slug: "ananda-roda-iberia-antiga-2026-04-23" },
    update: {},
    create: {
      slug: "ananda-roda-iberia-antiga-2026-04-23",
      title: "A Voz da Ibéria Antiga",
      subtitle: "Ananda Roda · vihuela",
      description:
        "Uma jornada sonora pelos séculos XV e XVI da Península Ibérica.",
      departmentId: departmentIds["arte-a-capela"],
      brandId: capelaViva.id,
      venue: "Capela do Hospital de Jesus",
      address: "Travessa da Arrochela, Lisboa",
      startsAt: new Date("2026-04-23T19:30:00+01:00"),
      doorsAt: new Date("2026-04-23T19:00:00+01:00"),
      durationMinutes: 60,
      capacity: 80,
      status: "published",
      createdById: ticketingAdmin.id,
    },
  });

  if ((await prisma.ticketTier.count({ where: { eventId: event.id } })) === 0) {
    await prisma.ticketTier.createMany({
      data: [
        {
          eventId: event.id,
          name: "Bilhete",
          description: "Entrada regular — pagamento à porta.",
          priceCents: 1200,
          sortOrder: 0,
        },
        {
          eventId: event.id,
          name: "Amigo WEPAC",
          description: "Patrono — apoio directo ao programa Capela Viva.",
          priceCents: 2500,
          sortOrder: 1,
        },
      ],
    });
  }

  return event;
}

async function main() {
  const target = await seedWepacker();
  const event = await seedTicketing();

  console.log("Seed completed successfully.");
  console.log(
    `Target fixtures: ${target.arts.slug} · ${target.cycle.slug} · ${target.ruisPack.slug}`,
  );
  console.log(`Accepted Mentorship: ${target.mentorship.id}`);
  console.log(`Ticketing fixture: ${event.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
