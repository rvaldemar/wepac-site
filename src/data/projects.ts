export interface Project {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  image: string;
  highlights: string[];
}

export const projects: Project[] = [
  {
    slug: "easy-peasy",
    name: "Easy Peasy",
    tagline: "Música e artes para os mais jovens",
    description:
      "Projeto educativo focado em música e artes para crianças e jovens em escolas e comunidades.",
    longDescription:
      "O Easy Peasy é o projeto educativo da WEPAC que leva a música e as artes performativas a escolas e comunidades. Através de workshops, residências artísticas e programas curriculares, criamos experiências que despertam a criatividade e promovem o desenvolvimento pessoal dos mais jovens. Acreditamos que a educação artística é um motor de transformação social.",
    image: "/images/easy-peasy.jpg",
    highlights: [
      "Workshops em escolas",
      "Residências artísticas",
      "Programas curriculares",
      "Formação de professores",
    ],
  },
  {
    slug: "arte-a-capela",
    name: "Arte à Capela",
    tagline: "Arte em espaços de património",
    description:
      "Programação artística em espaços patrimoniais e espirituais, valorizando o património histórico.",
    longDescription:
      "O Arte à Capela transforma espaços patrimoniais e espirituais em palcos de experiências artísticas únicas. Capelas, igrejas e monumentos históricos ganham nova vida através de concertos, instalações e performances que criam um diálogo entre o passado e o presente. Este projeto valoriza o património ao mesmo tempo que o torna acessível a novos públicos.",
    image: "/images/arte-a-capela.jpg",
    highlights: [
      "Concertos em capelas e igrejas",
      "Instalações artísticas",
      "Valorização do património",
      "Experiências imersivas",
    ],
  },
  {
    slug: "wessex",
    name: "Wessex",
    tagline: "Performances musicais de excelência",
    description:
      "Performances musicais para eventos privados e institucionais, com curadoria artística dedicada.",
    longDescription:
      "O Wessex é o braço de serviços musicais da WEPAC, oferecendo performances de excelência para eventos privados, corporativos e institucionais. Com uma rede de músicos profissionais e curadoria artística dedicada, criamos experiências sonoras únicas que elevam qualquer ocasião. Da música clássica ao jazz, do fado à música contemporânea.",
    image: "/images/wessex.jpg",
    highlights: [
      "Eventos corporativos",
      "Casamentos e celebrações",
      "Eventos institucionais",
      "Curadoria artística",
    ],
  },
];
