import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";
import { team } from "@/data/team";

export const metadata: Metadata = {
  title: "A WEPAC",
  description:
    "A WEPAC — Companhia de Artes. Missao, visao, metodologia, impacto e equipa.",
};

export default function SobrePage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              A WEPAC
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl lg:text-7xl">
              Cultura que
              <br />
              transforma.
            </h1>
          </FadeIn>
        </div>
      </section>

      {/* Quem somos */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-lg leading-relaxed text-wepac-white/70 md:text-xl">
              A WEPAC — Companhia de Artes e uma estrutura cultural
              multidisciplinar portuguesa dedicada a criacao de projetos
              artisticos, educativos e comunitarios. Trabalhamos na interseccao
              entre arte, educacao e impacto social, promovendo o acesso a
              cultura e valorizando o patrimonio historico.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Missao, Visao, Valores */}
      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
            <FadeIn>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
                  Missao
                </p>
                <p className="mt-4 font-barlow text-2xl font-bold leading-tight text-wepac-white">
                  Unimos arte, formacao e impacto social para valorizar o
                  patrimonio e transformar vidas com propostas inovadoras,
                  acessiveis e de impacto real.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
                  Visao
                </p>
                <p className="mt-4 font-barlow text-2xl font-bold leading-tight text-wepac-white">
                  Ser referencia em inovacao artistica e educativa, mostrando
                  como a cultura transforma realidades com proximidade e
                  profissionalismo.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
                  Valores
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "Educacao",
                    "Acessibilidade cultural",
                    "Inspiracao artistica",
                    "Comunidade",
                    "Sofisticacao artistica",
                    "Proximidade com o territorio",
                  ].map((value) => (
                    <li
                      key={value}
                      className="font-barlow text-lg font-bold text-wepac-white"
                    >
                      {value}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Metodologia */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Metodologia
            </p>
            <h2 className="mt-2 font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              Como trabalhamos
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-wepac-white/60">
              A WEPAC desenvolve uma metodologia propria que cruza a pratica
              artistica com a educacao e o impacto social.
            </p>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-16 md:grid-cols-3">
            {[
              {
                title: "O Criador",
                subtitle: "Inovacao artistica",
                description:
                  "Exploramos linguagens artisticas contemporaneas e criamos experiencias que desafiam convencoes.",
              },
              {
                title: "O Sabio",
                subtitle: "Visao estrategica",
                description:
                  "Cada projeto e desenhado com rigor metodologico e pensamento critico sobre o papel da cultura na sociedade.",
              },
              {
                title: "O Cuidador",
                subtitle: "Impacto social",
                description:
                  "Trabalhamos com e para as comunidades, garantindo que a arte chega a quem mais precisa.",
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

          <div className="mt-10 md:mt-16 grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Proximidade",
                text: "Escuta ativa do territorio. Cada projeto nasce da relacao com a comunidade.",
              },
              {
                title: "Acessibilidade",
                text: "A cultura deve ser para todos. Formatos inclusivos que eliminam barreiras.",
              },
              {
                title: "Excelencia",
                text: "Profissionalismo em cada detalhe. Padroes elevados de qualidade artistica.",
              },
              {
                title: "Sustentabilidade",
                text: "Modelos que geram valor a longo prazo para as comunidades.",
              },
            ].map((principle, i) => (
              <FadeIn key={principle.title} delay={i * 0.1}>
                <div className="border-l-2 border-wepac-white/20 pl-6">
                  <h3 className="font-barlow text-lg font-bold text-wepac-white">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-wepac-white/60">
                    {principle.text}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Impacto */}
      {process.env.NEXT_PUBLIC_STRIP_MOCK !== "true" && (
        <section className="bg-wepac-gray px-6 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <FadeIn>
              <p className="text-sm font-bold uppercase tracking-widest text-wepac-black/40">
                Impacto
              </p>
              <h2 className="mt-2 font-barlow text-3xl font-bold text-wepac-black md:text-4xl">
                Resultados reais
              </h2>
            </FadeIn>

            <div className="mt-12 md:mt-16 grid grid-cols-2 gap-6 md:gap-12 md:grid-cols-4">
              {[
                {
                  number: "500+",
                  label: "Alunos impactados",
                  detail: "Em programas educativos Easy Peasy",
                },
                {
                  number: "50+",
                  label: "Eventos realizados",
                  detail: "Concertos, workshops e performances",
                },
                {
                  number: "15+",
                  label: "Parceiros",
                  detail: "Instituicoes e escolas parceiras",
                },
                {
                  number: "10+",
                  label: "Espacos patrimoniais",
                  detail: "Valorizados com programacao artistica",
                },
              ].map((stat, i) => (
                <FadeIn key={stat.label} delay={i * 0.1}>
                  <div>
                    <p className="font-barlow text-3xl font-bold text-wepac-black md:text-5xl">
                      {stat.number}
                    </p>
                    <p className="mt-2 font-barlow text-lg font-bold text-wepac-black">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-sm text-wepac-black/50">
                      {stat.detail}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
              {[
                {
                  title: "Educacao",
                  description:
                    "Programas que desenvolvem competencias artisticas, sociais e emocionais em criancas e jovens.",
                },
                {
                  title: "Patrimonio",
                  description:
                    "Valorizacao de espacos patrimoniais atraves da programacao artistica.",
                },
                {
                  title: "Comunidade",
                  description:
                    "Criacao de lacos comunitarios atraves da arte, promovendo a coesao social.",
                },
              ].map((area, i) => (
                <FadeIn key={area.title} delay={i * 0.15}>
                  <div className="border-t-2 border-wepac-black/20 pt-6">
                    <h3 className="font-barlow text-xl font-bold text-wepac-black">
                      {area.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-wepac-black/60">
                      {area.description}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Equipa */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Equipa
            </p>
            <h2 className="mt-2 font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              Quem somos
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <FadeIn key={member.name} delay={i * 0.1}>
                <div>
                  <div className="aspect-square bg-wepac-gray/10" />
                  <h3 className="mt-4 font-barlow text-lg font-bold text-wepac-white">
                    {member.name}
                  </h3>
                  <p className="text-sm text-wepac-white/40">{member.role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-wepac-white/50">
                    {member.bio}
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
