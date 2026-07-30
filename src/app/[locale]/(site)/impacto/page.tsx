import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";
import { getLocale } from "next-intl/server";
import { getInstitutionalPagesCopy } from "@/i18n/copy/institutional-pages";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getInstitutionalPagesCopy(await getLocale()).impact;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function ImpactoPage() {
  const copy = getInstitutionalPagesCopy(await getLocale()).impact;
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 text-lg text-wepac-white/60">
              {copy.introduction}
            </p>
          </FadeIn>
        </div>
      </section>


      {/* Areas */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              {copy.areasTitle}
            </h2>
          </FadeIn>
          <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
            {copy.areas.map((area, i) => (
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
