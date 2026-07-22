// Clínica WEPAC — landing page copy, transcribed verbatim from the three-lens
// review board's synthesis (parent lens / clinical-ethics-and-regulation lens
// / positioning lens), scratchpad file `clinica-proposta.md`. The copy is the
// deliverable, not a starting point — do not paraphrase, reorder or restore
// anything the synthesis's "MUST NEVER SAY" list excludes. Portuguese copy is
// intentional (user-facing content); register is deliberately "você", not
// "tu" — a documented break from the rest of the site.

// ---------------------------------------------------------------------------
// TODO — pending founder decisions (synthesis section 6, "Questions for the
// founder"). Nothing below has been invented: every value the founder has not
// confirmed is either omitted from the rendered page or rendered only in the
// safe, generic form the synthesis itself already wrote. Update this file
// (and the corresponding block in src/app/clinica/page.tsx) once each item is
// confirmed — do not just delete the TODO, re-check the still-open ones too.
//
// LAUNCH BLOCKERS (page must not go live with these still open):
// 1. Entity & ERS registration/licensing. Confirms who legally operates the
//    Clínica and whether the words "clínica", "saúde mental" and "terapia"
//    may be used publicly at all before registration completes. Unlocks:
//    keeping (or having to strip) all clinical/health vocabulary sitewide.
// 2. Team roster — names, formação, profissão, número de cédula/ordem, and
//    the identified diretor técnico. Unlocks: the actual content of "Quem vai
//    estar na sala" (currently rendered with only the generic policy
//    paragraph, no fabricated names/bios).
// 3. V1 Lisbon address + opening week, confirmed. Unlocks: the address
//    mention in the closing block (Bloco 13) and any address-specific claim
//    in the hero.
// 4. Operator legal identification for the footer: nome da entidade, NIPC,
//    morada, diretor técnico, número de registo ERS e de licenciamento.
//    Unlocks: Bloco 14 (Rodapé) — currently rendered without any of these,
//    since none is confirmed and none should be guessed (the synthesis's own
//    section 6 Q1 floats the existing WEPAC NIPC only as one of two options
//    for the founder to choose between, not as a confirmed fact).
// 5. Legal review sign-off (health-law counsel) on: ERS typology/licensing
//    route for a hybrid pedagogical-clinical unit; whether the word
//    "clínica" in the trade name alone triggers the prestador-de-saúde
//    regime; regulated status (or not) of music therapy / psicomotricidade;
//    exact Código da Publicidade articles in play; scope of the criminal-
//    record-check requirement; digital consent age. Must clear before
//    publish regardless of what the copy says.
//
// OTHER PENDING ITEMS (page renders safely without them, each unlocks a
// specific addition once confirmed):
// 6. Dedicated Clínica phone/WhatsApp line. Until confirmed, the header
//    below reuses the WEPAC general contact number already public on
//    /contacto (+351 933 515 995) — a real, non-fabricated number, but not
//    a Clínica-dedicated line. Unlocks: swapping the header number for the
//    dedicated line (or, per the founder's own ruling, changing the CTA
//    architecture if no dedicated line ever exists).
// 7. Primeira conversa: gratuita ou paga, e se paga, qual o valor. Unlocks:
//    a price/free mention in Bloco 5 step 01, and — if free — promoting
//    that fact to the hero.
// 8. Aprovar oferecer a primeira conversa só com o pai/mãe, sem a criança ou
//    o jovem presente. Unlocks: the sentence in Bloco 4 ("Para quem é, e
//    para quem não é") — currently omitted, not rendered.
// 9. Preço da Avaliação Integral + Plano de Vida 0–24: número fixo ou tabela
//    por escalão. The synthesis's own copy currently reads "a partir de
//    350 €" (a definite floor price, not an approximate range — the format
//    the clinical veto explicitly allows); this is rendered as-is pending
//    the founder locking the final figure or replacing it with a tiered
//    table.
// 10. Comparticipação de seguros/subsistemas (ADSE, Multicare, Médis) — sim/
//    não, quais. Unlocks: an insurance-coverage line in Bloco 10 (pricing) —
//    currently not rendered, since no line about this exists yet to render
//    safely.
// 11. Real financial-aid/scholarship mechanism for the Clínica itself
//    (distinct from Passos Vibrantes' Fundo de Bolsas, which belongs to a
//    different programme). Unlocks: the "E se não puder pagar, diga-nos"
//    sentence in Bloco 10 — omitted per the synthesis's own instruction
//    ("não vai para o ar sem mecanismo real por trás").
// 12. Escola/pediatra/terapeuta coordination "mediante autorização escrita"
//    — confirm this is genuinely how the org will operate. The sentence is
//    already rendered (Bloco 5, step 05) as ordinary copy, not a placeholder
//    — this item just tracks that the founder must confirm operational
//    reality before launch.
// 13. Scope of V1 across the 0–24 range at actual launch (full range from
//    day one, or a narrower start?), and concretely what exists for an
//    18-month-old given Sounds of Childhood only starts at 3. Informational;
//    doesn't currently gate any rendered sentence.
// 14. Named specialised therapies and the credentialed staff who deliver
//    them. None are named in the current copy (per MUST NEVER SAY #11);
//    unlocks naming any specific therapy only once real and staffed.
// 15. Whether the Clínica issues reports/declarations usable by school or
//    SNS. Informational; would adjust wording in Bloco 8 ("O que não é") if
//    confirmed either way.
// 16. Internal referral/CPCJ safeguarding procedure — exists? Informational;
//    supports the reassurance already given in Bloco 4, no detail is
//    published either way.
// 17. Professional liability insurance for work with minors — contracted,
//    what scope. Informational, not published on the page itself.
// 18. Once the pre-contact CTA (below) is wired to a real capture mechanism
//    by whichever front owns that work: who answers, what SLA, where the
//    data is stored until the Clínica opens.
// 19. Real numeric cap on families accepted at opening, if any is ever
//    wanted. Not currently used — no scarcity language appears on this page
//    at all (see MUST NEVER SAY #18), and none should be added without a
//    real number from the founder.
// 20. wepac.pt/clinica inside the institutional site (current placement,
//    `src/app/clinica/page.tsx`) vs an autonomous sub-brand with its own
//    header, the way Arte à Capela has one. Affects the regulatory weight
//    the WEPAC brand carries publicly; not changed here without an explicit
//    decision.
// ---------------------------------------------------------------------------

