import type { AppLocale } from "@/i18n/routing";

type TicketAdminCopy = {
  layout: {
    events: string;
    admins: string;
    signOut: string;
  };
  dashboard: {
    verifiedWelcome: string;
    title: string;
    newEvent: string;
    empty: string;
    tableTitle: string;
    departmentBrand: string;
    date: string;
    tickets: string;
    status: string;
    paymentStatusLabels: Record<string, string>;
    manage: string;
    statusLabels: Record<string, string>;
  };
  admins: {
    back: string;
    title: string;
    introductionBefore: string;
    registrationPage: string;
    introductionAfter: string;
    deleted: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
    lastLogin: string;
    self: string;
    verified: string;
    pending: string;
    deleteTitle: string;
    delete: string;
  };
  form: {
    title: string;
    subtitleOptional: string;
    subtitlePlaceholder: string;
    description: string;
    department: string;
    brandOptional: string;
    noBrand: string;
    venue: string;
    venuePlaceholder: string;
    addressOptional: string;
    start: string;
    date: string;
    time: string;
    doorsOptional: string;
    durationMinutes: string;
    capacityOptional: string;
    coverUrl: string;
    coverPlaceholder: string;
    ticketNote: string;
    ticketNotePlaceholder: string;
    status: string;
    ticketTiers: string;
    tierNamePlaceholder: string;
    tierPricePlaceholder: string;
    tierDescriptionPlaceholder: string;
    removeTier: string;
    addTier: string;
    loadingValues: string;
    defaultTiers: Array<{ name: string; price: string; description: string }>;
  };
  newEvent: {
    eyebrow: string;
    title: string;
    submit: string;
  };
  checkin: {
    mode: string;
    admittedCount: (count: number) => string;
    totalTickets: (count: number) => string;
    enableCamera: string;
    disableCamera: string;
    serialPlaceholder: string;
    verify: string;
    verifying: string;
    retry: string;
    lookupError: string;
    actionError: string;
    cameraError: string;
    admitted: string;
    alreadyAdmitted: string;
    checkedOut: string;
    pending: string;
    seatCount: (count: number) => string;
    admittedAt: (time: string) => string;
    undoAdmission: string;
    admitNow: string;
    continue: string;
    history: string;
    at: string;
  };
  detail: {
    back: string;
    publicPage: string;
    checkinMode: string;
    saved: string;
    tickets: string;
    seats: string;
    admitted: string;
    admittedSeats: string;
    revenue: string;
    eventDetails: string;
    saveChanges: string;
    ticketPreview: string;
    previewBody: string;
    coverImage: string;
    currentImageAlt: string;
    removeImage: string;
    noCover: string;
    uploadImage: string;
    sendImage: string;
    tiers: string;
    noTiers: string;
    name: string;
    description: string;
    price: string;
    limit: string;
    save: string;
    delete: string;
    addTier: string;
    tierNamePlaceholder: string;
    tierPricePlaceholder: string;
    tierDescriptionPlaceholder: string;
    tierQuantityPlaceholder: string;
    stripePricePlaceholder: string;
    payments: string;
    receivedStripe: string;
    pendingPayments: string;
    totalPayments: string;
    noPayments: string;
    date: string;
    buyer: string;
    tier: string;
    shortSeats: string;
    amount: string;
    status: string;
    issuedTickets: string;
    noTickets: string;
    serial: string;
    qr: string;
    view: string;
    admit: string;
    undo: string;
    qrTitle: (name: string) => string;
    issueManual: string;
    buyerName: string;
    emailOptional: string;
    phoneOptional: string;
    marketingConsent: string;
    issueTicket: string;
    fallbackTier: string;
    previewBuyer: string;
  };
};

