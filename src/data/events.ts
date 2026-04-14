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

export const events: Event[] = [
  {
    id: "1",
    title: "A Voz da Ibéria Antiga",
    date: "2026-04-23",
    time: "19:30",
    location: "Capela do Hospital de Jesus, Lisboa",
    project: "Arte à Capela",
    description:
      "Música profana e sacra ibérica dos séculos XV–XVI, interpretada por Ananda Roda de Miranda na vihuela.",
  },
  {
    id: "2",
    title: "Sopros d'Agora",
    date: "2026-05-21",
    time: "19:30",
    location: "Capela do Hospital de Jesus, Lisboa",
    project: "Arte à Capela",
    description:
      "Carla Costeira (saxofone) apresenta um diálogo entre som, cor e paisagem.",
  },
];
