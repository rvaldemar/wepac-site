import type { PrizeKind } from "@prisma/client";
import type { AppLocale } from "@/i18n/routing";

export type PrizeCopy = {
  short: string;
  title: string;
  description: string;
  rules: string;
};

export type GameCopy = {
  metadataTitle: string;
  metadataDescription: string;
  brand: string;
  campaignName: string;
  attract: {
    eyebrow: string;
    headline: string[];
    sub: string;
    cta: string;
    prizesHint: string;
  };
  identify: {
    title: string;
    body: string;
    scanCta: string;
    scanning: string;
    noTicket: string;
    cameraError: string;
    lookupError: string;
    back: string;
  };
  ticketPanel: {
    title: string;
    seats: (n: number) => string;
    spinsLeft: (left: number, total: number) => string;
    me: (name: string) => string;
    meHint: (masked: string) => string;
    mePlayed: string;
    companion: string;
    companionHint: string;
    exhausted: string;
    otherEmail: string;
  };
  details: {
    title: string;
    companionTitle: string;
    body: string;
    nameLabel: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    invalidName: string;
    invalidEmail: string;
    invalidPhone: string;
    next: string;
  };
  consent: {
    title: string;
    intro: string;
    /** May contain `{terms}` and `{privacy}` placeholders rendered as links. */
    termsLabel: string;
    termsInline: string;
    termsTitle: string;
    marketingLabel: string;
    /** May contain a `{privacy}` placeholder rendered as a link. */
    marketingHint: string;
    privacyInline: string;
    close: string;
    play: string;
    termsRequired: string;
    termsBody: string[];
  };
  wheel: {
    title: string;
    tapToSpin: string;
    spinning: string;
    won: string;
    claim: string;
  };
  result: {
    eyebrow: string;
    codeLabel: string;
    validUntil: (date: string) => string;
    emailed: (masked: string) => string;
    emailOnly: (masked: string) => string;
    emailFailed: string;
    howTo: string;
    done: string;
    nextPlayer: (left: number) => string;
    autoReset: (seconds: number) => string;
  };
  alreadyPlayed: {
    title: string;
    body: (masked: string) => string;
    yourPrize: string;
    resent: (masked: string) => string;
    notResent: string;
    done: string;
  };
  errors: {
    generic: string;
    rateLimited: string;
    locked: string;
    ticketExhausted: string;
  };
  unlock: {
    title: string;
    body: string;
    keyLabel: string;
    submit: string;
    failed: string;
  };
  prizes: Record<PrizeKind, PrizeCopy>;
  admin: {
    nav: string;
    title: string;
    intro: string;
    lookupLabel: string;
    lookupPlaceholder: string;
    lookup: string;
    redeem: string;
    redeemAgain: string;
    cancel: string;
    noteLabel: string;
    notePlaceholder: string;
    status: Record<string, string>;
    multiUseHint: string;
    participant: string;
    marketingYes: string;
    marketingNo: string;
    validity: string;
    history: string;
    errors: Record<string, string>;
    stats: { participants: string; marketing: string; issued: string; redeemed: string };
    recent: string;
    exportCsv: string;
    exportHint: string;
    kioskLink: string;
    columns: { code: string; prize: string; email: string; status: string; issuedAt: string };
  };
  email_: {
    subject: (prize: string) => string;
    greeting: (name: string) => string;
    intro: string;
    codeLabel: string;
    validUntil: string;
    howTo: string;
    footer: string;
    marketingNote: string;
    unsubscribe: string;
  };
};

const prizesPt: Record<PrizeKind, PrizeCopy> = {
  two_for_one_single_2026: {
    short: "2x1",
    title: "Dois bilhetes pelo preço de um",
    description: "Num espetáculo Arte à Capela à tua escolha, até 31 de dezembro de 2026.",
    rules: "Válido para um espetáculo. Dois lugares pelo preço de um bilhete da mesma categoria.",
  },
  two_for_one_all_2026: {
    short: "2x1 em tudo",
    title: "Dois pelo preço de um em todos os espetáculos",
    description: "Em todos os espetáculos Arte à Capela até 31 de dezembro de 2026.",
    rules: "Válido em cada espetáculo da programação 2026. Dois lugares pelo preço de um bilhete, por espetáculo.",
  },
  free_ticket_single_2026: {
    short: "Bilhete grátis",
    title: "Um bilhete grátis",
    description: "Para um espetáculo Arte à Capela à tua escolha, até 31 de dezembro de 2026.",
    rules: "Válido para um lugar num espetáculo da programação 2026.",
  },
  free_all_q4_2026: {
    short: "Trimestre grátis",
    title: "Todos os espetáculos do trimestre grátis",
    description: "Um lugar em cada espetáculo Arte à Capela de outubro a dezembro de 2026.",
    rules: "Válido para uma pessoa, um lugar por espetáculo, entre 1 de outubro e 31 de dezembro de 2026.",
  },
};