// Dedicated Clínica line not confirmed (TODO 6 above) — reusing the real,
// already-public general WEPAC number from /contacto rather than fabricating
// a Clínica-specific one. Swap this for the dedicated line once confirmed.
export const phoneNumber = {
  display: "+351 933 515 995",
  href: "tel:+351933515995",
};

// TODO 3: confirmed Lisbon address, not yet available — intentionally absent.
export const lisbonAddress: string | null = null;

// TODO 7: free vs paid first conversation — not yet confirmed, so no price or
// "grátis" claim is rendered anywhere for it.
export const firstConversationIsFree: boolean | null = null;

export const openingWindow = "Lisboa, setembro de 2026";

export const emergencyBand = {
  heading: "Se está preocupado agora, não espere por nós.",
  body: "A Clínica abre em setembro de 2026, e uma preocupação com a saúde ou o desenvolvimento de uma criança não deve esperar por uma vaga nossa: o primeiro passo continua a ser o médico de família ou o pediatra. Em caso de urgência, ligue 112. Para aconselhamento de saúde não urgente, a Linha SNS 24 — 808 24 24 24 — está disponível todos os dias, a qualquer hora.",
};

// Bloco 3 — "Talvez esteja aqui por uma destas razões". Situations, never
// symptoms — a checklist of "warning signs" converts by amplifying anxiety.
export const situations: string[] = [
  "A escola disse-lhe alguma coisa sobre o seu filho e saiu de lá sem saber o que fazer com aquilo.",
  "Está há meses à espera de uma consulta. O tempo passa, e nada acontece.",
  "Já tem um diagnóstico. O que não tem é um caminho.",
  "Anda de terapia em terapia, de relatório em relatório, e é sempre a si que cabe explicar tudo outra vez desde o princípio.",
  "O seu filho já é adulto, ou quase, e fechou a porta do quarto — e disseram-lhe que agora está na fila errada.",
  "Ou não se passa nada de errado, e quer simplesmente acompanhar bem o crescimento do seu filho, com quem perceba do assunto.",
];

