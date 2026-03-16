import { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";

export const metadata: Metadata = {
  title: "Parcerias",
  description: "Informação para instituições e patrocinadores que queiram colaborar com a WEPAC.",
};

export default function ParceriasPage() {
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              Parcerias
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              Vamos criar
              <br />
              juntos.
            </h1>
            <p className="mt-6 text-lg text-wepac-white/60">
              Procuramos parceiros que acreditem no poder transformador da cultura
              e da educação.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              Com quem colaboramos
            </h2>
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Instituições culturais",
                description:
                  "Museus, teatros, fundações e centros culturais que queiram enriquecer a sua programação.",
              },
              {
                title: "Escolas e autarquias",
                description:
                  "Programas educativos artísticos para escolas, agrupamentos e municípios.",
              },
              {
                title: "Empresas",
                description:
                  "Patrocínio de projetos culturais com impacto social e visibilidade para a marca.",
              },
              {
                title: "Organizadores de eventos",
                description:
                  "Parcerias para festivais, ciclos de concertos e programação cultural.",
              },
              {
                title: "Espaços patrimoniais",
                description:
                  "Programação artística para valorizar e dinamizar espaços históricos.",
              },
              {
                title: "Investigação",
                description:
                  "Colaboração com universidades em projetos de investigação artística e educativa.",
              },
            ].map((partner, i) => (
              <FadeIn key={partner.title} delay={i * 0.1}>
                <div className="border-t border-wepac-white/10 pt-6">
                  <h3 className="font-barlow text-lg font-bold text-wepac-white">
                    {partner.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-wepac-white/60">
                    {partner.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              Interessado?
            </h2>
            <p className="mt-4 text-lg text-wepac-white/50">
              Conte-nos sobre o seu projeto ou ideia. Teremos todo o gosto em
              explorar formas de colaboração.
            </p>
            <Link
              href="/contacto"
              className="mt-8 inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
            >
              Contacte-nos
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
