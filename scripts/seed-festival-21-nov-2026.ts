/**
 * Idempotent setup of the Festival «Quem é o Teu Mestre?» (21 Nov 2026) in the
 * ticketing: the event as a landing and its tickets. Matches tiers by name, so
 * re-running updates copy and settings without touching sales.
 *
 * The event is created as a DRAFT. Publish it from the admin after review.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/seed-festival-21-nov-2026.ts
 * Artist phases have no quantity: the team opens the next phase by closing
 * the current one in the admin (Estado → «Vendas encerradas» or «Esgotado»).
 * Options (env):
 *   CAPACITY                         event capacity, shared by every ticket (default 120)
 */

import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG = "festival-quem-e-o-teu-mestre-2026";
// 8 Nov 23:59 Lisbon (winter time, UTC+0): candidaturas close, artist sales stop.
const ARTIST_SALES_END = new Date("2026-11-08T23:59:00Z");
const qty = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

const EVENT_DESCRIPTION = `Ninguém aprende uma arte sozinho. Houve sempre alguém que corrigiu um gesto, cortou uma frase, mostrou para onde olhar. E cada artista acaba por chegar às mesmas perguntas: o que vou passar a quem vem a seguir? E em que condições vou conseguir continuar a criar?

A 21 de novembro, a WEPAC – Companhia de Artes dedica um dia inteiro a essas perguntas. Um festival sobre transmissão: quem nos ensinou, o que escolhemos passar aos outros e o que é preciso para que a criação continue.

**Aprender com quem faz.** Mestres de artes diferentes trabalham em palco com artistas selecionados: palavra e teatro, corpo e música, artes visuais e cinema. Experimentam, discutem escolhas, mostram como pensam. Ao fim da tarde, arte de rua, luz e fotografia juntam-se sobre o painel que o público foi preenchendo ao longo do dia com os nomes dos seus mestres.

**Discutir o que merece continuar.** Um debate aberto sobre duas artes postas à prova: a tauromaquia, contestada, e o barroco, sem público natural no nosso tempo. Falantes de mirandês, barranquenho, minderico, dos falares dos Açores e da Madeira e de crioulos de base portuguesa mostram como uma língua passa de boca em boca, e o que a pode fazer desaparecer.

**Perceber como se sustenta uma vida na arte.** Uma conversa prática sobre carreira, contratos e fiscalidade, com quem vive da arte e com quem lhe faz as contas. Uma mesa sobre quem mantém a cultura viva entre dois espetáculos. E uma sessão final em que a sala diz o que quer ver acontecer na cultura em Portugal.

**A noite é para quem nos ensinou.** Às 19h30, concerto de violoncelo em homenagem a Paulo Gaio Lima, mestre de gerações de violoncelistas, entrega do apoio à Associação Candeia e ao Hospital de Jesus e Prémios WEPAC ’26 — Edição Orpheu: nomes da cultura portuguesa recebem um prémio e, no mesmo palco, cada um passa o testemunho, entregando o prémio Nova Geração Orpheu a um jovem artista que escolheu.

**Se és artista,** o dia também é teu para mostrar trabalho. Candidatas um trabalho teu, entras na Montra do Festival, tens prioridade na marcação dos encontros do almoço com mestres, programadores, produtores, agentes, associações e decisores públicos da cultura e podes ser escolhido para trabalhar em palco com mestres.

**Se vens para ver e ouvir,** escolhe como: o festival inteiro, do primeiro mestre em palco à última conversa sobre o futuro da cultura, com a noite incluída; ou só a noite, para o concerto de homenagem e os Prémios Orpheu, sozinho, a dois ou em família.

**Se vens com a tua escola, turma ou associação,** há bilhetes de grupo para viverem o festival juntos e, quem quiser, apresentar um trabalho seu.

**Se programas, produzes, contratas ou decides apoios à criação artística,** podes pedir acreditação como key player da cultura, sujeita a validação, para conhecer os artistas e os trabalhos da Montra.`;

