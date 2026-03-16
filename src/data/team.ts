export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
}

export const team: TeamMember[] = [
  {
    name: "Direção Artística",
    role: "Direção",
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
    bio: "Gestão logística e produção de eventos e espetáculos.",
  },
  {
    name: "Comunicação",
    role: "Comunicação",
    bio: "Estratégia de comunicação, redes sociais e relações públicas.",
  },
];
