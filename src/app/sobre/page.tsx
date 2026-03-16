import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";
import { team } from "@/data/team";

export const metadata: Metadata = {
  title: "A WEPAC",
  description: "Conheça a WEPAC — Companhia de Artes. A nossa história, missão, visão e equipa.",
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
              A WEPAC — Companhia de Artes é uma estrutura cultural multidisciplinar
              dedicada à criação de projetos artísticos, educativos e comunitários.
              Trabalhamos na intersecção entre arte, educação e impacto social,
              promovendo o acesso à cultura e valorizando o património histórico.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Missão, Visão, Valores */}
      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
            <FadeIn>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
                  Missão
                </p>
                <p className="mt-4 font-barlow text-2xl font-bold leading-tight text-wepac-white">
                  Unir arte, formação e impacto social para transformar comunidades.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
                  Visão
                </p>
                <p className="mt-4 font-barlow text-2xl font-bold leading-tight text-wepac-white">
                  Ser uma referência em inovação cultural e educativa com impacto social real.
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
                    "Educação",
                    "Acessibilidade cultural",
                    "Inspiração artística",
                    "Comunidade",
                    "Sofisticação artística",
                    "Proximidade com o território",
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
