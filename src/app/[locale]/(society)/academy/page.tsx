import type { Metadata } from "next";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import {
  academySurfaceCopy,
  type AcademySurfaceCopy,
} from "@/i18n/copy/society-surfaces";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const copy = academySurfaceCopy[locale].metadata;

  return {
    title: { absolute: copy.title },
    description: copy.description,
    alternates: { canonical: "/academy" },
    openGraph: {
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      url: "/academy",
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

function AcademyContent({ copy }: { copy: AcademySurfaceCopy }) {
  const { curriculum, stages } = copy;

  return (
    <>
      <section className="relative isolate min-h-[800px] overflow-hidden border-b border-white/10 px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pt-40">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/images/society/easy-peasy.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="origin-top -translate-y-[12%] scale-[2] object-cover object-top opacity-55 lg:translate-y-0 lg:scale-100 lg:object-[50%_31%]"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/85 to-black/35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-transparent to-black/40" />

        <FadeIn className="mx-auto flex min-h-[640px] max-w-[1440px] items-end">
          <div className="max-w-5xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/55">
              {copy.hero.eyebrow}
            </p>
            <h1 className="mt-8 text-balance font-barlow text-[clamp(3.5rem,8vw,8rem)] font-black uppercase leading-[0.84] tracking-[-0.05em]">
              {copy.hero.title}
            </h1>
            <p className="mt-9 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
              {copy.hero.body}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/wepacker/intake?source=academy"
                className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                {copy.hero.primaryCta}
              </Link>
              <Link
                href="#stages"
                className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                {copy.hero.secondaryCta}
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="border-b border-white/10 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
              {copy.person.eyebrow}
            </p>
            <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              {copy.person.titleLines.map((line, index) => (
                <span key={line}>
                  {line}
                  {index < copy.person.titleLines.length - 1 && <br />}
                </span>
              ))}
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="lg:pt-14">
            <p className="text-2xl leading-snug text-black/80 sm:text-3xl">
              {copy.person.lead}
            </p>
            <p className="mt-8 max-w-2xl leading-relaxed text-black/60">
              {copy.person.body}
            </p>
          </FadeIn>
        </div>
      </section>

      <section
        id="stages"
        className="scroll-mt-20 border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
      >
        <div className="mx-auto max-w-[1440px]">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              {copy.stagesSection.eyebrow}
            </p>
            <h2 className="mt-6 max-w-4xl font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              {copy.stagesSection.title}
            </h2>
          </FadeIn>
          <div className="mt-16 grid gap-px bg-white/15 lg:grid-cols-3">
            {stages.map((stage, index) => (
              <FadeIn
                key={stage.name}
                delay={index * 0.06}
                className="flex min-h-[430px] flex-col bg-black p-8"
              >
                <div className="flex items-start justify-between">
                  <p className="font-barlow text-5xl font-black tracking-[-0.04em] text-white/25">
                    {stage.years}
                  </p>
                  <span className="border border-white/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
                    {stage.state}
                  </span>
                </div>
                <div className="mt-auto">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-wepac-gray">
                    {stage.mode}
                  </p>
                  <h3 className="mt-3 font-barlow text-3xl font-black uppercase">
                    {stage.name}
                  </h3>
                  <p className="mt-5 leading-relaxed text-white/60">
                    {stage.line}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                {copy.curriculumSection.eyebrow}
              </p>
              <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                {copy.curriculumSection.title}
              </h2>
            </div>
            <p className="max-w-2xl self-end text-lg leading-relaxed text-white/60">
              {copy.curriculumSection.body}
            </p>
          </FadeIn>
          <div className="mt-16 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-3">
            {curriculum.map(([name, line], index) => (
              <div key={name} className="min-h-[220px] bg-black p-7">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                  {copy.curriculumSection.itemPrefix} 0{index + 1}
                </p>
                <h3 className="mt-9 font-barlow text-2xl font-black uppercase">
                  {name}
                </h3>
                <p className="mt-4 leading-relaxed text-white/55">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <FadeIn className="relative aspect-[4/5] overflow-hidden">
            <Image
              src="/images/society/easy-peasy.jpg"
              alt={copy.firstDoor.imageAlt}
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="origin-top scale-[2] object-cover object-top"
            />
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              {copy.firstDoor.eyebrow}
            </p>
            <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              {copy.firstDoor.title}
            </h2>
            <p className="mt-7 text-2xl leading-snug text-white/80">
              {copy.firstDoor.lead}
            </p>
            <p className="mt-6 leading-relaxed text-white/55">
              {copy.firstDoor.body}
            </p>
            <Link
              href="/projetos/easy-peasy"
              className="mt-9 inline-flex items-center gap-2 border-b border-white pb-2 text-xs font-bold uppercase tracking-[0.18em]"
            >
              {copy.firstDoor.cta} <span aria-hidden="true">→</span>
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
        <FadeIn className="mx-auto max-w-5xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
            {copy.closing.eyebrow}
          </p>
          <h2 className="mt-7 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
            {copy.closing.title}
          </h2>
          <p className="mx-auto mt-8 max-w-2xl leading-relaxed text-black/60">
            {copy.closing.body}
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/wepacker/intake?source=academy"
              className="inline-flex min-h-14 items-center justify-center bg-black px-7 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-black/80"
            >
              {copy.closing.primaryCta}
            </Link>
            <Link
              href="/society/familias"
              className="inline-flex min-h-14 items-center justify-center border border-black/25 px-7 text-xs font-bold uppercase tracking-[0.18em] hover:border-black hover:bg-black hover:text-white"
            >
              {copy.closing.secondaryCta}
            </Link>
          </div>
        </FadeIn>
      </section>
    </>
  );
}

export default async function AcademyPage() {
  const locale = (await getLocale()) as AppLocale;
  return <AcademyContent copy={academySurfaceCopy[locale]} />;
}
