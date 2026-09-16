import type { Metadata } from "next";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { artsCompanySurfaceCopy } from "@/i18n/copy/society-surfaces";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const copy = artsCompanySurfaceCopy[locale].metadata;

  return {
    title: { absolute: copy.title },
    description: copy.description,
    alternates: { canonical: "/companhia-de-artes" },
  };
}

export default async function CompanhiaDeArtesPage() {
  const locale = (await getLocale()) as AppLocale;
  const copy = artsCompanySurfaceCopy[locale];

  return (
    <>
      <section className="relative isolate min-h-[820px] overflow-hidden border-b border-white/10 px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pt-40">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/images/society/violin.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-65"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/80 to-black/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-transparent to-black/35" />

        <FadeIn className="mx-auto flex min-h-[650px] max-w-[1440px] items-end">
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
          </div>
        </FadeIn>
      </section>

      <section className="border-b border-white/10 bg-wepac-gray px-5 py-24 text-black sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[0.75fr_1.25fr]">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-black/45">
              {copy.company.eyebrow}
            </p>
            <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
              {copy.company.titleLines.map((line, index) => (
                <span key={line}>
                  {line}
                  {index < copy.company.titleLines.length - 1 && <br />}
                </span>
              ))}
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="lg:pt-14">
            <p className="text-2xl leading-snug text-black/80 sm:text-3xl">
              {copy.company.lead}
            </p>
            <p className="mt-8 max-w-2xl leading-relaxed text-black/60">
              {copy.company.body}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-white/10 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              {copy.chooseDoor}
            </p>
          </FadeIn>
          <div className="mt-10 grid gap-px bg-white/15 lg:grid-cols-2">
            <Link
              href="/wessex"
              className="group relative min-h-[720px] overflow-hidden bg-black"
            >
              <Image
                src="/images/wessex/cta.jpg"
                alt={copy.wessex.imageAlt}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover object-[50%_42%] transition duration-700 group-hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
                  {copy.wessex.eyebrow}
                </p>
                <h2 className="mt-4 font-barlow text-5xl font-black uppercase tracking-[-0.04em] sm:text-7xl">
                  Wessex
                </h2>
                <p className="mt-5 max-w-lg leading-relaxed text-white/70">
                  {copy.wessex.body}
                </p>
                <span className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  {copy.wessex.cta} <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>

            <Link
              href="/arte-a-capela"
              className="group relative min-h-[720px] overflow-hidden bg-black"
            >
              <Image
                src="/images/arte-a-capela/hero.jpg"
                alt={copy.arteACapela.imageAlt}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover object-center transition duration-700 group-hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
                  {copy.arteACapela.eyebrow}
                </p>
                <h2 className="mt-4 font-barlow text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-7xl">
                  Arte à Capela
                </h2>
                <p className="mt-5 max-w-lg leading-relaxed text-white/70">
                  {copy.arteACapela.body}
                </p>
                <span className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  {copy.arteACapela.cta} <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080808] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1440px]">
          <FadeIn className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                {copy.circulation.eyebrow}
              </p>
              <h2 className="mt-6 font-barlow text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                {copy.circulation.title}
              </h2>
            </div>
            <p className="max-w-2xl self-end text-lg leading-relaxed text-white/60">
              {copy.circulation.body}
            </p>
          </FadeIn>
          <div className="mt-16 grid gap-px bg-white/15 md:grid-cols-3">
            {copy.circulation.cards.map(({ name, line, href }, index) => (
              <Link
                key={name}
                href={href}
                className="group min-h-[260px] bg-black p-7 sm:p-9"
              >
                <p className="font-barlow text-4xl font-black text-white/20">
                  0{index + 1}
                </p>
                <h3 className="mt-10 font-barlow text-2xl font-black uppercase">
                  {name}
                </h3>
                <p className="mt-4 leading-relaxed text-white/55">{line}</p>
                <span className="mt-8 inline-flex text-xs font-bold uppercase tracking-[0.18em] group-hover:underline">
                  {copy.circulation.open}{" "}
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
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
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/programacao"
              className="inline-flex min-h-14 items-center justify-center bg-black px-7 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-black/80"
            >
              {copy.closing.primaryCta}
            </Link>
            <Link
              href="/contacto"
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
