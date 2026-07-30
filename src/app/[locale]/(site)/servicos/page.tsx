import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { getLocale } from "next-intl/server";
import { getInstitutionalPagesCopy } from "@/i18n/copy/institutional-pages";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getInstitutionalPagesCopy(await getLocale()).services;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function ServicosPage() {
  const copy = getInstitutionalPagesCopy(await getLocale()).services;
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              {copy.titleLine1}
              <br />
              {copy.titleLine2}
            </h1>
            <p className="mt-6 text-lg text-wepac-white/60">
              {copy.introduction}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {copy.services.map((service, i) => (
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
              {copy.genresTitle}
            </h2>
            <div className="mt-6 md:mt-8 flex flex-wrap gap-2 md:gap-3">
              {copy.genres.map((genre) => (
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
                {copy.calculatorLead}
              </p>
              <Link
                href="/servicos/orcamento"
                className="mt-6 inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
              >
                {copy.calculatorCta}
              </Link>
              <Link
                href="/contacto"
                className="mt-3 block text-sm text-wepac-white/40 transition-colors hover:text-wepac-white/60"
              >
                {copy.contactCta}
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
