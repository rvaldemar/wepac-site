export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  project: string;
  description: string;
  image?: string;
}

const STRIP = process.env.NEXT_PUBLIC_STRIP_MOCK === "true";

export const events: Event[] = STRIP ? [] : [
  {
    id: "1",
    title: "Concerto a Capela — Ensemble de Cordas",
    date: "2026-04-12",
    time: "21:00",
    location: "Igreja de Santo Amaro, Oeiras",
    project: "Arte a Capela",
    description:
      "Uma noite de musica de camara num dos espacos mais emblematicos de Oeiras.",
  },
  {
    id: "2",
    title: "Workshop Easy Peasy — Ritmo e Movimento",
    date: "2026-04-18",
    time: "10:00",
    location: "Escola EB1 de Carcavelos",
    project: "Easy Peasy",
    description:
      "Workshop de percussao e movimento corporal para alunos do 1o ciclo.",
  },
  {
    id: "3",
    title: "Wessex Live — Jazz & Wine",
    date: "2026-05-03",
    time: "20:00",
    location: "Hotel Cascais Miragem, Cascais",
    project: "Wessex",
    description:
      "Uma noite de jazz intimista com curadoria musical WEPAC.",
  },
  {
    id: "4",
    title: "Arte a Capela — Musica Antiga",
    date: "2026-05-15",
    time: "21:30",
    location: "Ermida de Sao Jeronimo, Belem",
    project: "Arte a Capela",
    description:
      "Concerto de musica antiga em instrumentos de epoca.",
  },
];
