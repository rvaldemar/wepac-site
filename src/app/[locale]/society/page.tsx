import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { SocietyFooter } from "@/components/society/SocietyFooter";
import { SocietyHeader } from "@/components/society/SocietyHeader";
import { getSocietyCopy, type SocietyCopy } from "@/i18n/copy/society";

const intakeHref = "/wepacker/intake?source=society";

type SocietyPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: SocietyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const copy = getSocietyCopy(locale);
  const canonical = locale === "en-US" ? "/en/society" : "/society";

  return {
    title: { absolute: copy.meta.title },
    description: copy.meta.description,
    alternates: {
      canonical,
      languages: {
        "pt-PT": "/society",
        "en-US": "/en/society",
        "x-default": "/society",
      },
    },
    openGraph: {
      title: copy.meta.title,
      description: copy.meta.description,
      type: "website",
      locale: locale === "en-US" ? "en_US" : "pt_PT",
      alternateLocale: [locale === "en-US" ? "pt_PT" : "en_US"],
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

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function LifePlanSignal({
  className = "",
  copy,
}: {
  className?: string;
  copy: SocietyCopy;
}) {
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
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute -right-28 top-[14%] h-80 w-80 rounded-full border border-white/10" />
      <div className="absolute -right-10 top-[22%] h-56 w-56 rounded-full border border-white/15" />
      <div className="relative flex h-full flex-col justify-between p-7 sm:p-10 lg:p-12">
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.22em] text-white/40">
          <span>Life Map</span>
          <span>01 — 07</span>
        </div>

        <div className="my-8 flex flex-1 items-center justify-center">
          <div className="relative grid aspect-square w-[min(72%,290px)] place-items-center rounded-full border border-white/25">
            <div className="absolute inset-[13%] rounded-full border border-white/15" />
            <div className="absolute inset-[27%] rounded-full border border-white/20" />
            <div className="relative text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/40">
                {copy.signal.direction}
              </p>
              <p className="mt-2 font-barlow text-3xl font-black uppercase tracking-[-0.03em]">
                Life Plan
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-px bg-white/15">
            {copy.pillars.map((pillar, index) => (
              <div key={pillar} className="bg-black/90 px-3 py-4">
                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/30">
                  0{index + 1}
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/70">
                  {pillar}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-5">
            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/45">
              {copy.signal.nextStep}
            </span>
            <span className="text-2xl text-white/70">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroProofPortrait({ copy }: { copy: SocietyCopy }) {
  return (
    <div className="relative aspect-square overflow-hidden border border-white/15 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
      <div className="absolute left-1/2 top-[-69%] h-[206%] w-[206%] -translate-x-1/2">
        <Image
          src="/images/society/alex-florindo.jpg"
          alt={copy.hero.portraitAlt}
          fill
          sizes="(max-width: 1023px) 100vw, 42vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <p className="absolute inset-x-0 bottom-0 p-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75 sm:p-7">
        {copy.hero.portraitLabel}
      </p>
    </div>
  );
}

export default async function SocietyPage({ params }: SocietyPageProps) {
  const { locale } = await params;
  const copy = getSocietyCopy(locale);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-wepac-gray selection:text-black">
      <SocietyHeader />
      <main>
        <section className="relative isolate min-h-[860px] overflow-hidden border-b border-white/10 px-5 pb-20 pt-32 sm:px-8 lg:min-h-screen lg:px-12 lg:pb-24 lg:pt-40">
          <div className="absolute inset-0 -z-20 bg-black" />
          <div className="absolute inset-y-0 right-0 -z-10 hidden w-[47%] lg:block">
            <LifePlanSignal copy={copy} className="h-full border-y-0 border-r-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black/5" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
            <div className="absolute bottom-[6%] right-[6%] w-[min(76%,560px)]">
              <HeroProofPortrait copy={copy} />
            </div>
          </div>

          <div className="mx-auto grid min-h-[680px] max-w-[1440px] items-end gap-16 lg:grid-cols-[1.2fr_0.8fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-8 max-w-5xl text-balance font-barlow text-[clamp(3.6rem,7.6vw,8.2rem)] font-black uppercase leading-[0.82] tracking-[-0.035em] text-white">
                {copy.hero.title}
              </h1>
              <p className="mt-10 max-w-2xl text-balance font-barlow text-2xl font-bold uppercase leading-tight text-white sm:text-3xl">
                {copy.hero.subtitle}
              </p>
              <p className="mt-5 max-w-2xl text-balance text-lg leading-relaxed text-white/65 sm:text-xl">
                {copy.hero.body}
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={intakeHref}
                  className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
                >
                  {copy.hero.primaryCta}
                </Link>
                <Link
                  href="#life-plan"
                  className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
                >
                  {copy.hero.secondaryCta}
                </Link>
                <Link
                  href="/wepacker/login"
                  className="inline-flex min-h-14 items-center justify-center px-4 text-xs font-bold uppercase tracking-[0.18em] text-white/65 transition-colors hover:text-white"
                >
                  {copy.hero.backpackCta} <span className="ml-2" aria-hidden="true">→</span>
                </Link>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/45">
                {copy.hero.ctaNote}
              </p>
            </FadeIn>

            <div className="lg:hidden">
              <HeroProofPortrait copy={copy} />
            </div>
          </div>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-20 text-black sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/50">
                {copy.proposal.eyebrow}
              </p>
              <div>
                <h2 className="text-balance font-barlow text-4xl font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
                  {copy.proposal.title}
                </h2>
                <p className="mt-8 max-w-3xl text-lg leading-relaxed text-black/65">
                  {copy.proposal.body}
                </p>
              </div>
            </FadeIn>

            <div className="mt-16 grid grid-cols-2 gap-px bg-black/15 sm:grid-cols-3 lg:grid-cols-6">
              {copy.pillars.map((pillar, index) => (
                <FadeIn
                  key={pillar}
                  delay={index * 0.04}
                  className="bg-wepac-gray px-5 py-7"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">
                    0{index + 1}
                  </p>
                  <p className="mt-5 font-barlow text-lg font-bold uppercase">{pillar}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section
          id="life-plan"
          className="scroll-mt-20 border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-36"
        >
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                  {copy.lifePlan.eyebrow}
                </p>
                <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
                  {copy.lifePlan.title}
                </h2>
              </div>
              <div>
                <p className="max-w-3xl text-balance text-2xl leading-snug text-white sm:text-3xl">
                  {copy.lifePlan.lead}
                </p>
                <p className="mt-7 max-w-2xl leading-relaxed text-white/60">
                  {copy.lifePlan.body}
                </p>
              </div>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-white/15 md:grid-cols-2 lg:grid-cols-4">
              {copy.lifePlan.steps.map((step, index) => (
                <FadeIn
                  key={step.name}
                  delay={index * 0.05}
                  className="flex min-h-[270px] flex-col bg-black p-7"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                    {step.index}
                  </p>
                  <h3 className="mt-12 font-barlow text-2xl font-black uppercase tracking-[-0.025em]">
                    {step.name}
                  </h3>
                  <p className="mt-5 flex-1 text-sm leading-relaxed text-white/60">{step.line}</p>
                  {index < copy.lifePlan.steps.length - 1 && (
                    <p className="mt-8 text-xl text-white/25" aria-hidden="true">→</p>
                  )}
                </FadeIn>
              ))}
            </div>

            <FadeIn className="mt-12 flex flex-col gap-5 border-t border-white/15 pt-10 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-relaxed text-white/55">
                {copy.lifePlan.support}
              </p>
              <Link
                href={intakeHref}
                className="inline-flex min-h-14 shrink-0 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                {copy.lifePlan.cta}
              </Link>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-20 text-black sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                {copy.applications.eyebrow}
              </p>
              <div>
                <h2 className="text-balance font-barlow text-4xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-6xl">
                  {copy.applications.title}
                </h2>
                <p className="mt-7 max-w-3xl text-lg leading-relaxed text-black/60">
                  {copy.applications.body}
                </p>
              </div>
            </FadeIn>
            <div className="mt-14 grid gap-px bg-black/15 sm:grid-cols-2 lg:grid-cols-4">
              {copy.applications.items.map((item, index) => (
                <FadeIn
                  key={item.name}
                  delay={index * 0.04}
                  className="min-h-[220px] bg-wepac-gray p-6 sm:p-7"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">
                    0{index + 1}
                  </p>
                  <h3 className="mt-8 font-barlow text-2xl font-black uppercase">
                    {item.name}
                  </h3>
                  <p className="mt-4 leading-relaxed text-black/60">{item.line}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                {copy.families.eyebrow}
              </p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.045em] sm:text-7xl">
                {copy.families.title}
              </h2>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/65">
                {copy.families.body}
              </p>
              <p className="mt-6 max-w-xl leading-relaxed text-white/55">
                {copy.families.support}
              </p>
              <Link
                href="/society/familias"
                className="mt-9 inline-flex items-center gap-2 border-b border-white pb-2 text-xs font-bold uppercase tracking-[0.18em]"
              >
                {copy.families.cta} <Arrow />
              </Link>
            </FadeIn>

            <FadeIn delay={0.1} className="relative min-h-[560px] overflow-hidden">
              <Image
                src="/images/society/easy-peasy.jpg"
                alt={copy.families.imageAlt}
                fill
                sizes="(max-width: 1023px) 100vw, 54vw"
                className="origin-top scale-[2] object-cover object-top lg:scale-[1.2]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <p className="absolute inset-x-0 bottom-0 p-7 font-barlow text-2xl font-black uppercase sm:p-10 sm:text-3xl">
                {copy.families.imageLine}
              </p>
            </FadeIn>
          </div>
        </section>

        <section
          id="caminho"
          className="scroll-mt-20 border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
        >
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                  {copy.academy.eyebrow}
                </p>
                <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
                  {copy.academy.title}
                </h2>
              </div>
              <div className="self-end">
                <p className="max-w-2xl text-xl leading-relaxed text-white/75">
                  {copy.academy.lead}
                </p>
                <p className="mt-5 max-w-2xl leading-relaxed text-white/55">
                  {copy.academy.body}
                </p>
              </div>
            </FadeIn>

            <div className="mt-16 border-t border-white/15">
              {copy.academy.stages.map((stage, index) => (
                <FadeIn
                  key={stage.name}
                  delay={index * 0.06}
                  className="grid gap-6 border-b border-white/15 py-9 sm:grid-cols-[0.35fr_0.8fr_0.8fr_1.4fr]"
                >
                  <p className="font-barlow text-4xl font-black tracking-[-0.04em] text-white/35">
                    {stage.range}
                  </p>
                  <div>
                    <p className="font-barlow text-2xl font-bold uppercase">{stage.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/45">
                      {stage.state}
                    </p>
                  </div>
                  <p className="font-barlow text-2xl font-black uppercase text-wepac-gray">
                    {stage.movement}
                  </p>
                  <p className="max-w-xl leading-relaxed text-white/60">{stage.line}</p>
                </FadeIn>
              ))}
            </div>

            <FadeIn className="mt-10">
              <Link
                href="/academy"
                className="inline-flex items-center gap-2 border-b border-white pb-2 text-xs font-bold uppercase tracking-[0.18em]"
              >
                {copy.academy.cta} <Arrow />
              </Link>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                {copy.houses.eyebrow}
              </p>
              <h2 className="mt-6 max-w-4xl text-balance font-barlow text-4xl font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-6xl">
                {copy.houses.title}
              </h2>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-white/15 lg:grid-cols-2">
              <Link href="/academy" className="group relative min-h-[620px] overflow-hidden bg-black">
                <div className="absolute inset-x-0 top-0 h-[185%] origin-top transition duration-700 group-hover:scale-[1.025]">
                  <Image
                    src="/images/society/easy-peasy.jpg"
                    alt={copy.houses.academyAlt}
                    fill
                    sizes="(max-width: 1023px) 100vw, 50vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
                    Discovery · Build · Transform
                  </p>
                  <h3 className="mt-4 font-barlow text-4xl font-black uppercase tracking-[-0.03em] sm:text-5xl">
                    WEPAC Academy
                  </h3>
                  <p className="mt-4 max-w-lg leading-relaxed text-white/70">
                    {copy.houses.academyLine}
                  </p>
                  <span className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                    {copy.houses.academyCta} <Arrow />
                  </span>
                </div>
              </Link>

              <div className="group relative min-h-[620px] overflow-hidden bg-black">
                <Image
                  src="/images/arte-a-capela/hero.jpg"
                  alt={copy.houses.artsAlt}
                  fill
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover object-center transition duration-700 group-hover:scale-[1.025]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
                    {copy.houses.artsLabel}
                  </p>
                  <h3 className="mt-4 font-barlow text-4xl font-black uppercase tracking-[-0.03em] sm:text-5xl">
                    Companhia de Artes
                  </h3>
                  <p className="mt-4 max-w-lg leading-relaxed text-white/70">
                    {copy.houses.artsLine}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
                    <Link
                      href="/wessex"
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]"
                    >
                      {copy.houses.wessexCta} <Arrow />
                    </Link>
                    <Link
                      href="/arte-a-capela"
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]"
                    >
                      {copy.houses.arteCta} <Arrow />
                    </Link>
                    <Link
                      href="/companhia-de-artes"
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/65"
                    >
                      {copy.houses.companyCta} <Arrow />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="plataformas"
          className="scroll-mt-20 border-b border-black/15 bg-white px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                {copy.platform.eyebrow}
              </p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.045em] sm:text-7xl">
                {copy.platform.title}
              </h2>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-black/65">
                {copy.platform.body}
              </p>
              <p className="mt-6 max-w-xl leading-relaxed text-black/55">
                {copy.platform.support}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/wepacker/login"
                  className="inline-flex min-h-14 items-center justify-center bg-black px-7 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black/80"
                >
                  {copy.platform.backpackCta}
                </Link>
                <Link
                  href={intakeHref}
                  className="inline-flex min-h-14 items-center justify-center border border-black/25 px-7 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-black hover:bg-black hover:text-white"
                >
                  {copy.platform.lifePlanCta}
                </Link>
              </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="border border-black/15 bg-[#f4f4f1] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.18)] sm:p-6">
                  <div className="flex items-center justify-between border-b border-black/10 pb-5">
                    <Image
                      src="/logo/email/wepacker-lockup-black.png"
                      alt="WEPACKER"
                      width={180}
                      height={90}
                      className="h-9 w-auto"
                    />
                    <span className="rounded-full border border-black/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em]">
                      My Journey
                    </span>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
                    <div className="bg-black p-6 text-white">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">
                        Basecamp
                      </p>
                      <p className="mt-10 font-barlow text-3xl font-black uppercase">
                        {copy.platform.directionQuestion}
                      </p>
                      <div className="mt-8 h-1.5 overflow-hidden bg-white/15">
                        <div className="h-full w-[62%] bg-wepac-gray" />
                      </div>
                      <p className="mt-3 text-xs text-white/50">{copy.platform.inMotion}</p>
                    </div>
                    <div className="grid gap-4">
                      {["Trails", "Actions", "Sessions"].map((label, index) => (
                        <div key={label} className="border border-black/10 bg-white p-4">
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/40">
                            0{index + 1}
                          </p>
                          <p className="mt-4 font-barlow text-lg font-bold uppercase">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>

            <div className="mt-20 grid gap-px bg-black/15 lg:grid-cols-3">
              {copy.platform.products.map((item) => {
                const href =
                  item.href === "backpack"
                    ? "/wepacker/login"
                    : item.href === "upgraded"
                      ? "/wepacker/intake?source=upgraded-backpack"
                      : intakeHref;

                return (
                <FadeIn
                  key={item.name}
                  className="flex min-h-[360px] flex-col bg-white p-7 sm:p-9"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-barlow text-4xl font-black text-black/20">
                      {item.index}
                    </span>
                    <span className="border border-black/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-black/55">
                      {item.state}
                    </span>
                  </div>
                  <h3 className="mt-14 font-barlow text-3xl font-black uppercase tracking-[-0.025em]">
                    {item.name}
                  </h3>
                  <p className="mt-5 flex-1 leading-relaxed text-black/60">{item.line}</p>
                  <Link
                    href={href}
                    className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-black"
                  >
                    {item.cta} <span aria-hidden="true">→</span>
                  </Link>
                </FadeIn>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="organizations"
          className="scroll-mt-20 border-b border-black/15 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32"
        >
          <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                {copy.organizations.eyebrow}
              </p>
              <h2 className="mt-6 max-w-5xl text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.045em] sm:text-7xl">
                {copy.organizations.title}
              </h2>
              <p className="mt-8 max-w-3xl text-lg leading-relaxed text-black/65">
                {copy.organizations.body}
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/wepacker/intake?source=organizations"
                  className="inline-flex min-h-14 items-center justify-center bg-black px-7 text-center text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black/80"
                >
                  {copy.organizations.primaryCta}
                </Link>
                <Link
                  href={intakeHref}
                  className="inline-flex min-h-14 items-center justify-center border border-black/25 px-7 text-center text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-black hover:bg-black hover:text-white"
                >
                  {copy.organizations.secondaryCta}
                </Link>
              </div>
            </FadeIn>
            <FadeIn
              delay={0.1}
              className="border border-black/15 bg-white p-7 sm:p-10"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">
                {copy.organizations.privacyEyebrow}
              </p>
              <h3 className="mt-8 font-barlow text-3xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-4xl">
                {copy.organizations.privacyTitle}
              </h3>
              <p className="mt-6 leading-relaxed text-black/60">
                {copy.organizations.privacyBody}
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-px bg-white/15 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  src: "/images/society/proof-jiu-jitsu.jpg",
                  imageClass: "object-cover",
                },
                {
                  src: "/images/society/proof-alvaro-luis.jpg",
                  imageClass: "object-cover object-top",
                },
                {
                  src: "/images/society/proof-alex-podium.jpg",
                  imageClass: "object-cover",
                },
                {
                  src: "/images/society/proof-jotta-pe.jpg",
                  imageClass: "object-cover",
                },
              ].map(({ src, imageClass }, index) => (
                <FadeIn
                  key={src}
                  delay={index * 0.05}
                  className="group relative aspect-[4/5] overflow-hidden bg-[#080808]"
                >
                  <Image
                    src={src}
                    alt={copy.proof.media[index].alt}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
                    className={`${imageClass} transition duration-700 group-hover:scale-[1.02]`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <p className="absolute inset-x-0 bottom-0 p-6 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 sm:p-7">
                    {copy.proof.media[index].label}
                  </p>
                </FadeIn>
              ))}
            </div>

            <div className="mt-16 grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <FadeIn className="grid gap-px bg-white/15 sm:grid-cols-3 lg:grid-cols-1">
                {copy.proof.stats.map((stat, index) => (
                  <div key={stat.label} className="bg-black p-7 sm:p-9">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                      0{index + 1}
                    </p>
                    <p className="mt-6 break-words font-barlow text-[clamp(2.8rem,7vw,6.5rem)] font-black uppercase leading-[0.82] tracking-[-0.045em]">
                      {stat.value}
                    </p>
                    <p className="mt-4 max-w-sm text-sm uppercase tracking-[0.12em] text-white/55">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </FadeIn>
              <FadeIn delay={0.1}>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                  {copy.proof.eyebrow}
                </p>
                <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                  {copy.proof.title}
                </h2>
                <p className="mt-8 text-xl leading-relaxed text-white/75">
                  {copy.proof.body}
                </p>
                <p className="mt-6 leading-relaxed text-white/55">
                  {copy.proof.support}
                </p>
              </FadeIn>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[0.7fr_1.3fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                {copy.packs.eyebrow}
              </p>
              <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                {copy.packs.title}
              </h2>
              <p className="mt-8 max-w-lg leading-relaxed text-white/60">
                {copy.packs.body}
              </p>
              <p className="mt-6 max-w-lg leading-relaxed text-white/45">
                {copy.packs.support}
              </p>
            </FadeIn>

            <div className="grid gap-px bg-white/15 sm:grid-cols-2">
              {copy.packs.items.map((pack, index) => (
                <FadeIn
                  key={pack.name}
                  delay={index * 0.05}
                  className="min-h-[260px] bg-black p-7 sm:p-9"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                    {copy.packs.cardLabel} · 0{index + 1}
                  </p>
                  <h3 className="mt-10 font-barlow text-3xl font-black uppercase">
                    Pack {pack.name}
                  </h3>
                  <p className="mt-5 max-w-md leading-relaxed text-white/60">{pack.line}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section
          id="mission"
          className="scroll-mt-20 border-b border-white/10 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32"
        >
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
                  {copy.mission.eyebrow}
                </p>
                <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                  {copy.mission.title}
                </h2>
              </div>
              <div className="space-y-8 lg:pt-16">
                <p className="text-2xl leading-snug text-black/80 sm:text-3xl">
                  {copy.mission.lead}
                </p>
                <p className="leading-relaxed text-black/60">
                  {copy.mission.body}
                </p>
              </div>
            </FadeIn>

            <div className="mt-16 grid gap-px bg-black/15 lg:grid-cols-3">
              {copy.mission.doors.map((door, index) => (
                <div key={door.name} className="bg-wepac-gray p-7 sm:p-9">
                  <p className="font-barlow text-4xl font-black text-black/20">0{index + 1}</p>
                  <h3 className="mt-8 font-barlow text-2xl font-black uppercase">{door.name}</h3>
                  <p className="mt-4 leading-relaxed text-black/60">{door.line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden px-5 py-28 sm:px-8 lg:px-12 lg:py-44">
          <div className="absolute inset-0 -z-20">
            <Image
              src="/images/wessex/detail.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[35%_center] opacity-25 sm:object-center"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-black/65" />
          <FadeIn className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
              {copy.closing.eyebrow}
            </p>
            <h2 className="mt-8 text-balance font-barlow text-5xl font-black uppercase leading-[0.88] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
              {copy.closing.title}
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/65">
              {copy.closing.body}
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={intakeHref}
                className="inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                {copy.closing.lifePlanCta}
              </Link>
              <Link
                href="/wepacker/login"
                className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-white hover:bg-white hover:text-black"
              >
                {copy.closing.backpackCta}
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
      <SocietyFooter />
    </div>
  );
}