const ARTIST_DESCRIPTION = `**Apresenta o teu trabalho. Aprende com quem faz.**

O Bilhete Artista dá-te o festival inteiro (oficinas com mestres, o debate sobre o que merece continuar, as línguas e falares menos ouvidos, a conversa sobre como se vive da arte, a sessão final) e o concerto com os Prémios WEPAC ’26 — Edição Orpheu às 19h30. E dá-te o direito de candidatar um trabalho teu.

Depois da compra recebes o link da candidatura. Podes candidatar texto, cena, coreografia, música, imagem, filme, fotografia ou luz.

Com a candidatura:

- o teu trabalho entra na Montra do Festival, uma página online com o trabalho, o nome e o contacto de cada candidato, mostrada aos programadores, produtores e responsáveis culturais presentes e divulgada ao público no próprio dia;
- tens prioridade na marcação dos encontros do almoço com mestres, programadores, produtores, agentes, associações e decisores públicos da cultura, conforme a disponibilidade de horários;
- podes ser escolhido como finalista, para te sentares à mesa do mestre durante o almoço e ouvires os seus comentários sobre o teu trabalho;
- ou como selecionado, para trabalhares a tua obra em palco com mestres (experimentar, discutir escolhas, ensaiar alternativas) e receberes o vídeo da sessão.`;

const ARTIST_EMAIL_NOTE = `Olá {{nome}},

O teu bilhete inclui o direito de candidatar um trabalho teu ao festival. Vamos enviar-te por email as instruções da candidatura, com o teu número de bilhete ({{bilhete}}) já associado.`;


// ---------- English (shown on /en) ----------

const EVENT_DESCRIPTION_EN = `Nobody learns an art alone. There was always someone who corrected a gesture, cut a sentence, showed where to look. And every artist ends up asking the same questions: what will I pass on to those who come next? And under what conditions will I be able to keep creating?

On 21 November, WEPAC – Companhia de Artes devotes a whole day to those questions. A festival about transmission: who taught us, what we choose to pass on, and what it takes for creation to go on.

**Learn from those who make.** Masters of different arts work on stage with selected artists: word and theatre, body and music, visual arts and cinema. They experiment, discuss choices, show how they think. In the late afternoon, street art, light and photography come together on the panel the audience has been filling all day with the names of their masters.

**Discuss what deserves to continue.** An open debate on two arts put to the test: bullfighting, contested, and the baroque, without a natural audience in our time. Speakers of Mirandese, Barranquenho, Minderico, the Azores and Madeira dialects and Portuguese-based creoles show how a language passes from mouth to mouth, and what can make it disappear.

**Understand how a life in the arts is sustained.** A practical conversation on career, contracts and tax, with people who live from the arts and people who do their accounts. A panel on who keeps culture alive between two shows. And a closing session where the room says what it wants to see happen in culture in Portugal.

**The evening is for those who taught us.** At 7:30 pm, a cello concert in tribute to Paulo Gaio Lima, master of generations of cellists, the handover of support to Associação Candeia and Hospital de Jesus, and the WEPAC ’26 Awards — Orpheu Edition: figures of Portuguese culture receive an award and, on the same stage, each one passes the baton, handing the New Generation Orpheu award to a young artist of their choice.

**If you are an artist,** the day is also yours to show your work. You submit a piece, enter the Festival Showcase, get priority booking for the lunch meetings with masters, programmers, producers, agents, associations and public decision-makers in culture, and may be chosen to work on stage with masters.

**If you come to watch and listen,** choose how: the whole festival, from the first master on stage to the last conversation about the future of culture, with the evening included; or just the evening, for the tribute concert and the Orpheu Awards, alone, as a couple or with family.

**If you come with your school, class or association,** there are group tickets to experience the festival together and, for anyone who wants to, to present their own work.

**If you programme, produce, hire or decide on support for artistic creation,** you can request accreditation as a culture key player, subject to approval, to meet the artists and the works in the Showcase.`;

