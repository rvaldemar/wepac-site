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
    title: "Concerto à Capela — Ensemble de Cordas",
    date: "2026-04-12",
    time: "21:00",
    location: "Capela de São Miguel, Braga",
    project: "Arte à Capela",
    description:
      "Uma noite de música de câmara num dos espaços mais emblemáticos de Braga.",
  },
  {
    id: "2",
    title: "Workshop Easy Peasy — Ritmo e Movimento",
    date: "2026-04-18",
    time: "10:00",
    location: "Escola EB1 de Maximinos",
    project: "Easy Peasy",
    description:
      "Workshop de percussão e movimento corporal para alunos do 1º ciclo.",
  },
  {
    id: "3",
    title: "Wessex Live — Jazz & Wine",
    date: "2026-05-03",
    time: "20:00",
    location: "Hotel Meliã, Braga",
    project: "Wessex",
    description:
      "Uma noite de jazz intimista com curadoria musical WEPAC.",
  },
  {
    id: "4",
    title: "Arte à Capela — Música Antiga",
    date: "2026-05-15",
    time: "21:30",
    location: "Igreja de São Vítor, Braga",
    project: "Arte à Capela",
    description:
      "Concerto de música antiga em instrumentos de época.",
  },
];
