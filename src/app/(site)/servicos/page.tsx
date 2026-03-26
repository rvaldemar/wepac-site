import { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";

export const metadata: Metadata = {
  title: "Serviços",
  description: "Oferta musical da WEPAC para eventos privados e institucionais.",
};

export default function ServicosPage() {
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Serviços
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              Música para os
              <br />
              seus eventos
            </h1>
            <p className="mt-6 text-lg text-wepac-white/60">
              Performances musicais de excelência com curadoria artística dedicada
              para qualquer ocasião.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {[
              {
                title: "Eventos Corporativos",
                description:
                  "Música ao vivo para eventos empresariais, conferências, jantares de gala e lançamentos de produto.",
              },
              {
                title: "Casamentos & Celebrações",
                description:
                  "Cerimónias e festas com curadoria musical personalizada, do clássico ao contemporâneo.",
              },
              {
                title: "Eventos Institucionais",
                description:
                  "Programação musical para câmaras municipais, museus, fundações e instituições culturais.",
              },
              {
                title: "Curadoria Artística",
                description:
                  "Consultoria e curadoria para festivais, ciclos de concertos e programação cultural.",
              },
            ].map((service, i) => (
              <FadeIn key={service.title} delay={i * 0.1}>
                <div className="border border-wepac-white/10 p-5 md:p-8">
                  <h3 className="font-barlow text-xl font-bold text-wepac-white">
                    {service.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-wepac-white/60">
                    {service.description}
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
              Géneros musicais
            </h2>
            <div className="mt-6 md:mt-8 flex flex-wrap gap-2 md:gap-3">
              {[
                "Música Clássica",
                "Jazz",
                "Fado",
                "Música Contemporânea",
                "World Music",
                "Música Antiga",
                "Música de Câmara",
                "Pop/Rock Acústico",
              ].map((genre) => (
                <span
                  key={genre}
                  className="border border-wepac-white/20 px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm text-wepac-white/70"
                >
                  {genre}
                </span>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="mt-16 text-center">
              <p className="text-lg text-wepac-white/50">
                Simule o investimento para o seu evento.
              </p>
              <Link
                href="/servicos/orcamento"
                className="mt-6 inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
              >
                Simular orcamento
              </Link>
              <Link
                href="/contacto"
                className="mt-3 block text-sm text-wepac-white/40 transition-colors hover:text-wepac-white/60"
              >
                Ou contacte-nos diretamente
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
