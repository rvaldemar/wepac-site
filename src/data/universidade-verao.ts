// Universidade de Verão WEPAC Society — page content.
//
// ============================================================================
// TODO — PENDING FOUNDER DECISIONS (do not invent any of these; render no
// number/date on the page until they are filled in here). Each unlocks one
// section:
//
// 1. EXACT_DATES        — exact weekend date, or a delimited window with an
//                          "unavailable dates" field on the form. Unlocks the
//                          "Quando" fact in the hero/facts row. Blocks
//                          everything downstream (reply date, mentor
//                          scheduling) until decided.
// 2. COST_CEILING_EUR    — a ceiling, not a fixed price (per the board's
//                          ruling in section 4 of the proposal). Unlocks the
//                          "Quanto custa" section, including the funded-place
//                          guarantee and the "podes dizer que não" copy.
// 3. FUNDED_PLACES_AVAILABLE — whether a funded-place fund exists at all, and
//                          (if so) roughly how many. Required before
//                          COST_CEILING_EUR's guarantee copy can go live —
//                          the guarantee sentence cannot be published without
//                          it being true.
// 4. PLACE_COUNT         — maximum places, and the floor below which the
//                          weekend does not run. Unlocks the "quantos
//                          lugares" fact and the composing-a-group framing
//                          becoming concrete instead of abstract.
// 5. REPLY_DATE          — the date every applicant gets an answer, published
//                          before anyone applies. Unlocks the "quando sabes"
//                          fact and the non-convocation email promise.
// 6. MENTORS             — who is running patrols/circles, at least a count
//                          and whether they are named. Unlocks the "quem te
//                          acompanha" section.
//
// Two further items block the APPLICATION FORM itself, not this page, and
// are owned by the front reworking applications (per-offer, not per-person):
// a birthDate field (the only hard eligibility rule) and the global-unique
// `email` constraint that currently makes a new application silently
// overwrite a person's prior one. Do not touch the intake pipeline here.
// ============================================================================

export const AGE_RANGE = { min: 18, max: 26 } as const;

export const APPLICATION_DEADLINE = "10 de agosto de 2026";

export const DURATION_LABEL =
  "Um fim de semana — sexta à tarde a domingo à tarde, residencial.";

// --- Pending founder decisions --------------------------------------------
// Set each to a real value when the founder decides. Leave null to keep the
// dependent section off the page.

export const EXACT_DATES: { mode: "exact"; date: string } | { mode: "window"; from: string; to: string } | null =
  null;

export const COST_CEILING_EUR: number | null = null;

export const FUNDED_PLACES_AVAILABLE: boolean | null = null;

export const PLACE_COUNT: { max: number; minimumToRun: number } | null = null;

export const REPLY_DATE: string | null = null;

export const MENTORS: { name: string; role: string }[] | null = null;

// The apply flow is being rebuilt (applications are moving from per-person to
// per-offer). Do not wire this CTA to /wepacker/intake or any form yet.
export const APPLY_ENABLED = false;

// --- Thesis -----------------------------------------------------------------

export const HERO = {
  eyebrow: "WEPAC Society",
  title: "A Travessia",
  subtitle: "Universidade de Verão WEPAC Society",
  lead:
    "A barragem está cheia e a comporta está fechada. Isto abre-a — um fim de semana, não uma vida inteira. From packer to WEPACker.",
};

export const FACTS: { label: string; value: string }[] = [
  { label: "Idades", value: `${AGE_RANGE.min} a ${AGE_RANGE.max} anos` },
  { label: "Duração", value: DURATION_LABEL },
  { label: "Local e programa", value: "Revelados só a quem for convocado." },
  { label: "Candidaturas até", value: APPLICATION_DEADLINE },
];

// --- The weekend in one paragraph ------------------------------------------

export const WEEKEND_SUMMARY = [
  "Vens de sexta à tarde a domingo à tarde para um sítio que só descobres quando lá chegares. Dormes lá, cozinhas, lavas a loiça, e carregas no teu saco coisas que não são tuas.",
  "No sábado de manhã atravessas um percurso a pé com o grupo — navegas tu, não há telemóvel, e chega-se junto ou não se chega. À tarde a tua patrulha tem três horas para fazer uma coisa a sério, acabada, que à noite é oferecida a alguém. Alguém de fora vai criticar-te o trabalho a meio, quando ainda dá para corrigir e já não dá para ser confortável.",
  "Ao domingo de manhã fazes um trabalho útil e verdadeiro no sítio que te acolheu, e acabas antes de sair. Escreves um caderno que ninguém lê e sais com dois compromissos com data, guardados por uma pessoa com nome que te vai perguntar.",
  "Não te transformamos em 44 horas — dizemo-lo em voz alta na sexta à noite. Não há certificado, não há avaliação, não estás em audição, e não te vendemos nada enquanto lá estiveres.",
];