const ARTIST_DESCRIPTION_EN = `**Present your work. Learn from those who make.**

The Artist Ticket gives you the whole festival (workshops with masters, the debate on what deserves to continue, the less-heard languages and dialects, the conversation on living from the arts, the closing session) and the concert with the WEPAC ’26 Awards — Orpheu Edition at 7:30 pm. And it gives you the right to submit a piece of your own.

After purchase you receive the submission link. You can submit text, a scene, choreography, music, image, film, photography or light.

With your submission:

- your work enters the Festival Showcase, an online page with the work, name and contact of each applicant, shown to the programmers, producers and cultural decision-makers present and published on the day;
- you get priority booking for the lunch meetings with masters, programmers, producers, agents, associations and public decision-makers in culture, subject to availability;
- you may be chosen as a finalist, to sit at the master's table at lunch and hear their comments on your work;
- or as a selected artist, to work on your piece on stage with masters (experimenting, discussing choices, trying alternatives) and receive the video of the session.`;

const TIER_EN: Record<string, { name: string; description: string; lockedNote?: string; ctaLabel?: string }> = {
  "Festival – Bilhete Artista (Early Bird)": { name: "Festival – Artist Ticket (Early Bird)", description: ARTIST_DESCRIPTION_EN },
  "Festival – Bilhete Artista (Second Wave)": {
    name: "Festival – Artist Ticket (Second Wave)",
    description: ARTIST_DESCRIPTION_EN,
    lockedNote: "Opens when the Early Bird closes.",
  },
  "Festival – Bilhete Artista (Last Call)": {
    name: "Festival – Artist Ticket (Last Call)",
    description: ARTIST_DESCRIPTION_EN,
    lockedNote: "Opens when the Second Wave closes.",
  },
  "Festival – Bilhete Público": {
    name: "Festival – General Ticket",
    description: `**See, hear and discuss the whole festival.**

Masters working on stage with artists: word and theatre, body and music, visual arts and cinema. A debate on what deserves to continue, from bullfighting to the baroque. Less-heard languages and dialects, spoken by those who speak them. A frank conversation on living from the arts and a panel on who keeps culture alive between two shows. And, at the end, the session on the future of culture, where your voice counts.

Includes the concert and the WEPAC ’26 Awards — Orpheu Edition at 7:30 pm.

Does not include a submission or a place in the Showcase. If you want to present your own work, buy the Artist Ticket.`,
  },
  "Festival – Pack Escola": {
    name: "Festival – School Pack",
    description: `**The whole festival for the class.**

A day to watch masters at work on stage, hear a serious debate on what deserves to continue, discover languages and dialects that are rarely heard and understand how people live from the arts in Portugal. And the concert with the WEPAC ’26 Awards — Orpheu Edition at 7:30 pm.

Minimum 10 seats, counting students and teachers; you choose the number of seats at checkout. Does not include a submission or a place in the Showcase. Anyone who wants to present their own work should buy the Artist Ticket.`,
  },
  "Festival – Pack Associação": {
    name: "Festival – Association Pack",
    description: `**Bring your people.**

For associations, collectives and groups that make culture every day. The whole festival: masters at work on stage, the debate on what deserves to continue, the less-heard languages and dialects, the panel on who keeps culture alive between two shows and the closing session on the future of culture, where your voice counts. And the concert with the WEPAC ’26 Awards — Orpheu Edition at 7:30 pm.

Minimum 10 seats; you choose the number of seats at checkout. Does not include a submission or a place in the Showcase. Anyone who wants to present their own work should buy the Artist Ticket.`,
  },
  "Festival – Acreditação Key Players da Cultura": {
    name: "Festival – Culture Key Players Accreditation",
    ctaLabel: "Request accreditation",
    description: `**Meet the artists and the works that come next.**

For those attending in the role of programming, hiring, producing or deciding on support for artistic creation: programmers, producers, agents, heads of cultural organisations and institutions and of public cultural administration. If you are also an artist and come in that role, you can request this accreditation.

You send the request with your name, your organisation or institution and your role. WEPAC reviews every request and replies by email; entry is only guaranteed after approval.

With the accreditation you get access to the Festival Showcase before it is published, can book meetings with applicant artists during lunch, subject to availability, and follow the whole festival and the concert with the WEPAC ’26 Awards — Orpheu Edition at 7:30 pm.

Does not include an artistic submission or a place in the Showcase. To present your own work, you need the Artist Ticket.`,
  },
  "Festival – Bilhete Concerto": {
    name: "Festival – Concert Ticket",
    description: `**An evening for those who taught us.**

Cello concert in tribute to Paulo Gaio Lima, handover of support to Associação Candeia and Hospital de Jesus, and the WEPAC ’26 Awards — Orpheu Edition: figures of Portuguese culture receive an award and, on the same stage, each one passes the baton, handing the New Generation Orpheu award to a young artist of their choice. In an 18th-century chapel, at 7:30 pm.`,
  },
  "Festival – Bilhete Concerto Patrono": {
    name: "Festival – Patron Concert Ticket",
    description: `**So that this evening happens again.**

A seat at the cello concert in tribute to Paulo Gaio Lima and the WEPAC ’26 Awards — Orpheu Edition, at 7:30 pm. The difference from the standard ticket supports the next season in the chapel.`,
  },
  "Festival – Bilhete Concerto a Dois": {
    name: "Festival – Concert Ticket for Two",
    description: `**Bring the one who taught you.**

Two seats for the tribute concert and the WEPAC ’26 Awards — Orpheu Edition, at 7:30 pm. Bring your teacher, your mother, the friend who showed you the way, or someone you are now showing it to.`,
  },
  "Festival – Bilhete Concerto Família": {
    name: "Festival – Family Concert Ticket",
    description: `**Show them where music comes from.**

Four seats for the tribute concert and the WEPAC ’26 Awards — Orpheu Edition, at 7:30 pm, in a chapel where the youngest can see a cello up close. Children up to 6 on a lap don't need a ticket.`,
  },
};