const prizesEn: Record<PrizeKind, PrizeCopy> = {
  two_for_one_single_2026: {
    short: "2 for 1",
    title: "Two tickets for the price of one",
    description: "At one Arte à Capela concert of your choice, until 31 December 2026.",
    rules: "Valid for one concert. Two seats for the price of one ticket of the same category.",
  },
  two_for_one_all_2026: {
    short: "2 for 1 on all",
    title: "Two for one at every concert",
    description: "At every Arte à Capela concert until 31 December 2026.",
    rules: "Valid at each concert of the 2026 programme. Two seats for the price of one ticket, per concert.",
  },
  free_ticket_single_2026: {
    short: "Free ticket",
    title: "One free ticket",
    description: "For one Arte à Capela concert of your choice, until 31 December 2026.",
    rules: "Valid for one seat at one concert of the 2026 programme.",
  },
  free_all_q4_2026: {
    short: "Free quarter",
    title: "Every concert this quarter, free",
    description: "One seat at every Arte à Capela concert from October to December 2026.",
    rules: "Valid for one person, one seat per concert, between 1 October and 31 December 2026.",
  },
};

const ptPT: GameCopy = {
  metadataTitle: "Roda da Capela — Arte à Capela",
  metadataDescription: "Toca no ecrã, gira a roda e ganha bilhetes Arte à Capela.",
  brand: "Arte à Capela",
  campaignName: "Roda da Capela",
  attract: {
    eyebrow: "WEPAC · Arte à Capela",
    headline: ["Toca", "e ganha"],
    sub: "Todos ganham. Bilhetes grátis e 2x1 até ao fim de 2026.",
    cta: "Toca no ecrã para jogar",
    prizesHint: "2x1 · 2x1 em tudo · Bilhete grátis · Trimestre grátis",
  },
  identify: {
    title: "Mostra o teu bilhete",
    body: "Aproxima o QR do bilhete da câmara. Se não tens bilhete, podes jogar com o teu email.",
    scanCta: "Ligar câmara",
    scanning: "A procurar o QR…",
    noTicket: "Não tenho bilhete",
    cameraError: "Não foi possível aceder à câmara. Usa o email para jogar.",
    lookupError: "Bilhete não reconhecido. Tenta outra vez ou usa o email.",
    back: "Voltar",
  },
  ticketPanel: {
    title: "Encontrámos o teu bilhete",
    seats: (n) => (n === 1 ? "1 lugar" : `${n} lugares`),
    spinsLeft: (left, total) => `${left} de ${total} jogadas disponíveis`,
    me: (name) => `Sou eu, ${name}`,
    meHint: (masked) => `Enviamos o prémio para ${masked}`,
    mePlayed: "Quem comprou o bilhete já jogou.",
    companion: "Registar acompanhante",
    companionHint: "Cada lugar do bilhete dá uma jogada a uma pessoa diferente.",
    exhausted: "Todas as jogadas deste bilhete já foram usadas.",
    otherEmail: "Jogar sem bilhete",
  },
  details: {
    title: "Os teus dados",
    companionTitle: "Dados do acompanhante",
    body: "Enviamos o prémio por email. Nome e email chegam; o telefone é opcional.",
    nameLabel: "Nome",
    emailLabel: "Email",
    emailPlaceholder: "nome@exemplo.pt",
    phoneLabel: "Telemóvel (opcional)",
    phonePlaceholder: "+351 9…",
    invalidName: "Escreve o teu nome.",
    invalidEmail: "Escreve um email válido.",
    invalidPhone: "Número de telemóvel inválido.",
    next: "Continuar",
  },
  consent: {
    title: "Antes de girar",
    intro: "Lê e confirma. Demora dez segundos.",
    termsLabel: "Li e aceito os {terms} e tomei conhecimento da {privacy}.",
    termsInline: "termos do jogo",
    termsTitle: "Termos do jogo e privacidade",
    marketingLabel: "Quero receber novidades da WEPAC e da Arte à Capela por email.",
    marketingHint: "Opcional. Cada email que te enviarmos tem um link para deixares de receber. Ver {privacy}.",
    privacyInline: "política de privacidade",
    close: "Fechar",
    play: "Girar a roda",
    termsRequired: "Precisas de aceitar os termos para jogar.",
    termsBody: [
      "Promoção da WEPAC – Companhia de Artes, válida até 31 de dezembro de 2026, limitada a uma participação por pessoa (email). Um bilhete com vários lugares dá uma participação por lugar, cada uma a uma pessoa diferente.",
      "Todos os participantes recebem um prémio em forma de código, enviado por email e resgatável na bilheteira Arte à Capela, sujeito a lotação. Probabilidades: 2x1 num espetáculo 55%; 2x1 em todos 27%; bilhete grátis 15%; trimestre grátis 3%. A roda no ecrã é ilustrativa; o sorteio é feito pelo sistema com estas probabilidades.",
      "Os prémios não são convertíveis em dinheiro nem transmissíveis. Prémios de bilhete grátis e de trimestre grátis valem para uma pessoa.",
      "Dados tratados: nome, email, telemóvel (opcional), bilhete associado (se existir) e data/hora da participação. Finalidade: entrega e resgate do prémio. Base legal: execução da promoção que solicitaste.",
      "O envio de comunicações de marketing só acontece com o teu consentimento expresso, dado em separado, e pode ser retirado a qualquer momento através do link em cada email ou por info@wepac.pt.",
      "Os dados da participação são conservados até 12 meses após o fim da promoção. O email deixa de ser usado para marketing assim que retirares o consentimento. Responsável pelo tratamento: WEPAC – Companhia de Artes, info@wepac.pt.",
    ],
  },
  wheel: {
    title: "Gira a roda",
    tapToSpin: "Toca na roda",
    spinning: "Boa sorte…",
    won: "A roda parou.",
    claim: "Receber prémio",
  },
  result: {
    eyebrow: "Ganhaste",
    codeLabel: "O teu código",
    validUntil: (date) => `Válido até ${date}`,
    emailed: (masked) => `Enviámos o código para ${masked}.`,
    emailOnly: (masked) => `Enviámos o teu código para ${masked}. Vê a caixa de entrada (e o spam).`,
    emailFailed: "Não conseguimos enviar o email agora. Fotografa o código: é tudo o que precisas.",
    howTo: "Apresenta o código na bilheteira ao reservar o teu lugar.",
    done: "Terminar",
    nextPlayer: (left) => (left === 1 ? "Próximo jogador (1 jogada)" : `Próximo jogador (${left} jogadas)`),
    autoReset: (s) => `O ecrã reinicia em ${s}s`,
  },
  alreadyPlayed: {
    title: "Já giraste a roda",
    body: (masked) => `Este email (${masked}) já participou. Cada pessoa joga uma vez.`,
    yourPrize: "O teu prémio",
    resent: (masked) => `Voltámos a enviar o código para ${masked}.`,
    notResent: "Não conseguimos reenviar o email agora. Pede ajuda na bilheteira.",
    done: "Terminar",
  },
  errors: {
    generic: "Algo falhou. Tenta outra vez.",
    rateLimited: "Demasiadas tentativas. Aguarda um momento.",
    locked: "Este jogo só está disponível no quiosque Arte à Capela.",
    ticketExhausted: "Este bilhete já usou todas as jogadas.",
  },
  unlock: {
    title: "Quiosque bloqueado",
    body: "Introduz a chave do quiosque para ativar este dispositivo.",
    keyLabel: "Chave",
    submit: "Ativar",
    failed: "Chave incorreta.",
  },
  prizes: prizesPt,
  admin: {
    nav: "Roda",
    title: "Roda da Capela",
    intro: "Resgata códigos na bilheteira, acompanha participações e exporta os consentimentos de marketing.",
    lookupLabel: "Código do voucher",
    lookupPlaceholder: "AC-XXXX-XXXX",
    lookup: "Procurar",
    redeem: "Marcar como usado",
    redeemAgain: "Registar utilização",
    cancel: "Cancelar voucher",
    noteLabel: "Nota (opcional)",
    notePlaceholder: "Ex.: espetáculo 24 out, 2 lugares",
    status: { issued: "Ativo", redeemed: "Usado", expired: "Expirado", cancelled: "Cancelado" },
    multiUseHint: "Prémio multi-uso: continua ativo depois de cada utilização; cada registo fica no histórico.",
    participant: "Participante",
    marketingYes: "Consentiu marketing",
    marketingNo: "Sem consentimento de marketing",
    validity: "Validade",
    history: "Histórico",
    errors: {
      invalid_code: "Formato inválido. O código tem a forma AC-XXXX-XXXX.",
      not_found: "Código não encontrado.",
      unauthorized: "Sessão expirada. Volta a entrar.",
      generic: "Algo falhou. Tenta outra vez.",
    },
    stats: { participants: "Participantes", marketing: "Com consentimento", issued: "Vouchers ativos", redeemed: "Usados" },
    recent: "Últimos vouchers",
    exportCsv: "Exportar CSV de marketing",
    exportHint: "Só emails com consentimento de marketing expresso.",
    kioskLink: "Abrir quiosque",
    columns: { code: "Código", prize: "Prémio", email: "Email", status: "Estado", issuedAt: "Emitido" },
  },
  email_: {
    subject: (prize) => `O teu prémio Arte à Capela: ${prize}`,
    greeting: (name) => `Olá${name ? `, ${name}` : ""}.`,
    intro: "Giraste a Roda da Capela e ganhaste:",
    codeLabel: "Código",
    validUntil: "Válido até",
    howTo: "Apresenta este código na bilheteira Arte à Capela ao reservar. Um código por pessoa, sujeito a lotação.",
    footer: "WEPAC – Companhia de Artes · Arte à Capela",
    marketingNote: "Recebes este email porque participaste na Roda da Capela. Se autorizaste novidades da WEPAC e da Arte à Capela, podes retirar esse consentimento a qualquer momento:",
    unsubscribe: "Deixar de receber novidades",
  },
};

