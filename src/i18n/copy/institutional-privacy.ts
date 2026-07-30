import type { AppLocale } from "@/i18n/routing";

type PrivacySection = {
  title: string;
  paragraphs?: string[];
  bullets?: Array<{ label: string; text: string }>;
  contactLink?: boolean;
  authorityLink?: boolean;
};

type PrivacyCopy = {
  metadataTitle: string;
  metadataDescription: string;
  title: string;
  updated: string;
  sections: PrivacySection[];
};

const ptPT: PrivacyCopy = {
  metadataTitle: "Política de Privacidade",
  metadataDescription:
    "Política de privacidade e proteção de dados da WEPAC.",
  title: "Política de Privacidade",
  updated: "Última atualização: 22 de julho de 2026",
  sections: [
    {
      title: "1. Responsável pelo tratamento",
      paragraphs: [
        "WEPAC — Companhia de Artes, com sede em Carcavelos, Portugal. Para questões de privacidade ou para exercer direitos, contacta-nos através de",
      ],
      contactLink: true,
    },
    {
      title: "2. Dados tratados",
      bullets: [
        {
          label: "Site e contactos:",
          text: "nome, email, telefone, conteúdo de mensagens, detalhes de eventos, candidaturas e histórico do Wessex chat.",
        },
        {
          label: "Conta WEPACKER:",
          text: "identidade, contactos, credenciais protegidas, perfil, avatar, Agreements e registos técnicos de autenticação.",
        },
        {
          label: "My Journey:",
          text: "Stage, Life Map e respetivo histórico, Trails, Goals e Actions.",
        },
        {
          label: "Relações e participação:",
          text: "Connections, Mentorships, Pack Memberships, Cycle Enrollments e Facilitation.",
        },
        {
          label: "Sessions:",
          text: "agenda, participantes, links, presença, discussion points, notas privadas do mentor, notas partilhadas e outcomes.",
        },
        {
          label: "Session Transcript e Debrief:",
          text: "texto integral da Transcript, autoria e data do attachment e drafts estruturados derivados. Estes dados podem conter informação especialmente sensível.",
        },
        {
          label: "Dados técnicos:",
          text: "cookies estritamente necessários, segurança e registos operacionais sem conteúdo privado sempre que possível.",
        },
        {
          label: "Support Preview:",
          text: "identificadores do Admin, Person e Session, finalidade estruturada, digest keyed da referência externa, timestamps e eventos de acesso sem o conteúdo projetado.",
        },
      ],
    },
    {
      title: "3. Finalidades",
      paragraphs: [
        "Tratamos dados para responder a pedidos e candidaturas, prestar os serviços WEPAC, gerir a conta e My Journey, permitir relações e participação explicitamente aceites, organizar Sessions, comunicar informação operacional, proteger a plataforma e cumprir obrigações legais. Qualquer Debrief por AI serve apenas para criar um draft privado sujeito a revisão humana; não publica notas nem cria Actions automaticamente.",
      ],
    },
    {
      title: "4. Fundamentos jurídicos",
      paragraphs: [
        "Conforme a operação, o fundamento pode ser a execução de um contrato ou de diligências pedidas pelo titular, o cumprimento de obrigação legal, interesses legítimos de operação e segurança, ou consentimento específico quando este seja necessário. Um Agreement geral, Pack Membership, Connection ou presença numa Session não vale por si só como consentimento para uma Transcript ou para tratamento AI.",
      ],
    },
    {
      title: "5. Transcript, menores e estado atual",
      paragraphs: [
        "Novos Session Transcript attachments e replacements estão desativados. Só serão ativados quando existirem um pedido de consentimento específico e informado, prova de quem consentiu, verificação de idade e Parent/Guardian quando aplicável, uma regra de conservação concreta e um mecanismo simples de retirada. Apenas o organizer da Session pode remover uma Transcript já existente; essa remoção apaga também o Debrief derivado. O Session Debrief por AI permanece igualmente desativado até certificação técnica e de privacidade.",
      ],
    },
    {
      title: "6. Conservação",
      paragraphs: [
        "Pedidos comerciais e candidaturas são conservados enquanto houver seguimento legítimo e, em regra, não mais de 24 meses após o último contacto. Dados de conta, My Journey, relações e Sessions permanecem enquanto a conta ou relação correspondente estiver ativa e pelo período adicional necessário para resolver pedidos, segurança ou obrigações legais. Atualmente não existe um prazo automático separado para Transcripts existentes; por isso novos attachments estão bloqueados até esse prazo ser definido e aplicado. Um pedido de apagamento é avaliado sem demora indevida, ressalvadas obrigações de conservação e direitos de terceiros.",
        "No Support Preview, o digest da referência fica elegível para redaction quando o grant de 15 minutos expira; o grant é apagado após 30 dias e o audit event sem conteúdo após 365 dias. Num pedido de apagamento, grants ativos são removidos e as referências diretas à Person são anonymized antes da eliminação possível da conta.",
      ],
    },
    {
      title: "7. Destinatários e prestadores",
      paragraphs: [
        "O acesso dentro da WEPAC é limitado à função e à relação necessárias. Podemos usar prestadores de alojamento, email, calendarização, autenticação e AI como subcontratantes. O Wessex chat pode enviar a mensagem necessária ao fornecedor AI configurado. O Session Debrief não envia Transcripts para o Agents Hub enquanto estiver desativado. Não vendemos dados pessoais. Transferências internacionais, quando existam, ficam sujeitas às salvaguardas aplicáveis e podem ser esclarecidas através do contacto acima.",
      ],
    },
    {
      title: "8. Direitos",
      paragraphs: [
        "Nos termos aplicáveis, podes pedir acesso, retificação, apagamento, limitação, portabilidade ou oposição e retirar consentimento sem afetar o tratamento anterior. Podes também apresentar reclamação à Comissão Nacional de Proteção de Dados em",
        "Se o titular for menor, estes direitos podem ser exercidos pelo seu representante legal de acordo com a idade e maturidade.",
      ],
      authorityLink: true,
    },
    {
      title: "9. Cookies e segurança",
      paragraphs: [
        "Usamos cookies necessários para autenticação e funcionamento. Não usamos estes cookies para publicidade comportamental. Aplicamos controlos técnicos e organizativos proporcionais, incluindo HTTPS, autorização por recurso e limitação do conteúdo incluído em logs. Nenhuma medida elimina totalmente o risco; incidentes são tratados de acordo com as obrigações aplicáveis.",
        "O Support Preview de uma Session é read-only e não troca identidade, JWT ou role. O organizer exato só pode projetar um attendee explícito da própria Session. Admin support exige password re-authentication, reason code, ticket digest e um cookie assinado e limitado àquela Session/Person; a projeção Admin não inclui meeting URL, Transcript, Debrief, discussion points nem private notes.",
      ],
    },
  ],
};