const ptPT: TicketAdminCopy = {
  layout: {
    events: "Eventos",
    admins: "Admins",
    signOut: "Sair",
  },
  dashboard: {
    verifiedWelcome: "Email confirmado. Bem-vindo/a à Bilheteira WEPAC.",
    title: "Eventos",
    newEvent: "+ Novo evento",
    empty: "Ainda não tens eventos. Cria um novo evento para começar.",
    tableTitle: "Título",
    departmentBrand: "Departamento · Marca",
    date: "Data",
    tickets: "Bilhetes",
    status: "Estado",
    paymentStatusLabels: {
      pending: "Pendente",
      completed: "Concluído",
      expired: "Expirado",
      failed: "Falhou",
      refunded: "Reembolsado",
    },
    manage: "Gerir",
    statusLabels: {
      draft: "Rascunho",
      published: "Publicado",
      cancelled: "Cancelado",
      completed: "Concluído",
    },
  },
  admins: {
    back: "← Eventos",
    title: "Administradores",
    introductionBefore:
      "Todos os administradores têm as mesmas permissões. Para adicionar alguém novo, partilha o link da",
    registrationPage: "página de registo",
    introductionAfter:
      "— a conta só é ativada após confirmação do email @wepac.pt.",
    deleted: "Admin apagado.",
    name: "Nome",
    email: "Email",
    status: "Estado",
    createdAt: "Criado em",
    lastLogin: "Último login",
    self: "(tu)",
    verified: "Verificado",
    pending: "Pendente",
    deleteTitle: "Apagar admin",
    delete: "Apagar",
  },
  form: {
    title: "Título",
    subtitleOptional: "Subtítulo (opcional)",
    subtitlePlaceholder: "ex.: Ananda Roda · vihuela",
    description: "Descrição",
    department: "Departamento",
    brandOptional: "Marca (opcional)",
    noBrand: "— Sem marca (usa o departamento)",
    venue: "Local",
    venuePlaceholder: "Capela do Hospital de Jesus",
    addressOptional: "Morada (opcional)",
    start: "Início",
    date: "Data",
    time: "Hora",
    doorsOptional: "Abertura de portas (opcional)",
    durationMinutes: "Duração (min)",
    capacityOptional: "Capacidade (opcional)",
    coverUrl:
      "URL da imagem de capa (opcional — usa o upload abaixo para enviar do disco)",
    coverPlaceholder: "/api/bilheteira/uploads/... ou https://...",
    ticketNote:
      "Texto do verso do bilhete (opcional — texto editorial específico deste evento, aparece no bilhete digital)",
    ticketNotePlaceholder:
      "Ex.: A vihuela antecedeu a guitarra em duzentos anos...",
    status: "Estado",
    ticketTiers: "Tiers de bilhete",
    tierNamePlaceholder: "Nome (ex.: Bilhete)",
    tierPricePlaceholder: "Preço em € (0 = grátis)",
    tierDescriptionPlaceholder: "Descrição (opcional)",
    removeTier: "Remover tier",
    addTier: "+ Adicionar tier",
    loadingValues: "A carregar valores…",
    defaultTiers: [
      { name: "Convite", price: "0", description: "" },
      {
        name: "Bilhete Estudante",
        price: "10",
        description: "Com comprovativo de matrícula.",
      },
      {
        name: "Bilhete com Reserva",
        price: "12",
        description: "Compra antecipada em wepac.pt.",
      },
      {
        name: "Bilhete Normal",
        price: "17",
        description: "Entrada individual.",
      },
      {
        name: "Bilhete Patrono",
        price: "25",
        description: "Apoia a programação e sustenta a temporada.",
      },
      { name: "Bilhete Casal", price: "30", description: "Dois lugares." },
      {
        name: "Bilhete 2026",
        price: "60",
        description: "Passe anual — temporada completa.",
      },
    ],
  },
  newEvent: {
    eyebrow: "Admin · Eventos",
    title: "Novo evento",
    submit: "Criar evento",
  },
  checkin: {
    mode: "Modo Check-in",
    admittedCount: (count) => `${count} admitidos`,
    totalTickets: (count) => `${count} bilhetes no total`,
    enableCamera: "Ligar câmara",
    disableCamera: "Desligar câmara",
    serialPlaceholder: "Serial ou ID (ex.: BT-001)",
    verify: "Verificar",
    verifying: "A verificar...",
    retry: "Tentar novamente",
    lookupError: "Erro ao procurar bilhete",
    actionError: "Erro ao processar",
    cameraError: "Não foi possível aceder à câmara.",
    admitted: "✓ ADMITIDO",
    alreadyAdmitted: "✓ JÁ ADMITIDO",
    checkedOut: "↩ CHECK-OUT FEITO",
    pending: "PENDENTE",
    seatCount: (count) => (count === 1 ? "1 lugar" : `${count} lugares`),
    admittedAt: (time) => `Admitido às ${time}`,
    undoAdmission: "Anular admissão",
    admitNow: "Admitir agora",
    continue: "Continuar",
    history: "Histórico",
    at: "às",
  },
  detail: {
    back: "← Eventos",
    publicPage: "Ver página pública ↗",
    checkinMode: "Modo Check-in",
    saved: "Alterações guardadas.",
    tickets: "Bilhetes",
    seats: "Lugares",
    admitted: "Admitidos",
    admittedSeats: "Lug. in",
    revenue: "Receita",
    eventDetails: "Detalhes do evento",
    saveChanges: "Guardar alterações",
    ticketPreview: "Pré-visualização do bilhete",
    previewBody:
      "Mostra como o bilhete digital será apresentado ao comprador. Os dados reais (nome, serial, QR) são gerados na emissão.",
    coverImage: "Imagem de capa",
    currentImageAlt: "Imagem atual",
    removeImage: "Remover imagem",
    noCover: "Sem imagem de capa definida.",
    uploadImage: "Carregar imagem (JPG, PNG, WEBP ou GIF — máx. 5MB)",
    sendImage: "Enviar imagem",
    tiers: "Tiers",
    noTiers: "Sem tiers configuradas.",
    name: "Nome",
    description: "Descrição",
    price: "Preço",
    limit: "Limite",
    save: "Guardar",
    delete: "Apagar",
    addTier: "Adicionar tier",
    tierNamePlaceholder: "Nome",
    tierPricePlaceholder: "Preço em €",
    tierDescriptionPlaceholder: "Descrição (opcional)",
    tierQuantityPlaceholder: "Limite de unidades (opcional)",
    stripePricePlaceholder: "Stripe Price ID (opcional — price_...)",
    payments: "Pagamentos",
    receivedStripe: "Recebido (Stripe)",
    pendingPayments: "Pagamentos pendentes",
    totalPayments: "Total de pagamentos",
    noPayments: "Ainda sem pagamentos.",
    date: "Data",
    buyer: "Comprador",
    tier: "Tier",
    shortSeats: "Lug.",
    amount: "Montante",
    status: "Estado",
    issuedTickets: "Bilhetes emitidos",
    noTickets: "Sem bilhetes ainda.",
    serial: "Serial",
    qr: "QR",
    view: "Ver",
    admit: "Admitir",
    undo: "Anular",
    qrTitle: (name) =>
      `QR do bilhete de ${name} — mostre ao cliente para aceder no telemóvel`,
    issueManual: "Emitir bilhete manual",
    buyerName: "Nome do comprador",
    emailOptional: "Email (opcional)",
    phoneOptional: "Telemóvel (opcional)",
    marketingConsent:
      "Consentiu receber comunicações sobre futuros eventos da WEPAC (RGPD)",
    issueTicket: "Emitir bilhete",
    fallbackTier: "Bilhete",
    previewBuyer: "Maria Exemplo",
  },
};

