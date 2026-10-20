// Ticketing terms and cookie policy. Rendered by /termos and /cookies with
// the same section layout as the privacy policy.

export type LegalSection = { title: string; paragraphs: string[] };

export type LegalPage = {
  metadataTitle: string;
  metadataDescription: string;
  title: string;
  updated: string;
  sections: LegalSection[];
};

export type LegalCopy = {
  terms: LegalPage;
  cookies: LegalPage & { manage: string; manageDone: string };
  footer: {
    privacy: string;
    cookies: string;
    terms: string;
    complaints: string;
  };
  checkoutConsent: { lead: string; terms: string };
};

const ptPT: LegalCopy = {
  terms: {
    metadataTitle: "Termos e Condições da Bilheteira",
    metadataDescription: "Condições de venda de bilhetes e acreditações da WEPAC — Companhia de Artes.",
    title: "Termos e Condições da Bilheteira",
    updated: "Última atualização: 20 de outubro de 2026",
    sections: [
      {
        title: "1. Quem vende",
        paragraphs: [
          "Os bilhetes são vendidos por WEPAC — Companhia de Artes, Lda, NIPC 518 267 342, com sede em Carcavelos, Cascais, Portugal. Contacto: info@wepac.pt.",
        ],
      },
      {
        title: "2. Bilhetes e preços",
        paragraphs: [
          "Os preços são apresentados em euros e são isentos de IVA ao abrigo do art.º 9.º do Código do IVA. Cada bilhete indica o que inclui. Um bilhete de pacote dá direito ao número de lugares indicado; um bilhete de grupo exige o mínimo de lugares indicado.",
          "Alguns bilhetes são vendidos por fases, cada uma com lugares contados. A fase seguinte abre quando a anterior esgota ou é encerrada pela WEPAC. Paga-se o preço da fase em venda no momento da compra; uma mudança de fase não dá direito a diferença de preço.",
          "Códigos de desconto têm as condições indicadas em cada código e, salvo indicação em contrário, não são cumuláveis.",
        ],
      },
      {
        title: "3. Compra e pagamento",
        paragraphs: [
          "O pagamento é feito online através da Stripe (cartão ou Multibanco). Durante o pagamento os lugares ficam reservados até 30 minutos. O bilhete é emitido e enviado por email depois de o pagamento ser confirmado; nos pagamentos por Multibanco, só depois de a referência ser paga.",
          "O bilhete tem um código de entrada (QR) que deve ser apresentado à entrada, impresso ou no telemóvel. Cada código só dá entrada uma vez, para o número de lugares indicado.",
        ],
      },
      {
        title: "4. Trocas, cancelamentos e reembolsos",
        paragraphs: [
          "Por se tratar de serviços de lazer com data marcada, não existe direito de livre resolução (art.º 17.º, n.º 1, alínea l) do Decreto-Lei n.º 24/2014). Os bilhetes não são reembolsáveis por desistência do comprador.",
          "Se o evento for cancelado, ou se mudar de data ou de local, o comprador pode pedir o reembolso integral do valor pago através de info@wepac.pt. Alterações no programa ou nos convidados, comunicadas sempre que possível, não dão direito a reembolso.",
        ],
      },
      {
        title: "5. Candidaturas, Montra do Festival e acreditações",
        paragraphs: [
          "Quando um bilhete inclui o direito de candidatar um trabalho, a candidatura é feita nos termos comunicados depois da compra. A seleção de finalistas e selecionados cabe aos mestres e à WEPAC e não é garantida pela compra. A publicação do trabalho na Montra do Festival, a partilha do contacto e a gravação e uso do vídeo dependem do consentimento dado no formulário de candidatura.",
          "Acreditações e outros bilhetes por pedido são gratuitos e sujeitos a validação pela WEPAC, que pode recusar pedidos que não correspondam à função indicada. A entrada só fica garantida depois da emissão do bilhete.",
        ],
      },
      {
        title: "6. Acesso ao evento",
        paragraphs: [
          "A entrada está sujeita à lotação do espaço e às regras do local. Crianças até aos 6 anos ao colo não pagam bilhete nos bilhetes Família. Os eventos podem ser fotografados e filmados para comunicação da WEPAC; quem não quiser aparecer deve dizê-lo à equipa à entrada.",
        ],
      },
      {
        title: "7. Reclamações e resolução de litígios",
        paragraphs: [
          "Reclamações podem ser enviadas para info@wepac.pt ou apresentadas no Livro de Reclamações Eletrónico (livroreclamacoes.pt).",
          "Em caso de litígio de consumo, o consumidor pode recorrer a uma entidade de resolução alternativa de litígios de consumo, nomeadamente ao CNIACC — Centro Nacional de Informação e Arbitragem de Conflitos de Consumo (cniacc.pt). Mais informação no Portal do Consumidor (consumidor.gov.pt).",
        ],
      },
      {
        title: "8. Dados pessoais e lei aplicável",
        paragraphs: [
          "Os dados da compra são tratados nos termos da Política de Privacidade (wepac.pt/privacidade). Estes termos regem-se pela lei portuguesa.",
        ],
      },
    ],
  },
  cookies: {
    metadataTitle: "Política de Cookies",
    metadataDescription: "Cookies e tecnologias semelhantes usados no site da WEPAC.",
    title: "Política de Cookies",
    updated: "Última atualização: 20 de outubro de 2026",
    manage: "Rever a minha escolha de cookies",
    manageDone: "Escolha apagada. O aviso de cookies volta a aparecer.",
    sections: [
      {
        title: "1. O que usamos",
        paragraphs: [
          "Usamos cookies e armazenamento local do navegador para o site funcionar e, só com a tua aceitação, para medir campanhas.",
        ],
      },
      {
        title: "2. Necessários (sempre ativos)",
        paragraphs: [
          "Sessão de conta WEPACKER e de administração da bilheteira (autenticação), preferência de língua (NEXT_LOCALE), a tua escolha sobre cookies (guardada no navegador) e a campanha de origem da visita durante a sessão (parâmetros UTM, guardados no navegador e associados à compra). Sem estes elementos o site e a compra de bilhetes não funcionam.",
        ],
      },
      {
        title: "3. Marketing (só com aceitação)",
        paragraphs: [
          "Meta Pixel, da Meta Platforms, para medir visitas, inícios de compra e compras vindas de campanhas nas redes sociais. Só é carregado depois de aceitares cookies e pode colocar cookies da Meta (por exemplo, _fbp). Não é usado se recusares.",
        ],
      },
      {
        title: "4. Mudar a escolha",
        paragraphs: [
          "Podes rever a tua escolha a qualquer momento no botão abaixo, ou apagar os cookies nas definições do navegador. Para saber como tratamos dados pessoais, consulta a Política de Privacidade (wepac.pt/privacidade).",
        ],
      },
    ],
  },
  footer: {
    privacy: "Política de Privacidade",
    cookies: "Política de Cookies",
    terms: "Termos e Condições",
    complaints: "Livro de Reclamações",
  },
  checkoutConsent: { lead: "Ao comprar aceitas os", terms: "Termos e Condições da Bilheteira" },
};

