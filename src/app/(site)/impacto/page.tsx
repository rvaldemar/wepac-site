import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";

export const metadata: Metadata = {
  title: "Impacto",
  description: "O impacto social dos projetos WEPAC.",
};

export default function ImpactoPage() {
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Impacto
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              Resultados reais
            </h1>
            <p className="mt-6 text-lg text-wepac-white/60">
              Medimos o nosso sucesso pelo impacto que criamos nas comunidades.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Numbers */}
      <section className="bg-wepac-gray px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
            {[
              { number: "500+", label: "Alunos impactados", detail: "Em programas educativos Easy Peasy" },
              { number: "50+", label: "Eventos realizados", detail: "Concertos, workshops e performances" },
              { number: "15+", label: "Parceiros", detail: "Instituições e escolas parceiras" },
              { number: "10+", label: "Espaços patrimoniais", detail: "Valorizados com programação artística" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div>
                  <p className="font-barlow text-4xl font-bold text-wepac-black md:text-5xl">
                    {stat.number}
                  </p>
                  <p className="mt-2 font-barlow text-lg font-bold text-wepac-black">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-sm text-wepac-black/50">{stat.detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Areas */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              Áreas de impacto
            </h2>
          </FadeIn>
          <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                title: "Educação",
                description:
                  "Programas educativos que desenvolvem competências artísticas, sociais e emocionais em crianças e jovens.",
              },
              {
                title: "Património",
                description:
                  "Valorização de espaços patrimoniais através da programação artística, dando nova vida a monumentos históricos.",
              },
              {
                title: "Comunidade",
                description:
                  "Criação de laços comunitários através da arte, promovendo a coesão social e a participação cultural.",
              },
            ].map((area, i) => (
              <FadeIn key={area.title} delay={i * 0.15}>
                <div className="border-t-2 border-wepac-white/20 pt-6">
                  <h3 className="font-barlow text-xl font-bold text-wepac-white">
                    {area.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-wepac-white/60">
                    {area.description}
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
