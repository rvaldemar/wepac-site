import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { SocietyFooter } from "@/components/society/SocietyFooter";
import { SocietyHeader } from "@/components/society/SocietyHeader";
import {
  familySurfaceCopy,
  type FamilySurfaceCopy,
} from "@/i18n/copy/society-surfaces";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const copy = familySurfaceCopy[locale].metadata;

  return {
    title: { absolute: copy.title },
    description: copy.description,
    alternates: { canonical: "/society/familias" },
    openGraph: {
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      url: "/society/familias",
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

function FamilySignal({
  className = "",
  copy,
}: {
  className?: string;
  copy: FamilySurfaceCopy["signal"];
}) {
  const people = [
    { className: "left-[8%] top-[14%]", label: copy.person },
    { className: "right-[7%] top-[20%]", label: copy.person },
    { className: "bottom-[13%] left-[16%]", label: copy.person },
  ];

  return (
    <div
      aria-hidden="true"
      className={`relative isolate overflow-hidden border border-white/10 bg-[#080808] ${className}`}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div className="relative flex h-full flex-col p-7 sm:p-10 lg:p-12">
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.22em] text-white/40">
          <span>{copy.individual}</span>
          <span>{copy.shared}</span>
        </div>

        <div className="relative my-8 flex-1">
          <div className="absolute left-1/2 top-1/2 h-px w-[62%] -translate-x-1/2 -rotate-[28deg] bg-white/20" />
          <div className="absolute left-1/2 top-1/2 h-px w-[68%] -translate-x-1/2 rotate-[22deg] bg-white/20" />
          <div className="absolute left-1/2 top-1/2 h-[58%] w-px -translate-x-1/2 -translate-y-1/2 bg-white/20" />

          {people.map((person) => (
            <div
              key={person.className}
              className={`absolute grid aspect-square w-[28%] max-w-32 place-items-center rounded-full border border-white/25 bg-black ${person.className}`}
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">
                {person.label}
              </span>
            </div>
          ))}

          <div className="absolute left-1/2 top-1/2 grid aspect-square w-[38%] max-w-44 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white bg-black text-center">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">
                {copy.journey}
              </p>
              <p className="mt-2 font-barlow text-2xl font-black uppercase">
                {copy.family}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-white/15 text-center">
          {copy.values.map((value) => (
            <div
              key={value}
              className="bg-black/90 px-2 py-4 text-[8px] font-bold uppercase tracking-[0.14em] text-white/55"
            >
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function FamiliesPage() {
  const locale = (await getLocale()) as AppLocale;
  const copy = familySurfaceCopy[locale];
  const { familyMoments, process, stages } = copy;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-wepac-gray selection:text-black">
      <SocietyHeader />
      <main>
        <section className="relative isolate min-h-[840px] overflow-hidden border-b border-white/10 px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-24 lg:pt-40">
          <div className="absolute inset-0 -z-20 bg-black" />
          <div className="absolute inset-y-0 right-0 -z-10 hidden w-[47%] lg:block">
            <FamilySignal
              copy={copy.signal}
              className="h-full border-y-0 border-r-0"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/45 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/35" />
          </div>

          <div className="mx-auto grid min-h-[680px] max-w-[1440px] items-end gap-16 lg:grid-cols-[1.12fr_0.88fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-8 max-w-5xl text-balance font-barlow text-[clamp(3.7rem,8vw,8.2rem)] font-black uppercase leading-[0.84] tracking-[-0.045em]">
                {copy.hero.title}
              </h1>
              <p className="mt-10 max-w-2xl text-balance text-lg leading-relaxed text-white/68 sm:text-xl">
                {copy.hero.body}
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/wepacker/intake?source=familias"
                  className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
                >
                  {copy.hero.primaryCta}
                </Link>
                <Link
                  href="/society/life-plan"
                  className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
                >
                  {copy.hero.secondaryCta}
                </Link>
              </div>
            </FadeIn>

            <FamilySignal
              copy={copy.signal}
              className="aspect-[4/5] lg:hidden"
            />
          </div>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.75fr_1.25fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                {copy.firstTeam.eyebrow}
              </p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                {copy.firstTeam.title}
              </h2>
            </FadeIn>
            <FadeIn delay={0.1} className="lg:pt-14">
              <p className="text-balance text-2xl leading-snug text-black/80 sm:text-3xl">
                {copy.firstTeam.lead}
              </p>
              <p className="mt-8 max-w-2xl leading-relaxed text-black/60">
                {copy.firstTeam.body}
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                {copy.moments.eyebrow}
              </p>
              <h2 className="mt-6 max-w-4xl text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                {copy.moments.title}
              </h2>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-3">
              {familyMoments.map((moment, index) => (
                <FadeIn
                  key={moment.title}
                  delay={index * 0.04}
                  className="flex min-h-[290px] flex-col bg-black p-7 sm:p-8"
                >
                  <p className="font-barlow text-4xl font-black text-white/20">
                    0{index + 1}
                  </p>
                  <div className="mt-auto">
                    <h3 className="font-barlow text-2xl font-black uppercase leading-tight">
                      {moment.title}
                    </h3>
                    <p className="mt-5 text-sm leading-relaxed text-white/58">
                      {moment.line}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-14 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                  {copy.scales.eyebrow}
                </p>
                <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                  {copy.scales.title}
                </h2>
              </div>
              <p className="max-w-2xl self-end text-lg leading-relaxed text-white/60">
                {copy.scales.body}
              </p>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-white/15 lg:grid-cols-2">
              <FadeIn className="min-h-[410px] bg-black p-8 sm:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
                  {copy.scales.personEyebrow}
                </p>
                <h3 className="mt-8 font-barlow text-4xl font-black uppercase">
                  {copy.scales.personTitle}
                </h3>
                <ul className="mt-9 space-y-4 text-sm leading-relaxed text-white/60">
                  {copy.scales.personItems.map((item) => (
                    <li key={item} className="border-t border-white/10 pt-4">
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>

              <FadeIn
                delay={0.08}
                className="min-h-[410px] bg-black p-8 sm:p-10"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
                  {copy.scales.familyEyebrow}
                </p>
                <h3 className="mt-8 font-barlow text-4xl font-black uppercase">
                  {copy.scales.familyTitle}
                </h3>
                <ul className="mt-9 space-y-4 text-sm leading-relaxed text-white/60">
                  {copy.scales.familyItems.map((item) => (
                    <li key={item} className="border-t border-white/10 pt-4">
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
          </div>
        </section>

        <section className="border-b border-black/15 bg-white px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                {copy.ages.eyebrow}
              </p>
              <h2 className="mt-6 max-w-5xl text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                {copy.ages.title}
              </h2>
              <p className="mt-8 max-w-2xl leading-relaxed text-black/60">
                {copy.ages.body}
              </p>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-black/15 lg:grid-cols-3">
              {stages.map((stage, index) => (
                <FadeIn
                  key={stage.name}
                  delay={index * 0.06}
                  className="flex min-h-[390px] flex-col bg-white p-8"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-barlow text-5xl font-black tracking-[-0.04em] text-black/20">
                      {stage.years}
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/40">
                      {stage.state}
                    </span>
                  </div>
                  <div className="mt-auto">
                    <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-black/40">
                      {stage.mode}
                    </p>
                    <h3 className="font-barlow text-3xl font-black uppercase">
                      {stage.name}
                    </h3>
                    <p className="mt-5 leading-relaxed text-black/60">
                      {stage.line}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn className="mt-10">
              <Link
                href="/academy"
                className="inline-flex items-center gap-2 border-b border-black pb-2 text-xs font-bold uppercase tracking-[0.18em]"
              >
                {copy.ages.cta} <span aria-hidden="true">→</span>
              </Link>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                  {copy.processSection.eyebrow}
                </p>
                <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                  {copy.processSection.title}
                </h2>
              </div>
              <p className="max-w-2xl self-end text-lg leading-relaxed text-white/60">
                {copy.processSection.body}
              </p>
            </FadeIn>

            <div className="mt-16 border-y border-white/15">
              {process.map((step, index) => (
                <FadeIn
                  key={step.number}
                  delay={index * 0.04}
                  className="grid gap-5 border-b border-white/15 py-7 last:border-b-0 sm:grid-cols-[0.2fr_0.6fr_1.2fr] sm:items-baseline"
                >
                  <p className="font-barlow text-3xl font-black text-white/20">
                    {step.number}
                  </p>
                  <h3 className="font-barlow text-2xl font-black uppercase">
                    {step.title}
                  </h3>
                  <p className="leading-relaxed text-white/58">{step.line}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.8fr_1.2fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                {copy.privacy.eyebrow}
              </p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                {copy.privacy.title}
              </h2>
            </FadeIn>
            <FadeIn delay={0.1} className="lg:pt-10">
              <div className="space-y-0 border-y border-black/15">
                {copy.privacy.items.map((line) => (
                  <p
                    key={line}
                    className="border-b border-black/15 py-5 leading-relaxed text-black/65 last:border-b-0"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </FadeIn>
          </div>
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
                href="/wepacker/intake?source=familias"
                className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                {copy.closing.primaryCta}
              </Link>
              <Link
                href="/society/life-plan"
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
