import type { Metadata } from "next";
import { Fragment } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { BetaSignupForm } from "@/components/wepacker/BetaSignupForm";
import { getLocale } from "next-intl/server";
import { getArtistCopy } from "@/i18n/copy/institutional-artist";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getArtistCopy(await getLocale());
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="mt-0.5 flex-shrink-0"
      aria-hidden="true"
    >
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke="#DEE0DB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="mt-0.5 flex-shrink-0"
      aria-hidden="true"
    >
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function ArtistPage() {
  const copy = getArtistCopy(await getLocale());
  return (
    <div className="relative bg-black">

      {/* 1. HERO */}
      <section className="relative flex min-h-screen items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-[40vw] lg:block" aria-hidden="true">
            <Image
              src="/images/artist-bg.jpg"
              alt=""
              fill
              className="object-cover object-[30%_center] mix-blend-screen brightness-[2]"
              quality={75}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent from-30% to-black" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02]">
            <span className="whitespace-nowrap font-barlow text-[18vw] font-bold">
              {copy.watermark}
            </span>
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-wepac-gray">
              WEPAC for Artists
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <h1 className="mt-6 font-barlow text-4xl font-bold leading-tight text-white sm:text-5xl md:text-7xl lg:text-[96px]">
              {copy.heroLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="mt-8 text-lg text-white/80 md:text-xl">
              {copy.heroSubtitle}
            </p>
          </FadeIn>
          <FadeIn delay={0.45}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
              <a
                href="#plataforma"
                className="border border-wepac-gray/30 bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-wepac-gray"
              >
                {copy.seeHow}
              </a>
              <a
                href="#candidatura"
                className="border border-white/30 px-8 py-3 text-sm font-bold text-white transition-colors hover:border-white"
              >
                {copy.apply}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 2. O QUE É */}
      <section className="relative z-10 px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              {copy.definitionEyebrow}
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              {copy.definitionTitle}
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-8 text-lg leading-relaxed text-white/80">
              {copy.definitionBody}
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <blockquote className="mt-10 border-l-2 border-wepac-gray pl-6">
              <p className="text-2xl font-bold italic text-white md:text-3xl">
                {copy.definitionQuote}
              </p>
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* 3. A PLATAFORMA */}
      <section id="plataforma" className="relative z-10 scroll-mt-24 bg-[rgba(255,255,255,0.02)] px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              {copy.platformEyebrow}
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              {copy.platformTitle}
            </h2>
            <p className="mt-4 text-lg text-white/60">
              {copy.platformLead}
            </p>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {copy.platformFeatures.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.08} className="flex">
                <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6 transition-colors hover:border-white">
                  <h3 className="font-barlow text-xl font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {feature.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 4. METODOLOGIA */}
      <section className="relative z-10 px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              {copy.methodEyebrow}
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              {copy.methodTitle}
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Left: 3 layers */}
            <div className="space-y-10">
              <FadeIn>
                <div className="border border-wepac-gray/30 bg-black p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
                    {copy.layer(1)}
                  </p>
                  <h3 className="mt-2 font-barlow text-2xl font-bold text-white">
                    Six Pillars
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    {copy.pillarsSubtitle}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {copy.pillars.map((pillar) => (
                      <span
                        key={pillar.name}
                        className="border border-wepac-gray/20 bg-black px-3 py-1.5 text-sm text-wepac-gray"
                        title={pillar.desc}
                      >
                        {pillar.name}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="border border-wepac-gray/30 bg-black p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
                    {copy.layer(2)}
                  </p>
                  <h3 className="mt-2 font-barlow text-2xl font-bold text-white">
                    {copy.principlesTitle}
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    {copy.principlesSubtitle}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {copy.principles.map((p) => (
                      <span
                        key={p}
                        className="border border-wepac-gray/20 bg-black px-3 py-1.5 text-sm text-wepac-gray"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="border border-wepac-gray/30 bg-black p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
                    {copy.layer(3)}
                  </p>
                  <h3 className="mt-2 font-barlow text-2xl font-bold text-white">
                    {copy.valuesTitle}
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    {copy.valuesSubtitle}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {copy.values.map((v) => (
                      <span
                        key={v}
                        className="border border-wepac-gray/20 bg-black px-3 py-1.5 text-sm text-wepac-gray"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.15}>
              <div className="grid gap-4">
                {copy.concepts.map((concept) => (
                  <div
                    key={concept.title}
                    className="border border-wepac-gray/30 bg-black p-6"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
                      {concept.type}
                    </p>
                    <h3 className="mt-2 font-barlow text-2xl font-bold text-white">
                      {concept.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      {concept.desc}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 5. COMO FUNCIONA */}
      <section className="relative z-10 bg-[rgba(255,255,255,0.02)] px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              {copy.practiceEyebrow}
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              {copy.practiceTitle}
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {copy.practiceCards.map((card, index) => (
              <FadeIn key={card.title} delay={index * 0.07} className="flex">
                <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6 transition-colors hover:border-white">
                  <h3 className="font-barlow text-xl font-bold text-white">
                    {card.title}
                  </h3>
                  <ul className="mt-4 space-y-2 text-sm text-wepac-gray">
                    {card.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-white/40">{card.note}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 6. EQUIPA */}
      <section className="relative z-10 px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              {copy.teamEyebrow}
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              {copy.teamTitle}
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-8 text-lg leading-relaxed text-white/80">
              {copy.teamBody}
            </p>
          </FadeIn>
          <div className="mt-10 flex flex-wrap gap-4">
            {copy.teamProfiles.map((perfil, i) => (
              <FadeIn key={perfil} delay={i * 0.05}>
                <span className="border border-wepac-gray/30 px-4 py-2 text-sm text-wepac-gray">
                  {perfil}
                </span>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PERCURSO */}
      <section className="relative z-10 px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              {copy.journeyEyebrow}
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              {copy.journeyTitle}
            </h2>
          </FadeIn>

          <div className="mt-16 flex flex-col items-stretch gap-0 lg:flex-row">
            {copy.stages.map((stage, i) => (
              <Fragment key={stage.name}>
                <FadeIn delay={i * 0.1} className="flex flex-1 flex-col">
                  <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6 transition-colors hover:border-white">
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
                      {copy.stageLabel(i + 1)}
                    </span>
                    <h3 className="mt-2 font-barlow text-2xl font-bold text-wepac-gray">
                      {stage.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">
                      {stage.desc}
                    </p>
                  </div>
                </FadeIn>
                {i < copy.stages.length - 1 && (
                  <>
                    <div className="flex items-center justify-center py-3 lg:hidden">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/40">
                        <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="hidden shrink-0 items-center justify-center px-3 lg:flex">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/40">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PARA QUEM É */}
      <section className="relative z-10 bg-[rgba(255,255,255,0.02)] px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="text-center font-barlow text-3xl font-bold text-white md:text-5xl">
              {copy.fitTitle}
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            <FadeIn delay={0.1} className="flex">
              <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6">
                <h3 className="font-barlow text-xl font-bold text-wepac-gray">
                  {copy.isForYou}
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-white/80">
                  {copy.fitPositive.map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.2} className="flex">
              <div className="flex flex-1 flex-col border border-wepac-gray/30 bg-black p-6">
                <h3 className="font-barlow text-xl font-bold text-white/50">
                  {copy.isNotForYou}
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-white/50">
                  {copy.fitNegative.map((item) => (
                    <li key={item} className="flex gap-3">
                      <CrossIcon />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 8. CANDIDATURA */}
      <section id="candidatura" className="relative z-10 scroll-mt-24 px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
              {copy.applicationEyebrow}
            </p>
            <h2 className="mt-3 font-barlow text-3xl font-bold text-white md:text-5xl">
              {copy.applicationTitle}
            </h2>
            <p className="mt-4 text-lg text-white/60">
              {copy.applicationBody}
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-10">
              <BetaSignupForm />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-wepac-gray/30 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <span className="font-barlow text-3xl font-bold text-white">
              wepac
            </span>
            <p className="mt-2 text-sm text-white/50">
              {copy.footerTagline}
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
              <Link
                href="/"
                className="text-sm text-white/80 transition-colors hover:text-white"
              >
                wepac.pt
              </Link>
              <span className="hidden text-wepac-gray/30 sm:inline">·</span>
              <a
                href="mailto:info@wepac.pt"
                className="text-sm text-white/80 transition-colors hover:text-white"
              >
                info@wepac.pt
              </a>
            </div>
          </FadeIn>
        </div>
      </footer>
    </div>
  );
}
