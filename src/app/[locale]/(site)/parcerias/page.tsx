import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { getLocale } from "next-intl/server";
import { getInstitutionalPagesCopy } from "@/i18n/copy/institutional-pages";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getInstitutionalPagesCopy(await getLocale()).partnerships;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function ParceriasPage() {
  const copy = getInstitutionalPagesCopy(await getLocale()).partnerships;
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
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              {copy.collaboratorsTitle}
            </h2>
          </FadeIn>
          <div className="mt-8 md:mt-12 grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {copy.collaborators.map((partner, i) => (
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
              {copy.interested}
            </h2>
            <p className="mt-4 text-lg text-wepac-white/50">
              {copy.ctaBody}
            </p>
            <Link
              href="/contacto"
              className="mt-8 inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
            >
              {copy.cta}
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
