import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";
import { getLocale } from "next-intl/server";
import { getInstitutionalPagesCopy } from "@/i18n/copy/institutional-pages";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getInstitutionalPagesCopy(await getLocale()).about;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function SobrePage() {
  const copy = getInstitutionalPagesCopy(await getLocale()).about;
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl lg:text-7xl">
              {copy.heroLine1}
              <br />
              {copy.heroLine2}
            </h1>
          </FadeIn>
        </div>
      </section>

      {/* Quem somos */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-lg leading-relaxed text-wepac-white/70 md:text-xl">
              {copy.introduction}
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
                  {copy.mission}
                </p>
                <p className="mt-4 font-barlow text-2xl font-bold leading-tight text-wepac-white">
                  {copy.missionBody}
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
                  {copy.vision}
                </p>
                <p className="mt-4 font-barlow text-2xl font-bold leading-tight text-wepac-white">
                  {copy.visionBody}
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
                  {copy.values}
                </p>
                <ul className="mt-4 space-y-2">
                  {copy.valuesList.map((value) => (
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
              {copy.methodology}
            </p>
            <h2 className="mt-2 font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              {copy.howWeWork}
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-wepac-white/60">
              {copy.methodologyBody}
            </p>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-16 md:grid-cols-3">
            {copy.pillars.map((pillar, i) => (
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
            {copy.principles.map((principle, i) => (
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


    </div>
  );
}
