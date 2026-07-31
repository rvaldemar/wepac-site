import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { SocietyFooter } from "@/components/society/SocietyFooter";
import { SocietyHeader } from "@/components/society/SocietyHeader";
import { getSocietyCopy } from "@/i18n/copy/society";

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
      images: [{ url: "/logo/og-image.png", width: 1200, height: 630, alt: "WEPAC" }],
    },
  };
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function ProofImage({
  src,
  alt,
  label,
  className,
}: {
  src: string;
  alt: string;
  label: string;
  className?: string;
}) {
  return (
    <div className="group relative aspect-[4/5] overflow-hidden bg-[#080808]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
        className={`object-cover transition duration-700 group-hover:scale-[1.02] ${className ?? ""}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <p className="absolute inset-x-0 bottom-0 p-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 sm:p-7">
        {label}
      </p>
    </div>
  );
}

export default async function SocietyPage({ params }: SocietyPageProps) {
  const { locale } = await params;
  const copy = getSocietyCopy(locale);
  const lifePlanSteps = [
    copy.lifePlan.steps[0],
    copy.lifePlan.steps[2],
    copy.lifePlan.steps[6],
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-wepac-gray selection:text-black">
      <SocietyHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-white/10 px-5 pb-20 pt-32 sm:px-8 lg:min-h-screen lg:px-12 lg:pb-24 lg:pt-40">
          <div className="absolute inset-0 -z-20 bg-black" />
          <div className="absolute inset-y-0 right-0 -z-10 hidden w-[48%] lg:block">
            <Image
              src="/images/society/alex-florindo.jpg"
              alt=""
              fill
              sizes="48vw"
              priority
              className="object-cover object-center opacity-65"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/25" />
          </div>

          <div className="mx-auto grid min-h-[650px] max-w-[1440px] items-end gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-8 max-w-5xl text-balance font-barlow text-[clamp(3.6rem,7.6vw,8.2rem)] font-black uppercase leading-[0.82] tracking-[-0.035em]">
                {copy.hero.title}
              </h1>
              <p className="mt-10 max-w-2xl text-balance font-barlow text-2xl font-bold uppercase leading-tight sm:text-3xl">
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
                  className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-white hover:bg-white hover:text-black"
                >
                  {copy.hero.secondaryCta}
                </Link>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/45">{copy.hero.ctaNote}</p>
            </FadeIn>

            <FadeIn delay={0.1} className="relative overflow-hidden border border-white/15 lg:hidden">
              <Image
                src="/images/society/alex-florindo.jpg"
                alt={copy.hero.portraitAlt}
                width={1080}
                height={1080}
                sizes="100vw"
                className="aspect-square w-full object-cover"
              />
              <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                {copy.hero.portraitLabel}
              </p>
            </FadeIn>
          </div>
        </section>

        <section id="life-plan" className="scroll-mt-20 border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                  {copy.lifePlan.eyebrow}
                </p>
                <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
                  {copy.lifePlan.title}
                </h2>
              </div>
              <div>
                <p className="max-w-3xl text-balance text-2xl leading-snug text-white sm:text-3xl">
                  {copy.lifePlan.lead}
                </p>
                <p className="mt-6 max-w-2xl leading-relaxed text-white/60">{copy.proposal.body}</p>
              </div>
            </FadeIn>

            <div className="mt-14 grid gap-px bg-white/15 md:grid-cols-3">
              {lifePlanSteps.map((step, index) => (
                <FadeIn key={step.name} delay={index * 0.05} className="bg-[#080808] p-7 sm:p-9">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{step.index}</p>
                  <h3 className="mt-10 font-barlow text-3xl font-black uppercase tracking-[-0.025em]">
                    {step.name}
                  </h3>
                  <p className="mt-5 max-w-md leading-relaxed text-white/60">{step.line}</p>
                </FadeIn>
              ))}
            </div>

            <FadeIn className="mt-10 flex flex-col gap-5 border-t border-white/15 pt-9 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-relaxed text-white/55">{copy.lifePlan.support}</p>
              <Link
                href={intakeHref}
                className="inline-flex min-h-14 shrink-0 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray"
              >
                {copy.lifePlan.cta}
              </Link>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-black/15 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <FadeIn className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">{copy.landing.routesEyebrow}</p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
                {copy.landing.routesTitle}
              </h2>
              <p className="mt-7 text-lg leading-relaxed text-black/65">
                {copy.landing.routesBody}
              </p>
            </FadeIn>

            <div className="mt-14 grid gap-px bg-black/15 lg:grid-cols-3">
              <div className="flex min-h-[430px] flex-col bg-wepac-gray p-7 sm:p-9">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Famílias</p>
                <h3 className="mt-10 font-barlow text-4xl font-black uppercase tracking-[-0.03em]">{copy.families.title}</h3>
                <p className="mt-6 flex-1 leading-relaxed text-black/65">{copy.families.body}</p>
                <Link href="/society/familias" className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  {copy.families.cta} <Arrow />
                </Link>
              </div>

              <div className="flex min-h-[430px] flex-col bg-black p-7 text-white sm:p-9">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{copy.academy.eyebrow}</p>
                <h3 className="mt-10 font-barlow text-4xl font-black uppercase tracking-[-0.03em]">{copy.academy.title}</h3>
                <p className="mt-6 leading-relaxed text-white/65">{copy.academy.body}</p>
                <div className="mt-8 grid grid-cols-3 gap-px bg-white/15">
                  {copy.academy.stages.map((stage) => (
                    <div key={stage.name} className="bg-black px-3 py-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">{stage.range}</p>
                      <p className="mt-3 font-barlow text-lg font-bold uppercase">{stage.name}</p>
                    </div>
                  ))}
                </div>
                <Link href="/academy" className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  {copy.academy.cta} <Arrow />
                </Link>
              </div>

              <div className="flex min-h-[430px] flex-col bg-wepac-gray p-7 sm:p-9">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">{copy.houses.artsLabel}</p>
                <h3 className="mt-10 font-barlow text-4xl font-black uppercase tracking-[-0.03em]">{copy.landing.artsTitle}</h3>
                <p className="mt-6 flex-1 leading-relaxed text-black/65">{copy.houses.artsLine}</p>
                <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-bold uppercase tracking-[0.18em]">
                  <Link href="/wessex" className="inline-flex items-center gap-2">{copy.houses.wessexCta} <Arrow /></Link>
                  <Link href="/arte-a-capela" className="inline-flex items-center gap-2">{copy.houses.arteCta} <Arrow /></Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">{copy.platform.eyebrow}</p>
              <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
                {copy.platform.title}
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="max-w-2xl text-lg leading-relaxed text-white/70">{copy.platform.body}</p>
              <p className="mt-5 max-w-2xl leading-relaxed text-white/55">{copy.platform.support}</p>
              <Link href="/wepacker/login" className="mt-9 inline-flex items-center gap-2 border-b border-white pb-2 text-xs font-bold uppercase tracking-[0.18em]">
                {copy.platform.backpackCta} <Arrow />
              </Link>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-px bg-white/15 md:grid-cols-2 xl:grid-cols-4">
              <ProofImage src="/images/society/proof-jiu-jitsu.jpg" alt={copy.proof.media[0].alt} label={copy.proof.media[0].label} />
              <ProofImage src="/images/society/proof-alvaro-luis.jpg" alt={copy.proof.media[1].alt} label={copy.proof.media[1].label} className="object-top" />
              <ProofImage src="/images/society/proof-alex-podium.jpg" alt={copy.proof.media[2].alt} label={copy.proof.media[2].label} />
              <ProofImage src="/images/society/proof-jotta-pe.jpg" alt={copy.proof.media[3].alt} label={copy.proof.media[3].label} />
            </div>
            <FadeIn className="mt-14 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">{copy.proof.eyebrow}</p>
                <h2 className="mt-6 text-balance font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">{copy.proof.title}</h2>
              </div>
              <div>
                <p className="text-xl leading-relaxed text-white/75">{copy.proof.body}</p>
                <p className="mt-6 leading-relaxed text-white/55">{copy.proof.support}</p>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="relative isolate overflow-hidden px-5 py-28 sm:px-8 lg:px-12 lg:py-40">
          <div className="absolute inset-0 -z-20">
            <Image src="/images/wessex/detail.jpg" alt="" fill sizes="100vw" className="object-cover object-[35%_center] opacity-25 sm:object-center" />
          </div>
          <div className="absolute inset-0 -z-10 bg-black/65" />
          <FadeIn className="mx-auto max-w-5xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">{copy.closing.eyebrow}</p>
            <h2 className="mt-8 text-balance font-barlow text-5xl font-black uppercase leading-[0.88] tracking-[-0.045em] sm:text-7xl lg:text-8xl">{copy.closing.title}</h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/65">{copy.closing.body}</p>
            <Link href={intakeHref} className="mt-10 inline-flex min-h-14 items-center justify-center bg-white px-7 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-wepac-gray">
              {copy.closing.lifePlanCta}
            </Link>
          </FadeIn>
        </section>
      </main>
      <SocietyFooter />
    </div>
  );
}