// --- The shape, hour by hour -------------------------------------------------
// Published almost verbatim: total clarity about what happens is what buys
// the licence for keeping where a secret.

export interface ScheduleBlock {
  time: string;
  title: string;
  body: string;
  why?: string;
}

export interface ScheduleDay {
  day: string;
  theme: string;
  blocks: ScheduleBlock[];
}

export const SCHEDULE: ScheduleDay[] = [
  {
    day: "Sexta",
    theme: "Chegar e largar o peso a mais",
    blocks: [
      {
        time: "17h30",
        title: "Ponto de encontro",
        body:
          "Uma estação em Lisboa, não o destino. Só nomes. Distribui-se a carga do grupo: cada mochila leva algo que não é seu — água, comida, ferramentas, o material do lume.",
        why: "Nenhum discurso consegue o que um saco de 4 kg que não é teu consegue em dez minutos.",
      },
      {
        time: "18h00",
        title: "Viagem em conjunto e último troço a pé",
        body: "Últimos 20 minutos em silêncio.",
        why: "Chega-se cansado e com luz baixa — a pose desmonta-se sozinha.",
      },
      {
        time: "20h00",
        title: "A revelação, instalar e cozinhar",
        body:
          "O local aparece; ninguém o apresenta. O sítio não está feito: cada um prepara onde dorme, e o jantar é feito por vocês. Patrulhas de 5 a 6 pessoas, formadas pela equipa, mistas em idade, com papéis rotativos a partir daqui.",
        why: "Mata a postura de cliente nos primeiros 45 minutos.",
      },
      {
        time: "21h45",
        title: "Abertura — 12 minutos, sem slides",
        body:
          "O que isto é, o que isto não é, e três regras: diz-se a verdade, acaba-se o que se começa, pára-se por quem cai. E a frase que decide o fim de semana: ninguém está aqui a ser avaliado, não há seleção a decorrer, não há nada para ganhar.",
      },
      {
        time: "22h00",
        title: "A mochila",
        body:
          "Cada um apresenta o objeto que trouxe como prova de algo que fez, acabou ou falhou — dois minutos, de pé, cronometrados. Um mentor vai primeiro e conta uma falha própria.",
        why: "Estabelece o registo da casa — fala-se de factos, não de sentimentos — antes de se pedir honestidade a alguém.",
      },
      {
        time: "23h30",
        title: "Silêncio e primeira página",
        body:
          "Dois minutos de silêncio. Primeira página do caderno: onde estou, uma linha por pilar. Ninguém lê. Recolher fixo.",
      },
    ],
  },
  {
    day: "Sábado",
    theme: "Carregar, fazer, acabar",
    blocks: [
      {
        time: "08h00",
        title: "Corpo",
        body: "40 minutos ao ar livre — respiração, ritmo, voz, coordenação.",
        why: "Sem corpo organizado não há atenção; e aquece o instrumento que vão usar à noite.",
      },
      {
        time: "09h30–12h30",
        title: "A marcha com peso",
        body:
          "Percurso desconhecido, navegado por vocês, com navegador rotativo. A meio, uma restrição real: a água só chega se for posta em comum, ou a carga tem de ser redistribuída. Regra única: chega-se junto. Existe rota alternativa desenhada com o mesmo estatuto para quem tenha limitação física — nunca uma versão reduzida.",
        why: "É o único bloco que produz prova comportamental a sério: quem para, quem carrega, quem desaparece.",
      },
      {
        time: "13h00",
        title: "Almoço, tarefas e uma hora de nada",
        body: "Sem programação.",
      },
      {
        time: "14h30–15h30",
        title: "A hora só",
        body:
          "Sozinho, em silêncio, no terreno, com o caderno: onde foi de facto o teu tempo, o teu dinheiro e a tua energia nos últimos seis meses — e o que isso mostra sobre o que já estás a servir.",
        why: "Pergunta-se pelos gastos, não pelos valores — um porquê que se lê nos gastos é verificável.",
      },
      {
        time: "15h30–18h30",
        title: "A obra",
        body:
          "Cada patrulha tira à sorte uma pergunta do teu Plano de Projeto de Vida e recebe a mesma encomenda: sete minutos, feitos para este lugar, com o que existe, terminados hoje. Às 16h45, a crítica externa — dez minutos de crítica honesta por um mentor de fora da patrulha.",
        why: "É a crise desenhada do fim de semana: receber crítica dura a meio e acabar na mesma é o músculo que todo o resto do caminho vai pedir.",
      },
      {
        time: "18h30–19h30",
        title: "Montagem e jantar",
        body: "Cuidado do espaço, depois jantar.",
      },
      {
        time: "21h00",
        title: "A oferta",
        body:
          "As peças, apresentadas a quem as recebe — anfitriões, equipa, comunidade do lugar. Sem pontuação, sem prémio, sem vencedor.",
      },
      {
        time: "21h45",
        title: "A ronda dos factos",
        body:
          "Por patrulha, três observações a cada pessoa — só comportamento observado neste fim de semana, sem adjetivos sobre a alma, sem conselhos. Depois, sozinho, no caderno: quem sou — três afirmações, três provas. Afirmação sem prova não é identidade: passa para amanhã.",
        why: "Converte uma pergunta impossível numa tarefa de honestidade que qualquer um de 18 anos consegue mesmo fazer.",
      },
      {
        time: "22h45",
        title: "O contraditório",
        body:
          "Uma hora com a WEPAC em julgamento: as perguntas mais duras que tiveres sobre o método, o dinheiro, a organização e os motivos do fundador. Respostas diretas ou «não sei».",
        why: "É a melhor defesa que existe contra isto ser lido como seita.",
      },
      {
        time: "23h45–01h00",
        title: "Os músicos da casa",
        body: "Vinte minutos a sério, a dois metros. Depois, roda aberta. Recolher à 01h00.",
      },
    ],
  },
  {
    day: "Domingo",
    theme: "Acabar como princípio, não como cume",
    blocks: [
      {
        time: "08h00",
        title: "Corpo, pequeno-almoço, tarefas",
        body: "Terceira repetição — é aqui que se percebe que a estrutura liberta.",
      },
      {
        time: "09h15–10h45",
        title: "O serviço",
        body:
          "Um ato real, útil e acabado antes de saíres: reparar, limpar, construir, plantar, ou tocar para quem não pode sair de casa. Não simbólico.",
        why: "O aplauso de ontem não fecha nada; isto fecha.",
      },
      {
        time: "11h00",
        title: "Para onde vou",
        body: "Sozinho, no caderno. Recebe tudo o que ontem ficou por prova.",
      },
      {
        time: "11h45",
        title: "Os compromissos: dois",
        body:
          "Um a 30 dias e um a 90. Específicos ao ponto de se poder falhar, e formulados para que outra pessoa consiga verificar.",
      },
      {
        time: "12h15",
        title: "A ronda dos compromissos",
        body:
          "Lê-se à patrulha apenas os compromissos, nada mais do caderno. Nomeia-se uma testemunha, que aceita em voz alta e fica com a cópia em papel — a WEPAC não guarda nenhuma. Marca-se ali, com data, a primeira sessão individual de mentoria.",
      },
      {
        time: "12h45",
        title: "Fecho, sem investidura",
        body:
          "Sem certificado, sem juramento, sem fotografia de grupo. O compromisso WEPACker é entregue em papel, por assinar — assinas depois, se e quando quiseres. Dito em voz alta: não te tornaste nada este fim de semana; ganhaste um diagnóstico, uma dívida e uma testemunha.",
        why: "Assinar a 44 horas de intensidade é exatamente a pressão que a doutrina recusa.",
      },
      {
        time: "13h00–14h30",
        title: "Almoço e partida",
        body:
          "Arrumar tudo e deixar o sítio melhor do que se encontrou. Telemóveis devolvidos no ponto de partida.",
      },
    ],
  },
];

