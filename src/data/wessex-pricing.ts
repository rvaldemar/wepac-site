export type ServiceType = "cerimonias" | "cocktails" | "experiencia_completa";

export interface Ensemble {
  id: string;
  name: string;
  category: "classical" | "band" | "custom";
  musicians?: number;
  duration?: string;
  prices: Partial<Record<ServiceType, number>>;
  quoteOnly?: boolean;
  description?: string;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  cerimonias: "Cerimónias / Eventos (1h)",
  cocktails: "Cocktails / Copo d'Água (1h)",
  experiencia_completa: "Experiência Completa",
};

export const ensembles: Ensemble[] = [
  {
    id: "solo",
    name: "Solo Instrumental",
    category: "classical",
    prices: { cerimonias: 200, cocktails: 200, experiencia_completa: 300 },
  },
  {
    id: "duetos",
    name: "Duetos",
    category: "classical",
    prices: { cerimonias: 400, cocktails: 400, experiencia_completa: 500 },
  },
  {
    id: "trios",
    name: "Trios",
    category: "classical",
    prices: { cerimonias: 700, cocktails: 700, experiencia_completa: 800 },
  },
  {
    id: "quarteto",
    name: "Quarteto",
    category: "classical",
    prices: { cerimonias: 800, cocktails: 800, experiencia_completa: 1000 },
  },
  {
    id: "quarteto-voz",
    name: "Quarteto + Voz",
    category: "classical",
    prices: { cerimonias: 850, cocktails: 850, experiencia_completa: 1100 },
  },
  {
    id: "orquestra",
    name: "Orquestra",
    category: "classical",
    musicians: 13,
    prices: { cerimonias: 2275, cocktails: 2275, experiencia_completa: 3225 },
  },
  {
    id: "orquestra-voz",
    name: "Orquestra & Voz",
    category: "classical",
    musicians: 14,
    prices: { cerimonias: 2450, cocktails: 2450, experiencia_completa: 3500 },
  },
  {
    id: "som",
    name: "Equipa de Som",
    category: "classical",
    prices: { cerimonias: 200, cocktails: 200, experiencia_completa: 200 },
  },
  {
    id: "banda-jazz",
    name: "Banda Jazz",
    category: "band",
    musicians: 5,
    duration: "2 horas",
    prices: { cocktails: 1300 },
  },
  {
    id: "banda-pop",
    name: "Banda Pop",
    category: "band",
    musicians: 5,
    duration: "2 horas",
    prices: { cocktails: 1300 },
  },
  {
    id: "banda-bossa",
    name: "Banda Bossa",
    category: "band",
    musicians: 5,
    duration: "2 horas",
    prices: { cocktails: 1300 },
  },
  {
    id: "ensemble-personalizado",
    name: "Ensemble Personalizado",
    category: "custom",
    quoteOnly: true,
    description:
      "Combinação à medida de instrumentos e vozes para o seu evento. Orçamento sob consulta.",
    prices: {},
  },
  {
    id: "musica-medida",
    name: "Música sob Medida",
    category: "custom",
    quoteOnly: true,
    description:
      "Composições e arranjos originais criados exclusivamente para o seu evento. Orçamento sob consulta.",
    prices: {},
  },
];

export function getPricingSummaryText(): string {
  let text = "TABELA DE PREÇOS WESSEX\n\n";

  text += "ENSEMBLES CLÁSSICOS (preço por serviço):\n";
  text += "Formato: Nome | Cerimónias/Eventos (1h) | Cocktails/Copo d'Água (1h) | Experiência Completa\n\n";

  for (const e of ensembles.filter((e) => e.category === "classical")) {
    const label = e.musicians ? `${e.name} (${e.musicians} Músicos)` : e.name;
    const cer = e.prices.cerimonias ? `${e.prices.cerimonias}€` : "-";
    const coc = e.prices.cocktails ? `${e.prices.cocktails}€` : "-";
    const exp = e.prices.experiencia_completa
      ? `${e.prices.experiencia_completa}€`
      : "-";
    text += `${label} | ${cer} | ${coc} | ${exp}\n`;
  }

  text += "\nBANDAS (apenas Cocktails/Copo d'Água, 2 horas):\n";
  for (const e of ensembles.filter((e) => e.category === "band")) {
    text += `${e.name} (${e.musicians} Músicos) | ${e.prices.cocktails}€\n`;
  }

  text += "\nSERVIÇOS SOB CONSULTA:\n";
  for (const e of ensembles.filter((e) => e.category === "custom")) {
    text += `${e.name} — ${e.description}\n`;
  }

  text +=
    "\nNOTAS:\n- A sede da Wessex é em Carcavelos. Para eventos fora da zona de Carcavelos/Lisboa, é cobrada taxa de deslocação com base nos custos Michelin (combustível + portagens) e estadia se necessário.\n- A Experiência Completa inclui cerimónia + cocktail.\n- A Equipa de Som pode ser adicionada a qualquer ensemble por 200€.\n";

  return text;
}
