import type { AppLocale } from "@/i18n/routing";

const ptPT = {
  notFound: {
    eyebrow: "Erro 404",
    title: "Esta página não está aqui",
    body: "A ligação pode estar desatualizada ou a página pode ter mudado de lugar.",
    home: "Ir para o início",
    programme: "Ver programação",
  },
  error: {
    eyebrow: "Erro",
    title: "Algo não correu como esperado",
    body: "Não foi possível carregar esta página. Podes tentar novamente ou voltar ao início.",
    retry: "Tentar novamente",
    home: "Ir para o início",
  },
  ticketNotFound: {
    eyebrow: "Bilheteira · Erro 404",
    title: "Bilhete não encontrado",
    body: "Este bilhete não existe ou deixou de estar disponível. Confirma a ligação que recebeste.",
    ticketOffice: "Ir para a bilheteira",
    home: "Ir para o início",
  },
} as const;

type ErrorCopy = {
  [Section in keyof typeof ptPT]: {
    [Key in keyof (typeof ptPT)[Section]]: string;
  };
};

const enUS: ErrorCopy = {
  notFound: {
    eyebrow: "Error 404",
    title: "This page is not here",
    body: "The link may be out of date or the page may have moved.",
    home: "Go to homepage",
    programme: "View programme",
  },
  error: {
    eyebrow: "Error",
    title: "Something did not go as expected",
    body: "We could not load this page. You can try again or return to the homepage.",
    retry: "Try again",
    home: "Go to homepage",
  },
  ticketNotFound: {
    eyebrow: "Tickets · Error 404",
    title: "Ticket not found",
    body: "This ticket does not exist or is no longer available. Check the link you received.",
    ticketOffice: "Go to tickets",
    home: "Go to homepage",
  },
};

export function getErrorCopy(locale: AppLocale | string): ErrorCopy {
  return locale === "en-US" ? enUS : ptPT;
}
