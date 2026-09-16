/**
 * Idempotent seed for the Bilheteira WEPAC fixtures.
 *
 * Safe to run in production — uses upserts only. Does NOT touch Artista Alpha
 * (users, evaluations, etc.) like the main prisma/seed.ts does.
 *
 * Usage (local):
 *   DATABASE_URL=... npx tsx scripts/seed-bilheteira.ts
 *
 * Usage (remote):
 *   ssh deploy@77.42.82.10 "set -a && source /var/www/wepac/shared/.env.production \
 *     && set +a && cd /var/www/wepac/current && npx tsx scripts/seed-bilheteira.ts"
 */

import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ===== Departments =====
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
    console.log(`· department: ${d.slug}`);
  }

  // ===== Brands =====
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
  console.log(`· brand: capela-viva`);

  // ===== Admin seed (only if none exist — first-run bootstrap) =====
  const existingAdmins = await prisma.ticketingAdmin.count();
  let seedAdmin = await prisma.ticketingAdmin.findUnique({
    where: { email: "admin@wepac.pt" },
  });

  if (existingAdmins === 0) {
    seedAdmin = await prisma.ticketingAdmin.create({
      data: {
        email: "admin@wepac.pt",
        name: "Admin WEPAC",
        passwordHash: hashSync("password123", 10),
      },
    });
    console.log(
      `· admin (bootstrap): admin@wepac.pt / password123 — CHANGE IMMEDIATELY`
    );
  } else {
    console.log(`· admin: ${existingAdmins} already exist, skipping bootstrap`);
    // Ensure at least one exists as createdById anchor for the seed event
    if (!seedAdmin) {
      seedAdmin = await prisma.ticketingAdmin.findFirst();
    }
  }

  if (!seedAdmin) {
    throw new Error("No admin available to anchor seed event");
  }

  // ===== Event: Ananda Roda (Capela Viva) =====
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
  console.log(`· event: ${ananda.slug}`);

  // ===== Tiers (only if event has none) =====
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
    console.log(`· tiers: Bilhete (12€) + Amigo WEPAC (0€)`);
  } else {
    console.log(`· tiers: ${existingTiers} already present, skipping`);
  }

  console.log("\nBilheteira seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