type TierSeed = Omit<Prisma.TicketTierUncheckedCreateInput, "eventId" | "sortOrder">;

function tiers(): TierSeed[] {
  return [
    {
      name: "Festival – Bilhete Artista (Early Bird)",
      kind: "phase",
      phaseGroup: "artista",
      phaseOrder: 1,
      priceCents: 3500,
      referencePriceCents: 7500,
      quantity: null,
      salesEndAt: ARTIST_SALES_END,
      section: "Festival · dia e noite",
      featured: true,
      description: ARTIST_DESCRIPTION,
      emailNote: ARTIST_EMAIL_NOTE,
    },
    {
      name: "Festival – Bilhete Artista (Second Wave)",
      kind: "phase",
      phaseGroup: "artista",
      phaseOrder: 2,
      priceCents: 5000,
      referencePriceCents: 7500,
      quantity: null,
      salesEndAt: ARTIST_SALES_END,
      lockedNote: "Abre quando o Early Bird fechar.",
      waitlistEnabled: true,
      section: "Festival · dia e noite",
      description: ARTIST_DESCRIPTION,
      emailNote: ARTIST_EMAIL_NOTE,
    },
    {
      name: "Festival – Bilhete Artista (Last Call)",
      kind: "phase",
      phaseGroup: "artista",
      phaseOrder: 3,
      priceCents: 7500,
      salesEndAt: ARTIST_SALES_END,
      lockedNote: "Abre quando o Second Wave fechar.",
      waitlistEnabled: true,
      section: "Festival · dia e noite",
      description: ARTIST_DESCRIPTION,
      emailNote: ARTIST_EMAIL_NOTE,
    },
    {
      name: "Festival – Bilhete Público",
      kind: "single",
      priceCents: 2500,
      section: "Festival · dia e noite",
      description: `**Vê, ouve e discute o festival inteiro.**

Mestres a trabalhar em palco com artistas: palavra e teatro, corpo e música, artes visuais e cinema. Um debate sobre o que merece continuar, da tauromaquia ao barroco. Línguas e falares menos ouvidos, ditos por quem os fala. Uma conversa franca sobre como se vive da arte e uma mesa sobre quem mantém a cultura viva entre dois espetáculos. E, no fim, a sessão sobre o futuro da cultura, onde a tua voz conta.

Inclui o concerto e os Prémios WEPAC ’26 — Edição Orpheu às 19h30.

Não inclui candidatura nem presença na Montra. Se quiseres apresentar um trabalho teu, deves comprar o Bilhete Artista.`,
    },
    {
      name: "Festival – Pack Escola",
      kind: "group",
      priceCents: 1500,
      minSeats: 10,
      hideUnitPrice: true,
      section: "Grupos",
      description: `**O festival inteiro para a turma.**

Um dia para ver mestres a trabalhar em palco, ouvir um debate a sério sobre o que merece continuar, conhecer línguas e falares que quase não se ouvem e perceber como se vive da arte em Portugal. E o concerto com os Prémios WEPAC ’26 — Edição Orpheu às 19h30.

Mínimo de 10 lugares, contando alunos e professores; escolhes o número de lugares na compra. Não inclui candidatura nem presença na Montra. Quem quiser apresentar um trabalho seu deve comprar o Bilhete Artista.`,
    },
    {
      name: "Festival – Pack Associação",
      kind: "group",
      priceCents: 1500,
      minSeats: 10,
      hideUnitPrice: true,
      section: "Grupos",
      description: `**Tragam a vossa gente.**

Para associações, coletividades e grupos que fazem cultura todos os dias. O festival inteiro: mestres a trabalhar em palco, o debate sobre o que merece continuar, as línguas e falares menos ouvidos, a mesa sobre quem mantém a cultura viva entre dois espetáculos e a sessão final sobre o futuro da cultura, onde a vossa voz conta. E o concerto com os Prémios WEPAC ’26 — Edição Orpheu às 19h30.

Mínimo de 10 lugares; escolhes o número de lugares na compra. Não inclui candidatura nem presença na Montra. Quem quiser apresentar um trabalho seu deve comprar o Bilhete Artista.`,
    },
    {
      name: "Festival – Acreditação Key Players da Cultura",
      kind: "request",
      priceCents: 0,
      quantity: null,
      ctaLabel: "Pedir acreditação",
      section: "Acreditação",
      description: `**Conhece os artistas e os trabalhos que vêm a seguir.**

Para quem vem ao festival na função de programar, contratar, produzir ou decidir apoios à criação artística: programadores, produtores, agentes, responsáveis de estruturas e instituições culturais e da administração pública da cultura. Se também és artista e vens nessa função, podes pedir esta acreditação.

Fazes o pedido com o teu nome, a estrutura ou instituição onde trabalhas e a tua função. A WEPAC analisa cada pedido e responde por email; a entrada só fica garantida depois da validação.

Com a acreditação acedes à Montra do Festival antes de ser divulgada ao público, podes marcar encontros com artistas candidatos durante o almoço, conforme a disponibilidade de horários, e acompanhas o festival inteiro e o concerto com os Prémios WEPAC ’26 — Edição Orpheu às 19h30.

Não inclui candidatura artística nem presença na Montra. Para apresentar um trabalho teu, precisas do Bilhete Artista.`,
    },
    {
      name: "Festival – Bilhete Concerto",
      kind: "single",
      priceCents: 1000,
      section: "Só o concerto · 19h30",
      description: `**Uma noite para quem nos ensinou.**

Concerto de violoncelo em homenagem a Paulo Gaio Lima, entrega do apoio à Associação Candeia e ao Hospital de Jesus e Prémios WEPAC ’26 — Edição Orpheu: nomes da cultura portuguesa recebem um prémio e, no mesmo palco, cada um passa o testemunho, entregando o prémio Nova Geração Orpheu a um jovem artista que escolheu. Numa capela do século XVIII, às 19h30.`,
    },
    {
      name: "Festival – Bilhete Concerto Patrono",
      kind: "single",
      priceCents: 1800,
      section: "Só o concerto · 19h30",
      description: `**Para que esta noite volte a acontecer.**

Um lugar no concerto de violoncelo em homenagem a Paulo Gaio Lima e nos Prémios WEPAC ’26 — Edição Orpheu, às 19h30. A diferença para o bilhete normal sustenta a próxima temporada na capela.`,
    },
    {
      name: "Festival – Bilhete Concerto a Dois",
      kind: "bundle",
      seatsPerUnit: 2,
      priceCents: 1500,
      section: "Só o concerto · 19h30",
      description: `**Traz quem te ensinou.**

Dois lugares para o concerto de violoncelo em homenagem a Paulo Gaio Lima e os Prémios WEPAC ’26 — Edição Orpheu, às 19h30. Para levar o professor, a mãe, o amigo que te mostrou o caminho, ou alguém a quem o estás a mostrar.`,
    },
    {
      name: "Festival – Bilhete Concerto Família",
      kind: "bundle",
      seatsPerUnit: 4,
      priceCents: 2000,
      section: "Só o concerto · 19h30",
      description: `**Mostra-lhes de onde vem a música.**

Quatro lugares para o concerto de violoncelo em homenagem a Paulo Gaio Lima e os Prémios WEPAC ’26 — Edição Orpheu, às 19h30, numa capela onde os mais novos veem um violoncelo de perto. Crianças até aos 6 anos ao colo não pagam bilhete.`,
    },
  ];
}