const enUS: TicketAdminCopy = {
  layout: {
    events: "Events",
    admins: "Admins",
    signOut: "Sign out",
  },
  dashboard: {
    verifiedWelcome: "Email confirmed. Welcome to WEPAC Tickets.",
    title: "Events",
    newEvent: "+ New event",
    empty: "You have no events yet. Create a new event to get started.",
    tableTitle: "Title",
    departmentBrand: "Department · Brand",
    date: "Date",
    tickets: "Tickets",
    status: "Status",
    paymentStatusLabels: {
      pending: "Pending",
      completed: "Completed",
      expired: "Expired",
      failed: "Failed",
      refunded: "Refunded",
    },
    manage: "Manage",
    statusLabels: {
      draft: "Draft",
      published: "Published",
      cancelled: "Cancelled",
      completed: "Completed",
    },
  },
  admins: {
    back: "← Events",
    title: "Administrators",
    introductionBefore:
      "All administrators have the same permissions. To add someone new, share the",
    registrationPage: "registration page",
    introductionAfter:
      "— the account becomes active only after its @wepac.pt email address is confirmed.",
    deleted: "Admin deleted.",
    name: "Name",
    email: "Email",
    status: "Status",
    createdAt: "Created",
    lastLogin: "Last sign-in",
    self: "(you)",
    verified: "Verified",
    pending: "Pending",
    deleteTitle: "Delete admin",
    delete: "Delete",
  },
  form: {
    title: "Title",
    subtitleOptional: "Subtitle (optional)",
    subtitlePlaceholder: "e.g. Ananda Roda · vihuela",
    description: "Description",
    department: "Department",
    brandOptional: "Brand (optional)",
    noBrand: "— No brand (use department)",
    venue: "Venue",
    venuePlaceholder: "Capela do Hospital de Jesus",
    addressOptional: "Address (optional)",
    start: "Start",
    date: "Date",
    time: "Time",
    doorsOptional: "Doors open (optional)",
    durationMinutes: "Duration (minutes)",
    capacityOptional: "Capacity (optional)",
    coverUrl:
      "Cover-image URL (optional — use the upload below to send a local file)",
    coverPlaceholder: "/api/bilheteira/uploads/... or https://...",
    ticketNote:
      "Ticket reverse text (optional — event-specific editorial copy shown on the digital ticket)",
    ticketNotePlaceholder:
      "E.g. The vihuela pre-dated the guitar by two hundred years...",
    status: "Status",
    ticketTiers: "Ticket types",
    tierNamePlaceholder: "Name (e.g. Ticket)",
    tierPricePlaceholder: "Price in € (0 = free)",
    tierDescriptionPlaceholder: "Description (optional)",
    removeTier: "Remove ticket type",
    addTier: "+ Add ticket type",
    loadingValues: "Loading values…",
    defaultTiers: [
      { name: "Invitation", price: "0", description: "" },
      {
        name: "Student Ticket",
        price: "10",
        description: "Proof of enrolment required.",
      },
      {
        name: "Advance Ticket",
        price: "12",
        description: "Advance purchase at wepac.pt.",
      },
      {
        name: "Standard Ticket",
        price: "17",
        description: "Single admission.",
      },
      {
        name: "Patron Ticket",
        price: "25",
        description: "Supports the programme and the season.",
      },
      { name: "Couple Ticket", price: "30", description: "Two seats." },
      {
        name: "2026 Ticket",
        price: "60",
        description: "Annual pass — full season.",
      },
    ],
  },
  newEvent: {
    eyebrow: "Admin · Events",
    title: "New event",
    submit: "Create event",
  },
  checkin: {
    mode: "Check-in mode",
    admittedCount: (count) => `${count} admitted`,
    totalTickets: (count) => `${count} tickets total`,
    enableCamera: "Turn camera on",
    disableCamera: "Turn camera off",
    serialPlaceholder: "Serial or ID (e.g. BT-001)",
    verify: "Verify",
    verifying: "Verifying...",
    retry: "Try again",
    lookupError: "Error finding ticket",
    actionError: "Error processing ticket",
    cameraError: "We could not access the camera.",
    admitted: "✓ ADMITTED",
    alreadyAdmitted: "✓ ALREADY ADMITTED",
    checkedOut: "↩ CHECK-OUT COMPLETE",
    pending: "PENDING",
    seatCount: (count) => (count === 1 ? "1 seat" : `${count} seats`),
    admittedAt: (time) => `Admitted at ${time}`,
    undoAdmission: "Undo admission",
    admitNow: "Admit now",
    continue: "Continue",
    history: "History",
    at: "at",
  },
  detail: {
    back: "← Events",
    publicPage: "View public page ↗",
    checkinMode: "Check-in mode",
    saved: "Changes saved.",
    tickets: "Tickets",
    seats: "Seats",
    admitted: "Admitted",
    admittedSeats: "Seats in",
    revenue: "Revenue",
    eventDetails: "Event details",
    saveChanges: "Save changes",
    ticketPreview: "Ticket preview",
    previewBody:
      "Shows how the digital ticket will appear to the buyer. Real details (name, serial and QR) are generated when it is issued.",
    coverImage: "Cover image",
    currentImageAlt: "Current image",
    removeImage: "Remove image",
    noCover: "No cover image is set.",
    uploadImage: "Upload image (JPG, PNG, WEBP or GIF — max. 5MB)",
    sendImage: "Upload image",
    tiers: "Ticket types",
    noTiers: "No ticket types configured.",
    name: "Name",
    description: "Description",
    price: "Price",
    limit: "Limit",
    save: "Save",
    delete: "Delete",
    addTier: "Add ticket type",
    tierNamePlaceholder: "Name",
    tierPricePlaceholder: "Price in €",
    tierDescriptionPlaceholder: "Description (optional)",
    tierQuantityPlaceholder: "Unit limit (optional)",
    stripePricePlaceholder: "Stripe Price ID (optional — price_...)",
    payments: "Payments",
    receivedStripe: "Received (Stripe)",
    pendingPayments: "Pending payments",
    totalPayments: "Total payments",
    noPayments: "No payments yet.",
    date: "Date",
    buyer: "Buyer",
    tier: "Ticket type",
    shortSeats: "Seats",
    amount: "Amount",
    status: "Status",
    issuedTickets: "Issued tickets",
    noTickets: "No tickets yet.",
    serial: "Serial",
    qr: "QR",
    view: "View",
    admit: "Admit",
    undo: "Undo",
    qrTitle: (name) =>
      `QR code for ${name}'s ticket — show it to the customer to open on their phone`,
    issueManual: "Issue a manual ticket",
    buyerName: "Buyer name",
    emailOptional: "Email (optional)",
    phoneOptional: "Mobile phone (optional)",
    marketingConsent:
      "Consented to receive communications about future WEPAC events (GDPR)",
    issueTicket: "Issue ticket",
    fallbackTier: "Ticket",
    previewBuyer: "Sample Buyer",
  },
};

const dictionaries: Record<AppLocale, TicketAdminCopy> = {
  "pt-PT": ptPT,
  "en-US": enUS,
};

export function getTicketAdminCopy(locale: string): TicketAdminCopy {
  return dictionaries[locale === "en-US" ? "en-US" : "pt-PT"];
}
