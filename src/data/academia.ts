// Academia landing page copy — transcribed verbatim from the review board's
// chair resolution (docs/coordination, board synthesis 2026-07-22). This is
// the deliverable, not a draft: do not paraphrase or "improve" any string
// here without re-running it past the board that settled it.
//
// FOUNDER TODO — open, non-blocking questions from the board synthesis that
// this copy does NOT answer (nothing below invents a response to these; the
// page is deliberately silent where the founder has not decided yet):
//   - Q3: quem responde a info@wepac.pt para famílias, e em quanto tempo?
//     If nobody answers it, the Descobrir CTA (mailto text link) loses its
//     reason to exist and should come out — flagged here, not enacted.
//   - Q5: o acompanhamento adulto é online, presencial ou híbrido — e se
//     presencial, onde? The page says nothing about format anywhere.
//   - Q6: depois do primeiro Life Map gratuito, cobra-se alguma coisa?
//   - Q7: duração e cadência do acompanhamento (sessões/mês, quantos meses)?
//   - Q8: Easy Peasy — há escola/igreja/espaço parceiro já confirmado?
// Q1 (idade mínima 22), Q2 (100€/150€ como "mensalidade prevista") and Q4
// (Clínica como encaminhamento) were already resolved by the chair and are
// baked into the copy below. Q9 (Máquina do Tempo Musical) is answered by
// the catalogue's own "estreia prevista para 2026" and needs no TODO.

export const applyHref = "/wepacker/intake";

export const hero = {
  eyebrow: "ACADEMIA · WEPAC",
  h1: "Não te falta capacidade. Falta-te caminho.",
  dek: "A Academia é onde o método da WEPAC se torna percurso. É o mesmo método em qualquer idade — muda a calibração, muda a linguagem, não muda o caminho. Esta página fala sobretudo contigo, adulto, porque é a fase que está aberta hoje. Se procuras para um filho, a porta é outra e está mais abaixo, com o que já existe e com o que ainda não abriu, dito pelo nome.",
  ctaLabel: "Candidatar-me",
  microcopy:
    "Não é um registo — é uma candidatura. A equipa lê, fala contigo, e só depois existe conta. Entrar não custa nada, e o teu primeiro mapa também não. Candidaturas a partir dos 22 anos.",
  subLinkLabel: "Procuro para um filho — ver os três tempos ↓",
  subLinkHref: "#niveis",
};

export const premissa =
  "Toda a gente nasce com potencial. Quase ninguém o converte inteiro — e não é por falta de talento. É como a água parada numa barragem: está lá tudo, e alguém tem de abrir a comporta. O que abre a comporta não é motivação. É estrutura onde havia caos, vínculo onde havia solidão, exemplo onde havia discurso e sentido onde havia ruído. Nada disto se diz. Constrói-se.";

export const oQueRecebes = {
  intro: "Se avançarmos os dois, o que existe do teu lado no primeiro dia é isto:",
  items: [
    {
      title: "Um mentor atribuído pela equipa",
      body: "Não é uma linha de apoio nem um chat sempre ligado. É uma pessoa que se senta contigo com regularidade e é a primeira a notar quando escorregas. A relação só começa quando ambos a aceitam, e termina quando qualquer um dos dois decidir.",
    },
    {
      title: "Sessões com data marcada",
      body: "Dia, hora, duração e link, por convite de calendário. Fica marcado porque o que fica à mercê da vontade raramente acontece.",
    },
    {
      title: "Um espaço privado só teu",
      body: "O mapa da tua vida — quem és, onde estás, para onde vais, porquê, que compromissos assumes —, o plano do trimestre com objetivos e ações, e os Trails que decides levar por diante. Guardamos todas as versões: daqui a seis meses lês o que escreveste hoje e vês ao certo o que mudou.",
    },
  ],
  privacyLine:
    "O que escreves não é visível ao teu mentor nem à equipa. Isto é arquitetura, não é uma promessa de boas intenções.",
};

export const honestidade =
  "Escrevemos o caminho inteiro antes de o conseguirmos abrir todo. O tempo dos adultos está aberto porque é o único em que temos como te entregar, no dia em que entras, um mentor atribuído e uma sessão marcada. Os programas para crianças existem, têm equipa e têm currículo fechado, e abrem por turma. O tempo dos 12 aos 21 está escrito e não tem turma nenhuma. Preferimos dizer-te isto a arranjar-te uma lista de espera com um nome bonito.";