async function main() {
  const department = await prisma.department.findUnique({ where: { slug: "arte-a-capela" } });
  if (!department) throw new Error("Department arte-a-capela not found (run scripts/seed-bilheteira.ts first).");
  const brand = await prisma.brand.findUnique({ where: { slug: "capela-viva" } });

  const eventData = {
    title: "Festival Quem é o Teu Mestre?",
    subtitle: "Um dia sobre quem nos ensina, o que escolhemos passar e como a criação continua.",
    description: EVENT_DESCRIPTION,
    departmentId: department.id,
    brandId: brand?.id ?? null,
    venue: "Capela do Hospital de Jesus",
    address: "Travessa da Arrochela 2, 1200-032 Lisboa",
    // 21 Nov is winter time in Lisbon (UTC+0).
    startsAt: new Date("2026-11-21T10:00:00Z"),
    durationMinutes: 11 * 60,
    // One shared capacity for the whole event; no per-ticket limits.
    capacity: qty("CAPACITY", 120),
    seoDescription:
      "Festival da WEPAC – Companhia de Artes a 21 de novembro na Capela do Hospital de Jesus, Lisboa: mestres em palco, debate, línguas, como se vive da arte e, às 19h30, concerto e Prémios WEPAC ’26 — Edição Orpheu.",
    featured: true,
    // JPEG on purpose: the cover also goes into confirmation emails.
    coverImage: "/images/eventos/quem-e-o-teu-mestre/hero-duo.jpg",
    ogImage: "/images/eventos/quem-e-o-teu-mestre/partilha-duo.jpg",
    // Campaign v2, variant D (duo), with the v4 schedule (19h30 evening).
    theme: {
      mode: "dark",
      accent: "#E04E2F",
      titleStyle: "condensed",
      heroTitle: "Quem é|o teu|mestre?",
      eyebrow: "FESTIVAL · WEPAC",
      tagline: "Um encontro para aprender, juntar as artes e cuidar do que as sustenta.",
      heroImage: "/images/eventos/quem-e-o-teu-mestre/hero-duo.webp",
      schedule: [
        { time: "10h–18h30", label: "Festival" },
        { time: "19h30", label: "Concerto de homenagem a Paulo Gaio Lima" },
        // Same hour: the prizes, with their edition name directly under them.
        { time: "", label: "Prémios WEPAC ’26", highlight: "Edição Orpheu" },
      ],
    } as Prisma.InputJsonValue,
    translations: {
      "en-US": {
        title: "Who Is Your Master? Festival",
        subtitle: "A day about who teaches us, what we choose to pass on and how creation goes on.",
        description: EVENT_DESCRIPTION_EN,
        seoDescription:
          "WEPAC – Companhia de Artes festival on 21 November at the Hospital de Jesus Chapel, Lisbon: masters on stage, debate, languages, living from the arts and, at 7:30 pm, concert and WEPAC ’26 Awards — Orpheu Edition.",
        heroTitle: "Who is|your|master?",
        eyebrow: "FESTIVAL · WEPAC",
        tagline: "A gathering to learn, bring the arts together and care for what sustains them.",
        schedule: [
          { time: "10am–6:30pm", label: "Festival" },
          { time: "7:30pm", label: "Tribute concert to Paulo Gaio Lima" },
          { time: "", label: "WEPAC ’26 Awards", highlight: "Orpheu Edition" },
        ],
        program: [
          { time: "10:00", title: "Opening · Who is your master?" },
          { time: "10:10", title: "Round table · What we receive from a master" },
          { time: "10:45", title: "Joint workshop · Word and theatre" },
          { time: "11:30", title: "Debate · What deserves to continue?" },
          { time: "12:15", title: "Talk and demonstration · Less-heard languages and dialects" },
          { time: "12:45", title: "Lunch · meetings with programmers, producers and masters" },
          { time: "14:00", title: "Practical conversation · How is an artistic life sustained?" },
          { time: "14:45", title: "Joint workshop · Body and music" },
          { time: "15:20", title: "Joint workshop · Visual arts and cinema" },
          { time: "16:05", title: "Round table · Who keeps culture alive between two shows?" },
          { time: "17:05", title: "Demonstration · Street art, light and photography" },
          { time: "17:40", title: "Closing session · What we do next" },
          { time: "19:30", title: "Tribute concert and WEPAC ’26 Awards — Orpheu Edition" },
        ],
      },
    } as Prisma.InputJsonValue,
    program: [
      { time: "10h00", title: "Abertura · Quem é o teu mestre?" },
      { time: "10h10", title: "Mesa redonda · O que recebemos de um mestre" },
      { time: "10h45", title: "Oficina conjunta · Palavra e teatro" },
      { time: "11h30", title: "Debate · O que merece continuar?" },
      { time: "12h15", title: "Palestra com demonstração · Línguas e falares menos ouvidos" },
      { time: "12h45", title: "Almoço · encontros com programadores, produtores e mestres" },
      { time: "14h00", title: "Conversa prática · Como se sustenta uma vida artística?" },
      { time: "14h45", title: "Oficina conjunta · Corpo e música" },
      { time: "15h20", title: "Oficina conjunta · Artes visuais e cinema" },
      { time: "16h05", title: "Mesa redonda · Quem mantém a cultura viva entre dois espetáculos?" },
      { time: "17h05", title: "Demonstração · Arte de rua, luz e fotografia" },
      { time: "17h40", title: "Sessão final · O que fazemos a seguir" },
      { time: "19h30", title: "Concerto de homenagem e Prémios WEPAC ’26 — Edição Orpheu" },
    ] as Prisma.InputJsonValue,
  };

  const existing = await prisma.event.findUnique({ where: { slug: SLUG } });
  const event = existing
    ? await prisma.event.update({ where: { id: existing.id }, data: eventData })
    : await prisma.event.create({ data: { ...eventData, slug: SLUG, status: "draft" } });
  console.log(`· event ${existing ? "updated" : "created (draft)"}: ${event.slug}`);

  const current = await prisma.ticketTier.findMany({ where: { eventId: event.id } });
  const list = tiers();
  for (const [i, base] of list.entries()) {
    const en = TIER_EN[base.name];
    const t = en ? { ...base, translations: { "en-US": en } as Prisma.InputJsonValue } : base;
    const match = current.find((c) => c.name === t.name);
    if (match) {
      await prisma.ticketTier.update({ where: { id: match.id }, data: { ...t, sortOrder: i } });
      console.log(`  · tier updated: ${t.name}`);
    } else {
      await prisma.ticketTier.create({ data: { ...t, eventId: event.id, sortOrder: i } });
      console.log(`  · tier created: ${t.name}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
