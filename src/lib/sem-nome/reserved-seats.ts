export type ReservedSeat = {
  name: string;
  role: string;
  org: string;
};

export const RESERVED_SEATS: ReservedSeat[] = [
  {
    name: "Daniel Almeida",
    role: "Pastor",
    org: "Igreja Batista Central de Fortaleza",
  },
  {
    name: "Maurício Matos",
    role: "Presidente",
    org: "Câmara Municipal de Aquiraz",
  },
  {
    name: "Katyuscya Matos",
    role: "Acompanhante",
    org: "Câmara Municipal de Aquiraz",
  },
  {
    name: "Giovana Matos",
    role: "Acompanhante",
    org: "Câmara Municipal de Aquiraz",
  },
  {
    name: "José Viana",
    role: "Chefe de Gabinete · Secretaria de Cultura",
    org: "Governo do Estado do Ceará",
  },
  {
    name: "Leandro Maciel",
    role: "Coordenador de Políticas para as Artes",
    org: "Governo do Estado do Ceará",
  },
  {
    name: "Gecíola Fonseca",
    role: "Secretária da Cultura",
    org: "Governo do Estado do Ceará",
  },
  {
    name: "Walker Lira",
    role: "Secretário de Turismo",
    org: "Município de Pacatuba",
  },
  {
    name: "Evandro Aquino",
    role: "Repentista",
    org: "Artista Convidado",
  },
  {
    name: "Acompanhante de Evandro Aquino",
    role: "Convidado de Evandro Aquino",
    org: "Artista Convidado",
  },
  {
    name: "Carlos Eduardo Barbosa Paz",
    role: "Coordenador de Imagem Pública",
    org: "Rotary International",
  },
  {
    name: "Thamires D'Ávila Barbosa Paz",
    role: "Coordenadora de Imagem Pública",
    org: "Rotary International",
  },
  {
    name: "Jotta Pê",
    role: "Violinista",
    org: "WEPAC – Companhia de Artes",
  },
  {
    name: "Valdemar Santos",
    role: "Convidado",
    org: "WEPAC – Companhia de Artes",
  },
  {
    name: "Ligia Santos",
    role: "Convidada",
    org: "Grupo Bergano",
  },
  {
    name: "Rui Santos",
    role: "Convidado",
    org: "Grupo Bergano",
  },
  {
    name: "Carolina Santos",
    role: "Convidada",
    org: "Grupo Bergano",
  },
  {
    name: "Junior Burigo",
    role: "Convidado",
    org: "Grupo Bergano",
  },
  {
    name: "João Burigo",
    role: "Convidado",
    org: "Grupo Bergano",
  },
  {
    name: "Claudvania",
    role: "Convidada",
    org: "Grupo Bergano",
  },
];

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’`´]/g, "")
    .replace(/\s+/g, " ");
}

const INDEX = new Map<string, ReservedSeat>();
for (const r of RESERVED_SEATS) {
  INDEX.set(normalize(r.name), r);
}

export function findReservation(ticketName: string): ReservedSeat | null {
  const q = normalize(ticketName);
  if (!q) return null;

  const exact = INDEX.get(q);
  if (exact) return exact;

  for (const [key, value] of INDEX) {
    if (key.includes(q) || q.includes(key)) return value;
  }

  const qTokens = q.split(" ").filter((t) => t.length >= 3);
  if (qTokens.length >= 2) {
    for (const [key, value] of INDEX) {
      const matches = qTokens.filter((t) => key.includes(t)).length;
      if (matches >= 2) return value;
    }
  }

  return null;
}