export const niveisIntro = {
  heading: "A mesma pergunta, em três idades",
  intro:
    "Ninguém está formado — nem aos 11, nem aos 21, nem aos 70. Por isso a pergunta que fazemos nunca é «já chegaste?». É «para onde deves ir a seguir?» — e fazemo-la a uma criança de seis anos com a mesma seriedade com que a fazemos a um homem de sessenta. O que muda com a idade não é o método. É quem responde.",
};

// The mailto subject line the "Routing of the other two" table specifies for
// the Descobrir block — built with encodeURIComponent so the em dash and
// spaces come out correctly percent-encoded rather than hand-typed.
const descobrirMailtoSubject = encodeURIComponent("Easy Peasy — lista de contacto");

export type AcademiaLevelCta =
  | { type: "link"; label: string; href: string }
  | { type: "button"; label: string; href: string };

export type AcademiaLevel = {
  id: string;
  anchor: string;
  kicker: string;
  voice: string;
  // Regular body paragraphs: the "prático" paragraph, plus (Descobrir only)
  // the factual "o que existe" paragraph describing the real programmes.
  paragraphs: string[];
  // The visually-distinct "state" block — estado, preço, and the Clínica
  // referral line all belong here. Deliberately the SAME visual treatment
  // across all three levels (see board §3): only the content differs, the
  // closed middle level is never grayed out or shrunk.
  stateParagraphs: string[];
  cta: AcademiaLevelCta | null;
  microcopy?: string;
};

export const niveis: AcademiaLevel[] = [
  {
    id: "descobrir",
    anchor: "descobrir",
    kicker: "Dos 0 aos 11 · Descobrir",
    voice: "«Descobrir que o mundo é vasto e que eu sou capaz de o explorar.»",
    paragraphs: [
      "Nesta idade o corpo é a escola inteira: ritmo, movimento, canção, sono, um espaço previsível. Num compasso de canção cabem a espera, a escuta, o outro e a alegria, tudo em três minutos. Dos sete anos em diante entram as responsabilidades a sério — começar, continuar, terminar — e formam-se por rituais humildes, não por discursos. A criança não precisa de se tornar outra coisa; precisa de descobrir a força que já tem. E a família não assiste: participa, com a mesma linguagem em casa e na sessão.",
      "É aqui que vive a Easy Peasy, com dois programas contínuos de educação artística, currículo fechado e direção pedagógica própria. Sounds of Childhood — musicalização a partir dos 3 anos, em grupos de 4 a 12 crianças, sessões de 45 a 60 minutos que juntam música, movimento e narrativa. Passos Vibrantes — violino, viola d'arco e violoncelo no 1.º ciclo, num programa de quatro anos com aula individual, prática de conjunto e acompanhamento das famílias.",
    ],
    stateParagraphs: [
      "Nenhum dos dois arrancou. Abrem por turma, e uma turma abre quando houver inscrições e um espaço para a receber — normalmente dentro de uma escola ou comunidade parceira. Não temos data para anunciar e não vamos inventar uma.",
      "A mensalidade prevista é de 100€ por uma sessão semanal e 150€ por duas. Quando o programa entra numa escola ou comunidade parceira, o valor é acertado no acordo.",
    ],
    cta: {
      type: "link",
      label: "Escrever-nos sobre a Easy Peasy →",
      href: `mailto:info@wepac.pt?subject=${descobrirMailtoSubject}`,
    },
    microcopy:
      "Diz-nos o nome e a idade da criança e ficamos com o contacto para te avisar quando a turma abrir. Não há inscrição a pagar, não há lugar reservado e não há lista com números.",
  },
  {
    id: "construir",
    anchor: "construir",
    kicker: "Dos 12 aos 21 · Construir",
    voice:
      "«Construir o que ainda não existe: competência, caráter, obra — e responder por aquilo que construí.»",
    paragraphs: [
      "Aqui trata-se o jovem como quem constrói, não como quem é servido: define objetivos, leva projetos com público a sério até ao fim, e presta contas do que fez. O mentor não dá as respostas — dá a régua e a rede. A liberdade cresce à medida da responsabilidade demonstrada, nunca ao contrário.",
    ],
    stateParagraphs: [
      "Não está aberto. Acompanhar menores exige uma política de idade e de consentimento dos responsáveis que estamos a fechar antes de aceitar o primeiro — e este tempo vive de grupo, que não se improvisa. Não temos turma, não temos data e não recolhemos contactos para uma coisa que ainda não existe.",
      "Se o que procuras para um jovem tem componente clínica ou de neurodesenvolvimento, isso é outra área da casa: a Clínica WEPAC acompanha dos 0 aos 24 e abre em Lisboa em setembro de 2026.",
    ],
    cta: null,
  },
  {
    id: "transformar",
    anchor: "transformar",
    kicker: "Dos 22 em diante · Transformar",
    voice: "«Converter o que já acumulei em obra feita, e deixá-la a trabalhar depois de mim.»",
    paragraphs: [
      "Sem idade de fecho, porque ninguém está formado — nem aos 24, nem aos 70. Começa pelo mapa da tua vida e trabalha-se com um mentor, sessão a sessão, sobre o que lá está escrito: a mesma seriedade que se dá a uma empresa, dada a uma vida.",
    ],
    stateParagraphs: [
      "É a única porta aberta hoje. Entra-se por candidatura, e a candidatura é gratuita. Acompanhamos poucas pessoas de cada vez.",
    ],
    cta: { type: "button", label: "Candidatar-me", href: applyHref },
  },
];