export const threeThingsFirst: string[] = [
  "Reparar não é exagerar. Quem vive com uma criança todos os dias vê coisas que nenhuma consulta de vinte minutos vê. Aqui, o que a mãe ou o pai notou é ponto de partida, não é ruído a descontar.",
  "Se lhe deram a entender que o problema está na forma como educa: não é essa a nossa leitura e não é assim que trabalhamos. Uma criança não é o resultado de uma técnica de pais. Também não vamos fingir que a família não conta — conta muito, e é por isso que trabalhamos convosco, com a mesma linguagem em casa e aqui. Trabalhar com a família é o contrário de a culpar.",
  "E não lhe vamos dizer que é urgente para o convencer a vir. Vamos dizer-lhe o que é possível fazer a seguir.",
];

// Bloco 4 — "Para quem é, e para quem não é". TODO 8: the "primeira conversa
// só com o pai/mãe" sentence is intentionally not included below — it is not
// approved yet.
export const whoItIsFor = {
  ageScope:
    "Dos 0 aos 24 anos. Até aos 18, quem decide e a quem falamos são os pais ou quem tem a responsabilidade parental. A partir dos 18, é o próprio jovem quem decide sobre o seu acompanhamento e sobre a sua informação — e isso muda a forma como trabalhamos, mas não fecha a porta.",
  notForUrgentCare:
    "Não somos um serviço de urgência nem de crise. Se há risco imediato, uma situação psiquiátrica aguda ou algo que precise de hospital, não somos o sítio certo — e dizemos-lho de imediato, com o encaminhamento que soubermos dar.",
};

// Bloco 5 — "O que acontece, por ordem". Each step carries its own limit in
// the same line and the same type size — never a separate small-print
// section at the bottom.
export const processSteps: { number: string; title: string; body: string }[] = [
  {
    number: "01",
    title: "A primeira conversa.",
    body: "Sentamo-nos consigo e ouvimos: o que reparou, quando começou, o que já tentou e o que já lhe disseram. Traga o que tiver — relatórios da escola, avaliações anteriores, o caderno onde foi apontando. Se não tiver nada, também não faz mal: começamos por si.",
  },
  {
    number: "02",
    title: "Avaliação Integral.",
    body: "Uma leitura feita em conjunto pela equipa pedagógica e pela equipa clínica: o que a criança já faz, onde tropeça e o que o contexto à volta dela lhe está a pedir. No fim há um retrato escrito, em português que se percebe, e uma conversa em que lho explicamos até estar claro. Um diagnóstico clínico só pode ser feito por um médico ou, na sua área, por um psicólogo inscrito na Ordem. A nossa avaliação não é isso, não o substitui nem o antecipa — e quando é isso que faz falta, dizemos-lho e encaminhamos.",
  },
  {
    number: "03",
    title: "Plano de Vida 0–24.",
    body: "Não é um prognóstico e não diz o que o seu filho vai ser. É o mapa do acompanhamento: o que se trabalha agora, com quem, com que frequência, o que fica para mais tarde, o que muda na escola e o que muda em casa — e como saberemos se está a servir de alguma coisa. Escrevemo-lo convosco, não sobre vocês. Revê-se, e pode ser interrompido a qualquer momento sem que tenha de explicar porquê.",
  },
  {
    number: "04",
    title: "O acompanhamento.",
    body: "Depois é semana a semana, individual ou em grupo pequeno, dentro da Pedagogia Easy Peasy que a WEPAC pratica há anos com crianças. Para os mais pequenos, muitas vezes a primeira coisa não é uma sessão terapêutica — é o Sounds of Childhood, um grupo de quatro a doze crianças a partir dos 3 anos onde se faz música, movimento e histórias durante 45 a 60 minutos. É educação musical, e é assim que a nomeamos. Há crianças para quem entrar por aí muda tudo.",
  },
  {
    number: "05",
    title: "Planos por Fase e Acompanhamento Anual.",
    body: "As crianças mudam e os planos ficam velhos depressa. Cada fase tem o seu plano, e uma vez por ano voltamos a olhar para tudo do princípio — inclusive para o que fizemos e não resultou.",
  },
];