// --- Non-negotiable safeguards ----------------------------------------------

export const SAFEGUARDS: string[] = [
  "Horas de dormir fixas, sem privação de sono.",
  "Sem catarse fabricada: sem velas, escuridão ou música manipuladora.",
  "Sem álcool — a razão é explicada, nunca moralizada.",
  "Telemóveis em envelope selado, por consentimento decidido em conjunto na sexta; contacto de emergência publicado às famílias, com exceção declarada para quem tem responsabilidade real de estar contactável.",
  "Um adulto com competência clínica contactável durante todo o fim de semana, com protocolo escrito de encaminhamento.",
  "Um segundo adulto responsável pelo cuidado, sem qualquer papel de mentoria ou avaliação.",
  "Círculo restaurativo disponível desde sexta à noite.",
  "Saída possível a qualquer hora — dito em voz alta logo na abertura.",
];

// --- What you leave with -----------------------------------------------------

export const TAKEAWAYS: string[] = [
  "O teu Plano de Projeto de Vida v0.1, escrito à mão: onde estás, porquê, quem és, para onde vais, os teus compromissos.",
  "Dois compromissos com data — 30 e 90 dias — verificáveis por terceiros, com uma testemunha que aceitou em voz alta e ficou com o papel.",
  "A ronda dos factos, por escrito: o que o grupo te viu fazer, comportamento observado, sem adjetivos.",
  "A experiência física de carregar o que não era teu, e de teres sido carregado.",
  "Uma obra acabada e oferecida, e um ato de serviço concluído — não apenas iniciado.",
  "Cinco ou seis pessoas que te viram trabalhar sob prazo e sob crítica.",
  "Um mentor com nome, e a primeira sessão individual já marcada com data.",
  "O compromisso WEPACker em papel, por assinar.",
  "O nome exato da porta seguinte, e a data em que abre.",
];

