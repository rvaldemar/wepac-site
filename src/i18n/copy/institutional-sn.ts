import type { AppLocale } from "@/i18n/routing";

type SemNomeCopy = {
  common: {
    adminTitle: string;
    doorTitle: string;
    eventDate: string;
    eventDateWithTime: string;
    unknownError: string;
    error: string;
    name: string;
    seats: string;
    seatCount: (count: number) => string;
  };
  admin: {
    doorLink: string;
    printLink: string;
    namePlaceholder: string;
    generating: string;
    generateTicket: string;
    copied: string;
    copyLink: string;
    preview: string;
    whatsappMessage: (name: string, url: string) => string;
    deleteTitle: string;
    alreadyAdmittedAt: (time: string) => string;
    deleteNote: string;
    deleting: string;
    confirmDelete: string;
    cancel: string;
    tickets: string;
    admitted: string;
    seatsIn: string;
    shortSeats: string;
    save: string;
    view: string;
    edit: string;
    delete: string;
    refresh: string;
    missingKey: string;
    backToAdmin: string;
    guestListTitle: string;
    generatedAt: (date: string) => string;
    serial: string;
    reservation: string;
    token: string;
    noTickets: string;
    print: string;
    printInstructions: string;
  };
  door: {
    invalidCode: string;
    cameraError: string;
    invalidFormat: string;
    pin: string;
    enter: string;
    enableCamera: string;
    or: string;
    manualLabel: string;
    manualPlaceholder: string;
    verify: string;
    alreadyAdmittedAt: (time: string) => string;
    readyToAdmit: string;
    admit: string;
    nextScan: string;
    admitted: string;
    tryAgain: string;
    reservedSeat: string;
  };
};

const ptPT: SemNomeCopy = {
  common: {
    adminTitle: "Sem Nome · Admin",
    doorTitle: "Porta · Sem Nome",
    eventDate: "Jotta Pê · 21 ABR 2026 · Aquiraz",
    eventDateWithTime: "Jotta Pê · 21 ABR 2026 · 19H · Aquiraz",
    unknownError: "erro desconhecido",
    error: "Erro",
    name: "Nome",
    seats: "Lugares",
    seatCount: (count) => `${count} ${count === 1 ? "lugar" : "lugares"}`,
  },
  admin: {
    doorLink: "Porta · Dar baixa",
    printLink: "Lista · Imprimir / PDF",
    namePlaceholder: "Maria Silva",
    generating: "A gerar…",
    generateTicket: "Gerar bilhete",
    copied: "Copiado",
    copyLink: "Copiar link",
    preview: "Pré-visualizar",
    whatsappMessage: (name, url) =>
      `Olá ${name}, aqui está o teu bilhete para o concerto privado de Jotta Pê — Sem Nome.\n\n${url}`,
    deleteTitle: "Eliminar bilhete?",
    alreadyAdmittedAt: (time) => `já admitido às ${time}`,
    deleteNote:
      "Esta ação é irreversível. O link do bilhete deixa de funcionar.",
    deleting: "A eliminar…",
    confirmDelete: "Confirmar eliminação",
    cancel: "Cancelar",
    tickets: "bilhetes",
    admitted: "admitidos",
    seatsIn: "lugares in",
    shortSeats: "Lug.",
    save: "Guardar",
    view: "Ver",
    edit: "Editar",
    delete: "Eliminar",
    refresh: "Atualiza automaticamente a cada 10s",
    missingKey: "SN_ADMIN_KEY não está configurada.",
    backToAdmin: "Admin",
    guestListTitle: "Sem Nome · Lista de convidados",
    generatedAt: (date) => `Gerado ${date}`,
    serial: "Serial",
    reservation: "Reserva",
    token: "Token",
    noTickets: "Sem bilhetes emitidos.",
    print: "Imprimir / Guardar PDF",
    printInstructions:
      "Intransmissível. Cada bilhete admite o número indicado de lugares. Conferir a identidade do portador quando possível.",
  },
  door: {
    invalidCode: "Código inválido.",
    cameraError: "Erro ao aceder à câmara.",
    invalidFormat: "Formato inválido. Usa o URL do bilhete, SN-001 ou número.",
    pin: "PIN",
    enter: "Entrar",
    enableCamera: "Ligar câmara",
    or: "ou",
    manualLabel: "Colar URL · SN-001 · token",
    manualPlaceholder: "SN-001 ou https://wepac.pt/bilhete/…",
    verify: "Verificar",
    alreadyAdmittedAt: (time) => `JÁ ADMITIDO às ${time}`,
    readyToAdmit: "PRONTO A ADMITIR",
    admit: "Admitir",
    nextScan: "Scan seguinte",
    admitted: "✓ ADMITIDO",
    tryAgain: "Tentar novamente",
    reservedSeat: "★ Lugar reservado",
  },
};