const enUS: GameCopy = {
  metadataTitle: "Chapel Wheel — Arte à Capela",
  metadataDescription: "Tap the screen, spin the wheel and win Arte à Capela tickets.",
  brand: "Arte à Capela",
  campaignName: "Chapel Wheel",
  attract: {
    eyebrow: "WEPAC · Arte à Capela",
    headline: ["Tap", "and win"],
    sub: "Everyone wins. Free tickets and 2 for 1 until the end of 2026.",
    cta: "Tap the screen to play",
    prizesHint: "2 for 1 · 2 for 1 on all · Free ticket · Free quarter",
  },
  identify: {
    title: "Show your ticket",
    body: "Hold the ticket QR up to the camera. No ticket? Play with your email.",
    scanCta: "Turn camera on",
    scanning: "Looking for the QR…",
    noTicket: "I don't have a ticket",
    cameraError: "Camera unavailable. Use your email to play.",
    lookupError: "Ticket not recognised. Try again or use your email.",
    back: "Back",
  },
  ticketPanel: {
    title: "We found your ticket",
    seats: (n) => (n === 1 ? "1 seat" : `${n} seats`),
    spinsLeft: (left, total) => `${left} of ${total} spins available`,
    me: (name) => `That's me, ${name}`,
    meHint: (masked) => `We'll send the prize to ${masked}`,
    mePlayed: "The ticket buyer has already played.",
    companion: "Register a companion",
    companionHint: "Each seat on the ticket gives one spin to a different person.",
    exhausted: "Every spin on this ticket has been used.",
    otherEmail: "Play without a ticket",
  },
  details: {
    title: "Your details",
    companionTitle: "Companion details",
    body: "We'll email the prize. Name and email are enough; phone is optional.",
    nameLabel: "Name",
    emailLabel: "Email",
    emailPlaceholder: "name@example.com",
    phoneLabel: "Mobile (optional)",
    phonePlaceholder: "+351 9…",
    invalidName: "Enter your name.",
    invalidEmail: "Enter a valid email.",
    invalidPhone: "Invalid mobile number.",
    next: "Continue",
  },
  consent: {
    title: "Before you spin",
    intro: "Read and confirm. It takes ten seconds.",
    termsLabel: "I have read and accept the {terms} and have read the {privacy}.",
    termsInline: "game terms",
    termsTitle: "Game terms and privacy",
    marketingLabel: "I'd like news from WEPAC and Arte à Capela by email.",
    marketingHint: "Optional. Every email we send has a link to stop receiving them. See the {privacy}.",
    privacyInline: "privacy policy",
    close: "Close",
    play: "Spin the wheel",
    termsRequired: "You need to accept the terms to play.",
    termsBody: [
      "Promotion by WEPAC – Companhia de Artes, valid until 31 December 2026, limited to one entry per person (email). A ticket with several seats grants one entry per seat, each for a different person.",
      "Every participant receives a prize as a code, sent by email and redeemable at the Arte à Capela box office, subject to availability. Odds: 2 for 1 at one concert 55%; 2 for 1 at all 27%; free ticket 15%; free quarter 3%. The on-screen wheel is illustrative; the draw is made by the system with these odds.",
      "Prizes cannot be exchanged for cash or transferred. Free ticket and free quarter prizes are for one person.",
      "Data processed: name, email, mobile (optional), linked ticket (if any) and entry timestamp. Purpose: delivering and redeeming the prize. Legal basis: performance of the promotion you requested.",
      "Marketing emails are sent only with your explicit, separate consent, which you can withdraw at any time via the link in each email or at info@wepac.pt.",
      "Entry data is kept for up to 12 months after the promotion ends. Your email stops being used for marketing as soon as you withdraw consent. Controller: WEPAC – Companhia de Artes, info@wepac.pt.",
    ],
  },
  wheel: {
    title: "Spin the wheel",
    tapToSpin: "Tap the wheel",
    spinning: "Good luck…",
    won: "The wheel has stopped.",
    claim: "Claim prize",
  },
  result: {
    eyebrow: "You won",
    codeLabel: "Your code",
    validUntil: (date) => `Valid until ${date}`,
    emailed: (masked) => `We sent the code to ${masked}.`,
    emailOnly: (masked) => `We sent your code to ${masked}. Check your inbox (and spam).`,
    emailFailed: "We couldn't send the email right now. Take a photo of the code: that's all you need.",
    howTo: "Show the code at the box office when booking your seat.",
    done: "Done",
    nextPlayer: (left) => (left === 1 ? "Next player (1 spin)" : `Next player (${left} spins)`),
    autoReset: (s) => `Screen resets in ${s}s`,
  },
  alreadyPlayed: {
    title: "You've already spun",
    body: (masked) => `This email (${masked}) has already entered. One spin per person.`,
    yourPrize: "Your prize",
    resent: (masked) => `We re-sent the code to ${masked}.`,
    notResent: "We couldn't re-send the email right now. Ask at the box office.",
    done: "Done",
  },
  errors: {
    generic: "Something went wrong. Try again.",
    rateLimited: "Too many attempts. Wait a moment.",
    locked: "This game is only available at the Arte à Capela kiosk.",
    ticketExhausted: "This ticket has used all of its spins.",
  },
  unlock: {
    title: "Kiosk locked",
    body: "Enter the kiosk key to activate this device.",
    keyLabel: "Key",
    submit: "Activate",
    failed: "Wrong key.",
  },
  prizes: prizesEn,
  admin: {
    nav: "Wheel",
    title: "Chapel Wheel",
    intro: "Redeem codes at the box office, follow entries and export marketing consents.",
    lookupLabel: "Voucher code",
    lookupPlaceholder: "AC-XXXX-XXXX",
    lookup: "Look up",
    redeem: "Mark as used",
    redeemAgain: "Record a use",
    cancel: "Cancel voucher",
    noteLabel: "Note (optional)",
    notePlaceholder: "e.g. concert 24 Oct, 2 seats",
    status: { issued: "Active", redeemed: "Used", expired: "Expired", cancelled: "Cancelled" },
    multiUseHint: "Multi-use prize: stays active after each use; every use is logged in the history.",
    participant: "Participant",
    marketingYes: "Marketing consent given",
    marketingNo: "No marketing consent",
    validity: "Validity",
    history: "History",
    errors: {
      invalid_code: "Invalid format. Codes look like AC-XXXX-XXXX.",
      not_found: "Code not found.",
      unauthorized: "Session expired. Sign in again.",
      generic: "Something went wrong. Try again.",
    },
    stats: { participants: "Participants", marketing: "With consent", issued: "Active vouchers", redeemed: "Used" },
    recent: "Latest vouchers",
    exportCsv: "Export marketing CSV",
    exportHint: "Only emails with explicit marketing consent.",
    kioskLink: "Open kiosk",
    columns: { code: "Code", prize: "Prize", email: "Email", status: "Status", issuedAt: "Issued" },
  },
  email_: {
    subject: (prize) => `Your Arte à Capela prize: ${prize}`,
    greeting: (name) => `Hi${name ? `, ${name}` : ""}.`,
    intro: "You spun the Chapel Wheel and won:",
    codeLabel: "Code",
    validUntil: "Valid until",
    howTo: "Show this code at the Arte à Capela box office when booking. One code per person, subject to availability.",
    footer: "WEPAC – Companhia de Artes · Arte à Capela",
    marketingNote: "You're receiving this because you entered the Chapel Wheel. If you opted in to WEPAC and Arte à Capela news, you can withdraw that consent at any time:",
    unsubscribe: "Stop receiving news",
  },
};

const dictionaries: Record<AppLocale, GameCopy> = { "pt-PT": ptPT, "en-US": enUS };

export function getGameCopy(locale: string): GameCopy {
  return dictionaries[locale === "en-US" ? "en-US" : "pt-PT"];
}
