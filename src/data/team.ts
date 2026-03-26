export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
}

const STRIP = process.env.NEXT_PUBLIC_STRIP_MOCK === "true";

export const team: TeamMember[] = STRIP ? [] : [
  {
    name: "Direcção Artística",
    role: "Direcção",
    bio: "Responsável pela visão criativa e curadoria de todos os projetos WEPAC.",
  },
  {
    name: "Coordenação Pedagógica",
    role: "Educação",
    bio: "Desenvolvimento e supervisão dos programas educativos Easy Peasy.",
  },
  {
    name: "Produção",
    role: "Produção",
    bio: "Gestão logística e produção de eventos e espectáculos.",
  },
  {
    name: "Comunicação",
    role: "Comunicação",
    bio: "Estratégia de comunicação, redes sociais e relações públicas.",
  },
];