export const processClosing = {
  boldLead: "A diferença não é o que fazemos. É ser tudo no mesmo sítio, pela mesma equipa.",
  body: "Quando uma família começa a procurar respostas, acaba quase sempre a fazer sozinha o trabalho mais difícil: ligar as pontas. Um profissional para uma coisa, outro para outra, cada um com o seu relatório, o seu horário e o seu vocabulário — e, no meio, os pais a transportar informação de uma sala para a outra. Aqui sai um plano, não uma coleção de pareceres. Se está numa lista de espera, mantenha o seu lugar: trabalhamos ao lado de quem já segue o seu filho e, se nos autorizar por escrito, falamos diretamente com essas pessoas.",
  closingLine: "Quando o seu filho tiver 15 anos, ainda vai haver aqui alguém que se lembra de como ele era aos 6.",
};

// Bloco 6 — "Não começamos pelo que falta". Six Pillars framing, quiet and
// small, one line each.
export const sixPillars: { label: string; body: string }[] = [
  { label: "Corpo", body: "o ritmo, o sono, a energia, a base da atenção." },
  { label: "Emoção", body: "o que sente e o que consegue fazer com isso." },
  { label: "Caráter", body: "os hábitos, a persistência, o terminar o que se começa." },
  { label: "Interioridade", body: "o silêncio, o sentido, o «para quê»." },
  { label: "Pensamento", body: "como aprende, como resolve, como imagina." },
  { label: "Relação", body: "quem o sustenta e a quem ele pertence." },
];

export const pillarsIntro =
  "Ninguém vive por departamentos. Não olhamos para o comportamento numa sala nem para uma competência isolada: olhamos para a mesma vida de seis ângulos, porque quando um deles é ignorado, todos os outros pagam.";

export const pillarsClosing =
  "O ponto de partida não é o que falta ao seu filho: é o que ele já tem, e o que lhe falta à volta — estrutura, rotina, vínculo, um adulto calmo, sentido para o esforço. Isto não apaga um diagnóstico nem substitui quem o faz. Muda a pergunta que se faz a seguir: em vez de «o que é que ele tem?», «para onde é que ele deve ir agora?».";

export const whyMusic =
  "Porque a WEPAC é uma companhia de artes e porque, a fazer, descobrimos que poucas coisas põem uma criança inteira em jogo como a música. A criança que espera pela sua vez de tocar está a treinar paciência. A que canta em grupo está a aprender a pertencer. A que repete até sair bem descobre, sem que ninguém lho diga, que o esforço tem recompensa.";