const enUS: PrivacyCopy = {
  metadataTitle: "Privacy Policy",
  metadataDescription: "WEPAC's privacy and data-protection policy.",
  title: "Privacy Policy",
  updated: "Last updated: July 22, 2026",
  sections: [
    {
      title: "1. Data controller",
      paragraphs: [
        "WEPAC — Companhia de Artes, based in Carcavelos, Portugal. For privacy questions or to exercise your rights, contact us at",
      ],
      contactLink: true,
    },
    {
      title: "2. Data we process",
      bullets: [
        {
          label: "Website and enquiries:",
          text: "name, email, telephone number, message content, event details, applications and Wessex chat history.",
        },
        {
          label: "WEPACKER account:",
          text: "identity, contact details, protected credentials, profile, avatar, Agreements and technical authentication records.",
        },
        {
          label: "My Journey:",
          text: "Stage, Life Map and its history, Trails, Goals and Actions.",
        },
        {
          label: "Relationships and participation:",
          text: "Connections, Mentorships, Pack Memberships, Cycle Enrollments and Facilitation.",
        },
        {
          label: "Sessions:",
          text: "schedule, participants, links, attendance, discussion points, private mentor notes, shared notes and outcomes.",
        },
        {
          label: "Session Transcript and Debrief:",
          text: "the complete Transcript text, attachment author and date, and derived structured drafts. This data may contain particularly sensitive information.",
        },
        {
          label: "Technical data:",
          text: "strictly necessary cookies, security information and operational records without private content wherever possible.",
        },
        {
          label: "Support Preview:",
          text: "Admin, Person and Session identifiers, structured purpose, a keyed digest of the external reference, timestamps and access events without the projected content.",
        },
      ],
    },
    {
      title: "3. Purposes",
      paragraphs: [
        "We process data to respond to enquiries and applications, provide WEPAC services, manage accounts and My Journey, enable relationships and participation that have been explicitly accepted, organise Sessions, communicate operational information, protect the platform and comply with legal obligations. Any AI Debrief is used only to create a private draft subject to human review; it does not publish notes or create Actions automatically.",
      ],
    },
    {
      title: "4. Legal bases",
      paragraphs: [
        "Depending on the operation, the legal basis may be performance of a contract or steps requested by the data subject, compliance with a legal obligation, legitimate operational and security interests, or specific consent where required. A general Agreement, Pack Membership, Connection or presence in a Session does not, by itself, constitute consent to a Transcript or AI processing.",
      ],
    },
    {
      title: "5. Transcripts, minors and current status",
      paragraphs: [
        "New Session Transcript attachments and replacements are disabled. They will be enabled only when there is a specific, informed consent request, evidence of who consented, age verification and Parent/Guardian involvement where applicable, a concrete retention rule and a simple withdrawal mechanism. Only the Session organizer can remove an existing Transcript; removal also deletes its derived Debrief. AI Session Debrief remains disabled until technical and privacy certification is complete.",
      ],
    },
    {
      title: "6. Retention",
      paragraphs: [
        "Commercial enquiries and applications are retained while legitimate follow-up continues and, as a rule, for no longer than 24 months after the last contact. Account, My Journey, relationship and Session data remains while the corresponding account or relationship is active and for any additional period needed to resolve requests, security matters or legal obligations. There is currently no separate automatic retention period for existing Transcripts; new attachments therefore remain blocked until that period is defined and applied. Erasure requests are assessed without undue delay, subject to retention obligations and third-party rights.",
        "In Support Preview, the reference digest becomes eligible for redaction when the 15-minute grant expires; the grant is deleted after 30 days and the content-free audit event after 365 days. When erasure is requested, active grants are removed and direct references to the Person are anonymized before the account can be deleted.",
      ],
    },
    {
      title: "7. Recipients and service providers",
      paragraphs: [
        "Access within WEPAC is limited to the necessary role and relationship. We may use hosting, email, scheduling, authentication and AI providers as processors. Wessex chat may send the necessary message to the configured AI provider. Session Debrief does not send Transcripts to Agents Hub while disabled. We do not sell personal data. International transfers, where they occur, are subject to applicable safeguards and can be clarified through the contact above.",
      ],
    },
    {
      title: "8. Your rights",
      paragraphs: [
        "Where applicable, you may request access, rectification, erasure, restriction, portability or objection, and withdraw consent without affecting earlier processing. You may also lodge a complaint with Portugal's data-protection authority at",
        "Where the data subject is a minor, these rights may be exercised by their legal representative according to the minor's age and maturity.",
      ],
      authorityLink: true,
    },
    {
      title: "9. Cookies and security",
      paragraphs: [
        "We use cookies required for authentication and operation. We do not use these cookies for behavioural advertising. We apply proportionate technical and organisational controls, including HTTPS, resource-level authorisation and limits on content included in logs. No measure eliminates all risk; incidents are handled in accordance with applicable obligations.",
        "A Session Support Preview is read-only and does not exchange identity, JWT or role. The exact organizer can project only an explicit attendee in their own Session. Admin support requires password re-authentication, a reason code, ticket digest and a signed cookie limited to that Session and Person; the Admin projection excludes the meeting URL, Transcript, Debrief, discussion points and private notes.",
      ],
    },
  ],
};

const dictionaries: Record<AppLocale, PrivacyCopy> = {
  "pt-PT": ptPT,
  "en-US": enUS,
};

export function getPrivacyCopy(locale: string): PrivacyCopy {
  return dictionaries[locale === "en-US" ? "en-US" : "pt-PT"];
}
