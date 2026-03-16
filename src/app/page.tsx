import Link from "next/link";
import { projects } from "@/data/projects";
import { events } from "@/data/events";
import { HeroSection } from "@/components/HeroSection";
import { FadeIn } from "@/components/FadeIn";

export default function Home() {
  const upcomingEvents = events.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Manifesto */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="font-barlow text-3xl font-bold leading-tight text-wepac-white md:text-5xl lg:text-6xl">
              Unimos arte, formação e impacto social para valorizar o
              património e transformar vidas com propostas inovadoras,
              acessíveis e de impacto real.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Projetos */}
      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Projetos
            </p>
            <h2 className="mt-2 font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              O que fazemos
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {projects.map((project, i) => (
              <FadeIn key={project.slug} delay={i * 0.15}>
                <Link
                  href={`/projetos/${project.slug}`}
                  className="group block"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-wepac-gray/10">
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/5 to-white/0 transition-colors group-hover:from-white/10">
                      <span className="font-barlow text-4xl font-bold text-wepac-white/20 transition-colors group-hover:text-wepac-white/40">
                        {project.name}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-4 font-barlow text-xl font-bold text-wepac-white">
                    {project.name}
                  </h3>
                  <p className="mt-1 text-sm text-wepac-white/50">
                    {project.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-wepac-white/40">
                    {project.description}
                  </p>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Impacto */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Impacto
            </p>
            <h2 className="mt-2 font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              Cultura que transforma
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { number: "500+", label: "Alunos alcançados" },
              { number: "50+", label: "Eventos realizados" },
              { number: "15+", label: "Parceiros" },
              { number: "10+", label: "Espaços patrimoniais" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <p className="font-barlow text-4xl font-bold text-wepac-white md:text-5xl">
                    {stat.number}
                  </p>
                  <p className="mt-2 text-sm text-wepac-white/50">
                    {stat.label}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Próximos Eventos */}
      <section className="bg-wepac-gray px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-black/40">
              Programação
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
                Ver toda a programação
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Parcerias */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
              Vamos criar juntos?
            </h2>
            <p className="mt-4 text-lg text-wepac-white/50">
              Procuramos parceiros que acreditem no poder transformador da
              cultura e da educação.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/parcerias"
                className="inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
              >
                Parcerias
              </Link>
              <Link
                href="/contacto"
                className="inline-block border-2 border-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-white transition-colors hover:bg-wepac-white hover:text-wepac-black"
              >
                Contacto
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