// Bloco 7 — "Três coisas nossas, e o que cada uma é". Note the deliberate
// naming: "Trabalho Neurosensorial WEPAC", never "Terapia Neurosensorial" in
// public (clinical-ethics veto, already applied here — do not restore
// "Terapia").
export const ourThreeThings: { name: string; body: string }[] = [
  {
    name: "Pedagogia Easy Peasy.",
    body: "A pedagogia que a WEPAC usa há anos nos seus programas com crianças: grupo pequeno, repetição com paciência, a família dentro do processo. É educação, e é assim que a nomeamos. Não trata nada, e nunca lhe diremos que trata.",
  },
  {
    name: "Trabalho Neurosensorial WEPAC.",
    body: "Sessões estruturadas de som, movimento e regulação sensorial, desenhadas por nós. É um método nosso: não é um tratamento reconhecido, não tem estudos publicados que o sustentem, e não substitui terapia ocupacional, terapia da fala nem qualquer intervenção prescrita por um profissional de saúde. Dizemos-lhe isto aqui e voltamos a dizê-lo na primeira conversa — não é letra pequena.",
  },
  {
    name: "Plano de Vida 0–24.",
    body: "Um instrumento de planeamento, não uma previsão sobre a vida do seu filho.",
  },
];

// Bloco 8 — "O que a Clínica WEPAC não é". Every refusal points inward.
export const whatItIsNot: string[] = [
  "Não pedimos um diagnóstico para o receber. Se já tem um, olhamos também para o que ele não explica. Se não tem, não é requisito nenhum.",
  "Não trabalhamos para produzir um rótulo. Se em algum momento uma avaliação formal for o passo certo, dizemos-lho de frente e explicamos porquê.",
  "Não emitimos diagnósticos clínicos e não prescrevemos medicação.",
  "Não substituímos o seu pediatra, o médico de família, o hospital, o Serviço Nacional de Saúde nem as avaliações que a escola ou a segurança social exijam.",
  "Não somos explicações nem apoio ao estudo.",
  "Não somos uma solução rápida. Um percurso de desenvolvimento mede-se em anos, e dizemos-lhe isso já na primeira conversa.",
  "Não prometemos resultados. Prometemos um plano claro, sinais observáveis de que está ou não a resultar, e a verdade sobre isso — se alguma coisa não estiver a funcionar, é da nossa boca que vai ouvir isso primeiro.",
  "Não vendemos pacotes que a família não escolheu: a avaliação não o obriga a inscrever-se em nada, e o preço dela não muda se decidir não continuar connosco.",
  "Não falamos do seu filho pelas costas.",
];

// Bloco 9 — "Quem vai estar na sala". TODO 2 (launch blocker): no names,
// formação or cédula numbers exist yet — nothing is invented here. Only the
// generic policy paragraph, which is real regardless of who ends up staffing
// the team, is rendered.
export const teamPolicy =
  "Cada pessoa que trabalha com o seu filho é apresentada aqui pelo nome, pela formação e pelo número de cédula profissional ou de ordem, quando a profissão o exige. Todos os profissionais e colaboradores com contacto regular com menores apresentam certificado de registo criminal, como a lei portuguesa obriga. E se quem o receber não for um profissional de saúde, dizemos-lho antes de se sentar.";

// Bloco 10 — "Quanto custa". TODO 11: the "e se não puder pagar" sentence and
// TODO 10: the insurance/subsystem line are both intentionally absent — see
// the TODO block above.
export const pricingIntro =
  "Pomos os valores nesta página por uma razão simples: já teve conversas a mais em que o preço só aparece no fim. O que torna estes percursos caros raramente é o preço de uma sessão — é não se saber quantas sessões, com quantos profissionais, durante quanto tempo. Por isso trabalhamos por mensalidade.";

// TODO 9: "a partir de 350 €" is the synthesis's own current figure, not an
// approximate range — rendered as-is pending the founder fixing a final
// number or a tiered table.
export const pricingLines: { label: string; value: string }[] = [
  { label: "Avaliação Integral e Plano de Vida 0–24", value: "pagamento único, a partir de 350 €." },
  { label: "Acompanhamento continuado", value: "100 €/mês com uma sessão por semana; 150 €/mês com duas." },
  { label: "Sessões avulso", value: "50 € individual, 30 € em grupo." },
  {
    label: "Sounds of Childhood (educação musical, a partir dos 3 anos)",
    value: "100 €/mês (1 sessão semanal) ou 150 €/mês (2 sessões). É o mesmo programa e o mesmo preço que a WEPAC pratica fora da Clínica.",
  },
];