export const NOT_TAKEAWAYS_INTRO =
  "O que não levas — e dizemos isto em voz alta:";

export const NOT_TAKEAWAYS: string[] = [
  "Transformação. Caráter formado — caráter é hábito, e hábito é tempo.",
  "Uma cosmovisão — essa é consequência de percorrer o caminho, não de o visitar durante um fim de semana.",
  "Um diagnóstico clínico — o mapa dos pilares é autodeclarado, e revê-se depois com um mentor.",
  "Certificado, classificação, ou um lugar garantido em seja o que for.",
];

export const FOLLOW_UP_PROMISE =
  "Um fim de semana sem seguimento é só uma boa produção. Por isso há sempre um contacto marcado ao dia 30 e ao dia 90.";

// --- What it is not (same idiom as /society) --------------------------------

export const WHAT_IT_IS_NOT: string[] = [
  "Não é um curso: não há aulas nem módulos.",
  "Não é uma competição: não há vencedores, não há tabela, não há prémio.",
  "Não é uma seita: há uma hora inteira em que a WEPAC responde, sem filtro, às perguntas mais duras que tiveres sobre método, dinheiro e motivos.",
  "Não é para quem já tem tudo resolvido: ter uma pergunta viva sobre direção é quase condição de entrada.",
  "Não é um retiro de bem-estar: dorme-se pouco, trabalha-se muito, e a crítica ao teu trabalho é feita a sério, a meio.",
];

// --- Secrecy ruling ----------------------------------------------------------

export const SECRECY_RULING = {
  kept: [
    "O local e o programa exato mantêm-se em segredo até à seleção. Não é teatro: é pedagogia. Um sítio consumido em fotografia antes de ser habitado já está gasto — chegar sem saber onde estás retira a única defesa que se traz sempre para um sítio novo: a antecipação.",
    "Isto não implica logística escondida: ponto de encontro numa estação em Lisboa, transporte tratado, não precisas de carro.",
  ],
  open:
    "Em troca, abrimos tudo o resto. O horário que acabaste de ler é quase à letra o que vais viver, hora a hora. A clareza total sobre o que se passa é o que compra a licença para o mistério sobre onde.",
};

// --- Selection ---------------------------------------------------------------

export const SELECTION_CRITERIA: { title: string; body: string }[] = [
  {
    title: "Disposição à exigência",
    body: "Uma prova de que terminaste algo difícil e sem glamour.",
  },
  {
    title: "Honestidade",
    body: "Capacidade de nomear um erro ou um não-sei, sem verniz.",
  },
  {
    title: "O WE",
    body: "Uma vez concreta em que carregaste peso por alguém — não um currículo de voluntariado.",
  },
  {
    title: "Estar na travessia",
    body: "Uma pergunta viva e por resolver sobre direção. Ter tudo decidido é quase desqualificação.",
  },
  {
    title: "Composição do grupo",
    body:
      "Não escolhemos uma pessoa de cada vez — compomos um grupo. Pelo menos um terço vem de fora da órbita WEPAC: sem isso, isto seria um encontro de família.",
  },
];

export const SELECTION_NOTE =
  "Isto não é mérito, nem currículo, nem talento. O potencial é facto físico acumulado, não distinção atribuída — e o que trava a conversão é circunstância, não valor. Por isso não há vencedores. Há convocados: uma seleção decide quem está numa sala, que é escassa. Não decide quem pertence à Society, que não é.";

export const CRISIS_NOTE =
  "Se estás a atravessar uma crise aguda, este não é o momento certo para 44 horas intensas, residenciais, com desconhecidos e sem telemóvel — e dizemo-lo com o mesmo cuidado com que dizemos tudo o resto. Recebes outra porta, real, não uma recusa.";

// Preview only — the actual form is not wired here (see TODO at top).
export const APPLICATION_QUESTIONS: string[] = [
  "Uma coisa difícil e sem glamour que terminaste. O que foi e quanto custou.",
  "Uma coisa em que estás errado, ou onde não sabes o caminho, neste momento.",
  "Uma vez em que carregaste peso por alguém e ninguém deu por isso.",
  "Se este fim de semana correr bem, o que muda na tua segunda-feira?",
];