const enUS: LegalCopy = {
  terms: {
    metadataTitle: "Ticketing Terms and Conditions",
    metadataDescription: "Terms of sale for tickets and accreditations of WEPAC — Companhia de Artes.",
    title: "Ticketing Terms and Conditions",
    updated: "Last updated: October 20, 2026",
    sections: [
      {
        title: "1. Seller",
        paragraphs: [
          "Tickets are sold by WEPAC — Companhia de Artes, Lda, company no. 518 267 342, based in Carcavelos, Cascais, Portugal. Contact: info@wepac.pt.",
        ],
      },
      {
        title: "2. Tickets and prices",
        paragraphs: [
          "Prices are in euros and VAT-exempt under article 9 of the Portuguese VAT Code. Each ticket states what it includes. A bundle ticket gives the number of seats stated; a group ticket requires the minimum number of seats stated.",
          "Some tickets are sold in phases, each with a set number of seats. The next phase opens when the previous one sells out or is closed by WEPAC. You pay the price of the phase on sale at the time of purchase; a phase change gives no right to a price difference.",
          "Discount codes have the conditions stated for each code and, unless stated otherwise, cannot be combined.",
        ],
      },
      {
        title: "3. Purchase and payment",
        paragraphs: [
          "Payment is made online through Stripe (card or Multibanco). Seats are held for up to 30 minutes during payment. The ticket is issued and emailed once payment is confirmed; for Multibanco, only after the reference is paid.",
          "The ticket has an entry code (QR) to be shown at the door, printed or on a phone. Each code grants entry once, for the number of seats stated.",
        ],
      },
      {
        title: "4. Exchanges, cancellations and refunds",
        paragraphs: [
          "As leisure services on a specific date, tickets carry no right of withdrawal (article 17(1)(l) of Portuguese Decree-Law 24/2014). Tickets are not refundable if the buyer decides not to attend.",
          "If the event is cancelled, or changes date or venue, the buyer may request a full refund through info@wepac.pt. Changes to the programme or guests, announced whenever possible, give no right to a refund.",
        ],
      },
      {
        title: "5. Submissions, Festival Showcase and accreditations",
        paragraphs: [
          "Where a ticket includes the right to submit a work, the submission follows the terms sent after purchase. Finalists and selected artists are chosen by the masters and WEPAC; purchase does not guarantee selection. Publication in the Festival Showcase, sharing of contact details and recording and use of the video depend on the consent given in the submission form.",
          "Accreditations and other request-based tickets are free and subject to approval by WEPAC, which may refuse requests that do not match the stated role. Entry is guaranteed only once the ticket is issued.",
        ],
      },
      {
        title: "6. Event access",
        paragraphs: [
          "Entry is subject to venue capacity and rules. Children up to 6 on a lap don't need a ticket with Family tickets. Events may be photographed and filmed for WEPAC communication; anyone who prefers not to appear should tell the team at the door.",
        ],
      },
      {
        title: "7. Complaints and dispute resolution",
        paragraphs: [
          "Complaints can be sent to info@wepac.pt or filed in the Portuguese electronic complaints book (livroreclamacoes.pt).",
          "In a consumer dispute, consumers may use an alternative dispute resolution entity, namely CNIACC — Centro Nacional de Informação e Arbitragem de Conflitos de Consumo (cniacc.pt). More information on the Consumer Portal (consumidor.gov.pt).",
        ],
      },
      {
        title: "8. Personal data and governing law",
        paragraphs: [
          "Purchase data is processed under the Privacy Policy (wepac.pt/privacidade). These terms are governed by Portuguese law.",
        ],
      },
    ],
  },
  cookies: {
    metadataTitle: "Cookie Policy",
    metadataDescription: "Cookies and similar technologies used on the WEPAC website.",
    title: "Cookie Policy",
    updated: "Last updated: October 20, 2026",
    manage: "Review my cookie choice",
    manageDone: "Choice cleared. The cookie notice will show again.",
    sections: [
      {
        title: "1. What we use",
        paragraphs: [
          "We use cookies and browser storage to run the site and, only with your consent, to measure campaigns.",
        ],
      },
      {
        title: "2. Necessary (always on)",
        paragraphs: [
          "WEPACKER account and ticketing admin session (authentication), language preference (NEXT_LOCALE), your cookie choice (stored in the browser) and the campaign the visit came from during the session (UTM parameters, stored in the browser and linked to the purchase). Without these the site and ticket purchases do not work.",
        ],
      },
      {
        title: "3. Marketing (only with consent)",
        paragraphs: [
          "Meta Pixel, by Meta Platforms, to measure visits, checkout starts and purchases coming from social-media campaigns. It only loads after you accept cookies and may set Meta cookies (for example, _fbp). It is not used if you decline.",
        ],
      },
      {
        title: "4. Changing your choice",
        paragraphs: [
          "You can review your choice at any time with the button below, or delete cookies in your browser settings. For how we handle personal data, see the Privacy Policy (wepac.pt/privacidade).",
        ],
      },
    ],
  },
  footer: {
    privacy: "Privacy Policy",
    cookies: "Cookie Policy",
    terms: "Terms and Conditions",
    complaints: "Complaints Book",
  },
  checkoutConsent: { lead: "By purchasing you accept the", terms: "Ticketing Terms and Conditions" },
};

export function getLegalCopy(locale: string): LegalCopy {
  return locale === "en-US" ? enUS : ptPT;
}