export const constantes = {
  heading: "O que não muda",
  corpo: "Aos cinco anos ou aos cinquenta, três coisas são iguais: alguém que te acompanha e te conhece pelo nome; um ritmo que fica marcado no calendário, e não à mercê da vontade, porque o que depende só da vontade raramente acontece; e alguma coisa feita e mostrada no fim. Muda o que se faz. Não muda que se faça, com quem, nem que se termine.",
  lente: "E não muda a lente. Olhamos para a pessoa inteira — corpo, emoção, caráter, interioridade, pensamento e relação — porque ninguém vive por departamentos, e o ângulo que se ignora cobra-se em todos os outros. O executivo brilhante pode ter a vida afetiva em ruína; o artista extraordinário pode ter a estrutura por fazer. Não é um teste, não dá nota e não gera perfil: é a forma como ouvimos, seja quem for que está à nossa frente.",
  familia: "É por isto que uma família pode caminhar junta sem estar no mesmo sítio: a mãe no seu mapa, o filho na sua canção. A linguagem em casa e a linguagem na sessão são a mesma — e isso é metade do trabalho feito.",
};

export const porqueArtes =
  "Começámos pela música porque era o trabalho que já tínhamos nas mãos, não porque a arte valha mais do que o desporto, o ofício ou o ensino. Acontece que poucas práticas obrigam tanto, e tão depressa, a pôr a pessoa inteira em jogo: não se toca bem com o corpo desorganizado, não se interpreta sem vida interior, e nenhuma obra conta enquanto não estiver terminada.";

export const oQueNaoE = {
  heading: "O que isto não é",
  items: [
    "Não é uma escola. Não damos equivalência, currículo certificado nem diploma.",
    "Não é acompanhamento clínico. Dos 0 aos 24, isso é a Clínica WEPAC, que abre em Lisboa em setembro de 2026.",
    "Não é uma comunidade. No acompanhamento de adultos não há feed, não conheces os outros candidatos e não há mensagens para desconhecidos. Acreditamos que ninguém caminha sozinho, e o que temos hoje para te dar é uma relação — a tua e a do teu mentor — e a nossa palavra de que mais ninguém lê o que escreves. Se o que procuras hoje é um grupo de pares, diz-nos e poupamos-te o tempo. Grupo, hoje, só existe nos programas de crianças.",
    "Não é para toda a gente ao mesmo tempo. Cada adulto aceite ocupa um mentor a sério, e cada turma de crianças precisa de espaço e de equipa.",
  ],
};

export const fecho = {
  corpo: "Três idades, um caminho. Hoje há uma porta aberta e duas em obra — e preferimos que saibas exatamente qual é qual. Leva cinco minutos a candidatares-te, e lemos tudo, inclusive quando a resposta é não.",
  ctaLabel: "Candidatar-me",
  microcopy: "Candidaturas a partir dos 22 anos. Entrar não custa nada.",
};

export const escolas = {
  heading: "Escolas, autarquias e comunidades",
  corpo: "Levamos programas de educação artística a escolas, câmaras e comunidades. A Máquina do Tempo Musical — espetáculo pedagógico com estreia prevista para 2026 — é o formato pronto a agendar. Os programas contínuos da Easy Peasy abrem em parceria, com valores acertados no acordo.",
  ctaEmail: "info@wepac.pt",
};
