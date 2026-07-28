import type { MetadataRoute } from "next";

type SitemapEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

const entries: SitemapEntry[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/society", changeFrequency: "weekly", priority: 1 },
  { path: "/academy", changeFrequency: "monthly", priority: 0.9 },
  { path: "/companhia-de-artes", changeFrequency: "monthly", priority: 0.9 },
  { path: "/wessex", changeFrequency: "monthly", priority: 0.9 },
  { path: "/arte-a-capela", changeFrequency: "weekly", priority: 0.9 },
  { path: "/bilheteira", changeFrequency: "weekly", priority: 0.8 },
  { path: "/society/universidade-verao", changeFrequency: "weekly", priority: 0.9 },
  { path: "/society/adultos", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sobre", changeFrequency: "monthly", priority: 0.8 },
  { path: "/servicos", changeFrequency: "weekly", priority: 0.8 },
  { path: "/servicos/orcamento", changeFrequency: "monthly", priority: 0.8 },
  { path: "/projetos", changeFrequency: "monthly", priority: 0.7 },
  { path: "/projetos/easy-peasy", changeFrequency: "monthly", priority: 0.7 },
  { path: "/programacao", changeFrequency: "weekly", priority: 0.7 },
  { path: "/metodologia", changeFrequency: "monthly", priority: 0.6 },
  { path: "/impacto", changeFrequency: "monthly", priority: 0.6 },
  { path: "/parcerias", changeFrequency: "monthly", priority: 0.6 },
  { path: "/artist", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contacto", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacidade", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://wepac.pt";
  const lastModified = new Date();

  return entries.map((entry) => ({
    url: `${baseUrl}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