export const pricingClosing =
  "O valor final depende do plano que desenharmos consigo e é sempre entregue por escrito antes de começar seja o que for. Se a conclusão da avaliação for que o caminho do seu filho é fora daqui, dizemo-lo e o preço é o mesmo.";

// Bloco 11 — "A informação do seu filho / imagem / reclamações". No brackets
// in this block in the synthesis — rendered in full.
export const dataPrivacyBody =
  "O que nos contar sobre o seu filho é informação de saúde e tem a proteção mais alta que a lei prevê. Fica no processo dele e é acessível apenas a quem o acompanha. Não é usada para marketing, não é partilhada com a escola nem com terceiros sem a sua autorização escrita, e essa autorização pode ser retirada a qualquer momento sem que isso mude o acompanhamento. A partir dos 18 anos, é o próprio jovem quem decide sobre a sua informação.";

export const noPhotosBody =
  "Não verá aqui fotografias de crianças. Não usamos a imagem de uma criança para explicar um serviço de saúde, mesmo com autorização dos pais: quem aparece numa página como esta fica associado a ela durante muito tempo, e essa decisão não é dos adultos que a fotografam.";

export const complaintsBody =
  "Se alguma coisa correr mal, queremos saber primeiro — e não somos a última instância. Tem à sua disposição o Livro de Reclamações eletrónico em livroreclamacoes.pt e pode apresentar reclamação junto da Entidade Reguladora da Saúde.";

// Bloco 12 — "Quem está por trás". Zero WEPACker vocabulary, zero Society CTA.
export const behindItBody =
  "A Clínica é uma das áreas da WEPAC — Companhia de Artes, uma estrutura cultural portuguesa que trabalha em criação artística, educação artística e recuperação de espaços com valor patrimonial. O método é o mesmo em todas as áreas — o que muda é a idade e o contexto de quem o recebe. A pedagogia que aqui usamos é a mesma que a Easy Peasy leva às escolas.";

// Bloco 13 — Fecho + CTA. TODO 3: address intentionally omitted — the
// synthesis's own bracket says only "[CONFIRMAR: morada.]", nothing to
// render in its place yet.
export const closing = {
  intro: "Não tem de saber explicar bem o que se passa. No início ninguém sabe. Diga-nos o que reparou — do resto da conversa tratamos nós.",
  ctaCaption: "Trinta minutos para nos contar o que se passa e para lhe dizermos com franqueza se somos, ou não, o sítio certo. Se não formos, dizemos-lho — e, se pudermos, dizemos-lhe para onde ir.",
  formNote: "Pedimos apenas o seu nome e um contacto de adulto. Não escreva aqui informação de saúde sobre a criança: isso falamos consigo em privado.",
  openingLine: "Abrimos em Lisboa em setembro de 2026. Até lá respondemos na mesma.",
  // Bloco 2's emergency-signposting band repeats here, near the final CTA,
  // in this shorter form — exactly as the synthesis writes it, not a
  // paraphrase of the fuller Bloco 2 text.
  emergencyRepeat:
    "Se está preocupado agora, não espere por nós: fale com o médico de família ou o pediatra. Urgência: 112. Linha SNS 24: 808 24 24 24.",
};

// Primary CTA copy (synthesis section 4). Used in the hero and in the
// closing block. Not wired to any submission mechanism — see the TODO next
// to its rendering in page.tsx.
export const primaryCta = {
  label: "Falar connosco antes de setembro",
  nameFieldLabel: "O seu nome",
  contactFieldLabel: "Um contacto de adulto (telefone ou email)",
};
