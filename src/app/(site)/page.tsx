import Link from "next/link";
import { events } from "@/data/events";
import { HeroSection } from "@/components/HeroSection";
import { FadeIn } from "@/components/FadeIn";

const departments = [
  {
    name: "Wessex",
    tagline: "Serviços Musicais",
    description:
      "Performances musicais de excelência para eventos privados, corporativos e institucionais. Curadoria artística dedicada.",
    href: "/servicos",
    cta: "Pedir orçamento",
  },
  {
    name: "Easy Peasy",
    tagline: "Educação Artística",
    description:
      "Música e artes performativas em escolas e comunidades. Workshops, residências artísticas e programas curriculares.",
    href: "/projetos/easy-peasy",
    cta: "Saber mais",
  },
  {
    name: "Arte à Capela",
    tagline: "Património e Artes",
    description:
      "Espaços patrimoniais e espirituais transformados em palcos de experiências artísticas únicas.",
    href: "/projetos/arte-a-capela",
    cta: "Saber mais",
  },
  {
    name: "Programa Artistas",
    tagline: "Desenvolvimento Artístico",
    description:
      "Sistema integrado de desenvolvimento, ativação e consolidação de artistas. Excelência artística, estrutura humana, impacto real.",
    href: "/artist",
    cta: "Conhecer o programa",
  },
];

export default function Home() {
  const upcomingEvents = events.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Positioning statement */}
      <section className="bg-wepac-black px-6 py-16 md:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="font-barlow text-2xl font-bold leading-tight text-wepac-white md:text-5xl lg:text-6xl">
              Unimos arte, formação e impacto social para valorizar o património
              e transformar vidas com propostas inovadoras, acessíveis e de
              impacto real.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Department entry points */}
      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              O que fazemos
            </p>
            <h2 className="mt-2 font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              Quatro caminhos, um propósito
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
            {departments.map((dept, i) => (
              <FadeIn key={dept.name} delay={i * 0.1}>
                <Link
                  href={dept.href}
                  className="group flex flex-col justify-between border border-wepac-white/10 p-5 md:p-8 transition-colors hover:border-wepac-white/30 min-h-[200px] md:min-h-[250px]"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-wepac-white/40">
                      {dept.tagline}
                    </p>
                    <h3 className="mt-2 font-barlow text-2xl font-bold text-wepac-white md:text-3xl">
                      {dept.name}
                    </h3>
                    <p className="mt-4 leading-relaxed text-wepac-white/50">
                      {dept.description}
                    </p>
                  </div>
                  <span className="mt-6 inline-block font-barlow text-sm font-bold uppercase tracking-wider text-wepac-white/40 transition-colors group-hover:text-wepac-white">
                    {dept.cta} &rarr;
                  </span>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>


      {/* Proximos Eventos */}
      {upcomingEvents.length > 0 && (
      <section className="bg-wepac-gray px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-black/40">
              Agenda
            </p>
            <h2 className="mt-2 font-barlow text-3xl font-bold text-wepac-black md:text-4xl">
              Próximos eventos
            </h2>
          </FadeIn>

          <div className="mt-12 space-y-6">
            {upcomingEvents.map((event, i) => (
              <FadeIn key={event.id} delay={i * 0.1}>
                <div className="flex flex-col gap-4 border-b border-wepac-black/10 pb-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-wepac-black/40">
                      {event.project}
                    </p>
                    <h3 className="mt-1 font-barlow text-lg font-bold text-wepac-black">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-sm text-wepac-black/60">
                      {event.location}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-barlow text-lg font-bold text-wepac-black">
                      {new Date(event.date).toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="text-sm text-wepac-black/50">{event.time}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div className="mt-10">
              <Link
                href="/programacao"
                className="inline-block border-2 border-wepac-black px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-colors hover:bg-wepac-black hover:text-wepac-white"
              >
                Ver toda a agenda
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
      )}

      {/* CTA */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
              Vamos criar juntos?
            </h2>
            <p className="mt-4 text-lg text-wepac-white/50">
              Parceiros, instituições, escolas, empresas — procuramos quem
              acredite no poder transformador da cultura.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/contacto"
                className="inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
              >
                Contacto
              </Link>
              <Link
                href="/servicos/orcamento"
                className="inline-block border-2 border-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-white transition-colors hover:bg-wepac-white hover:text-wepac-black"
              >
                Orçamento Wessex
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
