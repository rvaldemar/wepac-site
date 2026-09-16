import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { SocietyFooter } from "@/components/society/SocietyFooter";
import { SocietyHeader } from "@/components/society/SocietyHeader";
import { lifePlanSurfaceCopy } from "@/i18n/copy/society-surfaces";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const copy = lifePlanSurfaceCopy[locale].metadata;

  return {
    title: { absolute: copy.title },
    description: copy.description,
    alternates: { canonical: "/society/life-plan" },
    openGraph: {
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      url: "/society/life-plan",
      type: "website",
      locale: locale === "pt-PT" ? "pt_PT" : "en_US",
      images: [
        {
          url: "/logo/og-image.png",
          width: 1200,
          height: 630,
          alt: "WEPAC",
        },
      ],
    },
  };
}

export default async function LifePlanPage() {
  const locale = (await getLocale()) as AppLocale;
  const copy = lifePlanSurfaceCopy[locale];
  const { outcomes, path, situations } = copy;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-wepac-gray selection:text-black">
      <SocietyHeader />
      <main>
        <section className="relative isolate min-h-[820px] overflow-hidden border-b border-white/10 px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-24 lg:pt-40">
          <div className="absolute inset-0 -z-20 bg-black" />
          <div className="absolute inset-y-0 right-0 -z-10 w-full opacity-45 lg:w-[44%]">
            <div className="absolute left-[18%] top-[14%] h-[72%] w-px bg-gradient-to-b from-transparent via-white/60 to-transparent" />
            <div className="absolute left-[18%] top-[23%] h-px w-[48%] bg-white/20" />
            <div className="absolute left-[18%] top-[48%] h-px w-[65%] bg-white/20" />
            <div className="absolute left-[18%] top-[72%] h-px w-[38%] bg-white/20" />
            <div className="absolute left-[18%] top-[22.4%] h-3 w-3 -translate-x-1/2 rounded-full border border-white bg-black" />
            <div className="absolute left-[18%] top-[47.4%] h-3 w-3 -translate-x-1/2 rounded-full border border-white bg-black" />
            <div className="absolute left-[18%] top-[71.4%] h-3 w-3 -translate-x-1/2 rounded-full bg-white" />
          </div>

          <FadeIn className="mx-auto flex min-h-[650px] max-w-[1440px] items-end">
            <div className="max-w-6xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-8 max-w-6xl text-balance font-barlow text-[clamp(3.45rem,7.8vw,8rem)] font-black uppercase leading-[0.84] tracking-[-0.045em]">
                {copy.hero.titleLines.map((line, index) => (
                  <span key={line}>
                    {line}
                    {index < copy.hero.titleLines.length - 1 && <br />}
                  </span>
                ))}
              </h1>
              <p className="mt-10 max-w-2xl text-balance text-lg leading-relaxed text-white/68 sm:text-xl">
                {copy.hero.body}
              </p>
              <Link
                href="/wepacker/intake?source=life-plan"
                className="mt-10 inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                {copy.hero.cta}
              </Link>
            </div>
          </FadeIn>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.78fr_1.22fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                {copy.entry.eyebrow}
              </p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                {copy.entry.title}
              </h2>
            </FadeIn>
            <FadeIn delay={0.1} className="lg:pt-14">
              <p className="text-balance text-2xl leading-snug text-black/80 sm:text-3xl">
                {copy.entry.lead}
              </p>
              <p className="mt-8 max-w-2xl leading-relaxed text-black/60">
                {copy.entry.body}
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                {copy.movement.eyebrow}
              </p>
              <h2 className="mt-6 max-w-4xl text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                {copy.movement.title}
              </h2>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {path.map((item, index) => (
                <FadeIn
                  key={item.name}
                  delay={index * 0.05}
                  className="flex min-h-[300px] flex-col bg-black p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-barlow text-4xl font-black text-white/20">
                      {item.number}
                    </span>
                    {index < path.length - 1 && (
                      <span
                        className="text-xl text-white/30"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    )}
                  </div>
                  <div className="mt-auto">
                    <h3 className="font-barlow text-2xl font-black uppercase">
                      {item.name}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-white/58">
                      {item.line}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                  {copy.relevance.eyebrow}
                </p>
                <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                  {copy.relevance.title}
                </h2>
              </div>
              <p className="max-w-2xl self-end text-lg leading-relaxed text-white/60">
                {copy.relevance.body}
              </p>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-white/15 sm:grid-cols-2">
              {situations.map((situation, index) => (
                <FadeIn
                  key={situation.title}
                  delay={index * 0.05}
                  className="min-h-[250px] bg-black p-7 sm:p-9"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                    {copy.relevance.itemPrefix} 0{index + 1}
                  </p>
                  <h3 className="mt-10 font-barlow text-3xl font-black uppercase">
                    {situation.title}
                  </h3>
                  <p className="mt-5 max-w-xl leading-relaxed text-white/60">
                    {situation.line}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-black/15 bg-white px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.88fr_1.12fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                {copy.outcomesSection.eyebrow}
              </p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                {copy.outcomesSection.title}
              </h2>
              <p className="mt-8 max-w-lg leading-relaxed text-black/60">
                {copy.outcomesSection.body}
              </p>
            </FadeIn>
            <div className="border-y border-black/15">
              {outcomes.map((outcome, index) => (
                <FadeIn
                  key={outcome}
                  delay={index * 0.04}
                  className="grid grid-cols-[auto_1fr] gap-6 border-b border-black/15 py-6 last:border-b-0"
                >
                  <span className="font-barlow text-2xl font-black text-black/25">
                    0{index + 1}
                  </span>
                  <p className="text-lg leading-relaxed text-black/75">
                    {outcome}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-px bg-white/15 lg:grid-cols-2">
            <FadeIn className="bg-black p-8 sm:p-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                {copy.privacy.eyebrow}
              </p>
              <h2 className="mt-6 font-barlow text-4xl font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl">
                {copy.privacy.title}
              </h2>
              <div className="mt-8 space-y-5 leading-relaxed text-white/60">
                {copy.privacy.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.08} className="bg-black p-8 sm:p-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                {copy.limits.eyebrow}
              </p>
              <h2 className="mt-6 font-barlow text-4xl font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl">
                {copy.limits.title}
              </h2>
              <div className="mt-8 space-y-5 leading-relaxed text-white/60">
                {copy.limits.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <FadeIn className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
              {copy.continuity.eyebrow}
            </p>
            <h2 className="mt-7 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
              {copy.continuity.title}
            </h2>
            <p className="mx-auto mt-8 max-w-2xl leading-relaxed text-black/60">
              {copy.continuity.body}
            </p>
          </FadeIn>
        </section>

        <section className="px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <FadeIn className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">
              {copy.closing.eyebrow}
            </p>
            <h2 className="mt-8 text-balance font-barlow text-5xl font-black uppercase leading-[0.88] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
              {copy.closing.title}
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/60">
              {copy.closing.body}
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/wepacker/intake?source=life-plan"
                className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                {copy.closing.primaryCta}
              </Link>
              <Link
                href="/society/familias"
                className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                {copy.closing.secondaryCta}
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
      <SocietyFooter />
    </div>
  );
}
