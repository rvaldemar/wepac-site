import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";

export const metadata: Metadata = {
  title: "Metodologia",
  description: "A metodologia educativa e artística da WEPAC.",
};

export default function MetodologiaPage() {
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Metodologia
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              Como trabalhamos
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-8 text-lg leading-relaxed text-wepac-white/70">
              A WEPAC desenvolve uma metodologia própria que cruza a prática artística
              com a educação e o impacto social. Acreditamos que a cultura é um motor
              de transformação e que a formação artística deve ser acessível a todos.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
            {[
              {
                title: "O Criador",
                subtitle: "Inovação artística",
                description:
                  "Inovação, imaginação e construção de novos formatos culturais. Exploramos linguagens artísticas contemporâneas e criamos experiências que desafiam convenções.",
              },
              {
                title: "O Sábio",
                subtitle: "Visão estratégica",
                description:
                  "Estrutura, sabedoria e visão estratégica de longo prazo. Cada projeto é desenhado com rigor metodológico e pensamento crítico sobre o papel da cultura na sociedade.",
              },
              {
                title: "O Cuidador",
                subtitle: "Impacto social",
                description:
                  "Cuidado, empatia, inclusão e impacto social real. Trabalhamos com e para as comunidades, garantindo que a arte chega a quem mais precisa.",
              },
            ].map((pillar, i) => (
              <FadeIn key={pillar.title} delay={i * 0.15}>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
                    {pillar.subtitle}
                  </p>
                  <h3 className="mt-2 font-barlow text-3xl font-bold text-wepac-white">
                    {pillar.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-wepac-white/60">
                    {pillar.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              Princípios
            </h2>
          </FadeIn>
          <div className="mt-12 space-y-8">
            {[
              {
                title: "Proximidade",
                text: "Trabalhamos lado a lado com as comunidades, escolas e instituições. Cada projeto nasce de uma escuta ativa do território.",
              },
              {
                title: "Acessibilidade",
                text: "A cultura deve ser para todos. Desenhamos formatos inclusivos que eliminam barreiras de acesso à experiência artística.",
              },
              {
                title: "Excelência",
                text: "Profissionalismo em cada detalhe. Da produção à performance, mantemos padrões elevados de qualidade artística.",
              },
              {
                title: "Sustentabilidade",
                text: "Projetos com impacto duradouro. Apostamos em modelos que geram valor a longo prazo para as comunidades.",
              },
            ].map((principle, i) => (
              <FadeIn key={principle.title} delay={i * 0.1}>
                <div className="border-l-2 border-wepac-white/20 pl-6">
                  <h3 className="font-barlow text-xl font-bold text-wepac-white">
                    {principle.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-wepac-white/60">
                    {principle.text}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