const enUS: SemNomeCopy = {
  common: {
    adminTitle: "Sem Nome · Admin",
    doorTitle: "Door · Sem Nome",
    eventDate: "Jotta Pê · 21 APR 2026 · Aquiraz",
    eventDateWithTime: "Jotta Pê · 21 APR 2026 · 7 PM · Aquiraz",
    unknownError: "unknown error",
    error: "Error",
    name: "Name",
    seats: "Seats",
    seatCount: (count) => `${count} ${count === 1 ? "seat" : "seats"}`,
  },
  admin: {
    doorLink: "Door · Check in",
    printLink: "List · Print / PDF",
    namePlaceholder: "Maria Silva",
    generating: "Generating…",
    generateTicket: "Generate ticket",
    copied: "Copied",
    copyLink: "Copy link",
    preview: "Preview",
    whatsappMessage: (name, url) =>
      `Hi ${name}, here is your ticket for Jotta Pê's private concert — Sem Nome.\n\n${url}`,
    deleteTitle: "Delete ticket?",
    alreadyAdmittedAt: (time) => `already admitted at ${time}`,
    deleteNote:
      "This action cannot be undone. The ticket link will stop working.",
    deleting: "Deleting…",
    confirmDelete: "Confirm deletion",
    cancel: "Cancel",
    tickets: "tickets",
    admitted: "admitted",
    seatsIn: "seats in",
    shortSeats: "Seats",
    save: "Save",
    view: "View",
    edit: "Edit",
    delete: "Delete",
    refresh: "Updates automatically every 10s",
    missingKey: "SN_ADMIN_KEY is not configured.",
    backToAdmin: "Admin",
    guestListTitle: "Sem Nome · Guest list",
    generatedAt: (date) => `Generated ${date}`,
    serial: "Serial",
    reservation: "Reservation",
    token: "Token",
    noTickets: "No tickets issued.",
    print: "Print / Save PDF",
    printInstructions:
      "Non-transferable. Each ticket admits the stated number of people. Check the holder's identity whenever possible.",
  },
  door: {
    invalidCode: "Invalid code.",
    cameraError: "Unable to access the camera.",
    invalidFormat: "Invalid format. Use the ticket URL, SN-001 or a number.",
    pin: "PIN",
    enter: "Enter",
    enableCamera: "Turn on camera",
    or: "or",
    manualLabel: "Paste URL · SN-001 · token",
    manualPlaceholder: "SN-001 or https://wepac.pt/bilhete/…",
    verify: "Check",
    alreadyAdmittedAt: (time) => `ALREADY ADMITTED at ${time}`,
    readyToAdmit: "READY TO ADMIT",
    admit: "Admit",
    nextScan: "Next scan",
    admitted: "✓ ADMITTED",
    tryAgain: "Try again",
    reservedSeat: "★ Reserved seat",
  },
};

export function getSemNomeCopy(locale: AppLocale): SemNomeCopy {
  return locale === "en-US" ? enUS : ptPT;
}
