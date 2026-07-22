import { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";
import {
  applyHref,
  hero,
  premissa,
  oQueRecebes,
  honestidade,
  niveisIntro,
  niveis,
  constantes,
  porqueArtes,
  oQueNaoE,
  fecho,
  escolas,
} from "@/data/academia";

export const metadata: Metadata = {
  title: "Academia",
  description:
    "A Academia é onde o método da WEPAC se torna percurso — a mesma pergunta, dos 0 aos 22 anos e além: para onde deves ir a seguir?",
};

// Shared button style for the page's one recurring CTA — the hero button,
// the Transformar block's button (explicitly "mesmo destino do hero") and
// the closing section's button are all the same element, never a second
// competing button per board resolution §4 ("Segundo botão a competir com
// Candidatar-me: Nunca").
const primaryButtonClass =
  "inline-block border border-wepac-border bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-colors hover:bg-wepac-accent-muted";

export default function AcademiaPage() {
  return (
    <div className="pt-20">
      {/* S1 — Hero */}
      <section id="top" className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              {hero.eyebrow}
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold leading-tight text-wepac-white md:text-6xl">
              {hero.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-wepac-text-secondary">
              {hero.dek}
            </p>
            <div className="mt-10">
              <Link href={applyHref} className={primaryButtonClass}>
                {hero.ctaLabel}
              </Link>
              <p className="mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
                {hero.microcopy}
              </p>
            </div>
            <a
              href={hero.subLinkHref}
              className="mt-8 inline-block text-sm text-wepac-text-secondary underline-offset-4 hover:text-wepac-white hover:underline"
            >
              {hero.subLinkLabel}
            </a>
          </FadeIn>
        </div>
      </section>

      {/* S2 — Premissa */}
      <section id="premissa" className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="font-barlow text-2xl font-bold leading-snug text-wepac-white md:text-3xl">
              {premissa}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* S3 — O que recebes */}
      <section id="o-que-recebes" className="bg-wepac-black px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <p className="max-w-2xl text-lg leading-relaxed text-wepac-text-secondary">
              {oQueRecebes.intro}
            </p>
          </FadeIn>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {oQueRecebes.items.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <div className="h-full border border-wepac-border bg-wepac-card p-6">
                  <h3 className="font-barlow text-lg font-bold text-wepac-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-wepac-text-secondary">
                    {item.body}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <p className="mt-10 max-w-2xl border border-wepac-white bg-wepac-card px-6 py-5 text-sm font-medium leading-relaxed text-wepac-white">
              {oQueRecebes.privacyLine}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* S4 — Porque é que só esta porta está aberta */}
      <section
        id="honestidade"
        className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <p className="text-base leading-relaxed text-wepac-text-secondary">{honestidade}</p>
          </FadeIn>
        </div>
      </section>

      {/* S5 — Os três tempos. Deliberately NOT a card grid: three stacked,
          full-width, same-width blocks sharing one left rule each, in
          chronological order (0 → 22+), never numbered, never linked by
          arrows or a progress indicator — see board §3. */}
      <section id="niveis" className="bg-wepac-black px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              {niveisIntro.heading}
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-wepac-text-secondary">
              {niveisIntro.intro}
            </p>
          </FadeIn>

          <div className="mt-16 space-y-16 md:space-y-20">
            {niveis.map((level, i) => (
              <FadeIn key={level.id} delay={i * 0.1}>
                <div
                  id={level.anchor}
                  className="scroll-mt-24 border-l-2 border-wepac-border py-2 pl-6 md:pl-10"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-wepac-text-tertiary">
                    {level.kicker}
                  </p>
                  <p className="mt-4 max-w-2xl font-barlow text-xl font-bold italic leading-snug text-wepac-white md:text-2xl">
                    {level.voice}
                  </p>

                  <div className="mt-6 max-w-2xl space-y-4">
                    {level.paragraphs.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="text-base leading-relaxed text-wepac-text-secondary"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* State line — same visual treatment across all three
                      levels regardless of open/closed content, per board
                      §3: "Do not gray out or shrink the closed level". */}
                  <div className="mt-8 max-w-2xl border-t border-wepac-border pt-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-wepac-gray">
                      Estado
                    </p>
                    <div className="mt-3 space-y-3">
                      {level.stateParagraphs.map((paragraph, idx) => (
                        <p
                          key={idx}
                          className="text-sm leading-relaxed text-wepac-text-tertiary"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  {level.cta && (
                    <div className="mt-8">
                      {level.cta.type === "link" ? (
                        <a
                          href={level.cta.href}
                          className="text-sm font-bold text-wepac-white underline-offset-4 hover:underline"
                        >
                          {level.cta.label}
                        </a>
                      ) : (
                        <Link href={level.cta.href} className={primaryButtonClass}>
                          {level.cta.label}
                        </Link>
                      )}
                      {level.microcopy && (
                        <p className="mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
                          {level.microcopy}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* S6 — O que não muda */}
      <section
        id="constantes"
        className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              {constantes.heading}
            </h2>
            <div className="mt-6 space-y-6">
              <p className="text-base leading-relaxed text-wepac-text-secondary">
                {constantes.corpo}
              </p>
              <p className="text-base leading-relaxed text-wepac-text-secondary">
                {constantes.lente}
              </p>
              <p className="text-base leading-relaxed text-wepac-text-secondary">
                {constantes.familia}
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* S7 — Porquê uma companhia de artes */}
      <section id="porque-artes" className="bg-wepac-black px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <p className="text-base leading-relaxed text-wepac-text-secondary">{porqueArtes}</p>
          </FadeIn>
        </div>
      </section>

      {/* S8 — O que isto não é */}
      <section
        id="o-que-nao-e"
        className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              {oQueNaoE.heading}
            </h2>
          </FadeIn>
          <ul className="mt-10 grid grid-cols-1 gap-3">
            {oQueNaoE.items.map((item, i) => (
              <FadeIn key={item} delay={i * 0.05}>
                <li className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary">
                  {item}
                </li>
              </FadeIn>
            ))}
          </ul>
        </div>
      </section>

      {/* S9 — Fecho */}
      <section id="fecho" className="bg-wepac-black px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <p className="text-lg leading-relaxed text-wepac-text-secondary">{fecho.corpo}</p>
            <div className="mt-10">
              <Link href={applyHref} className={primaryButtonClass}>
                {fecho.ctaLabel}
              </Link>
              <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
                {fecho.microcopy}
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* S10 — Rodapé B2B */}
      <section
        id="escolas"
        className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <h2 className="font-barlow text-2xl font-bold text-wepac-white md:text-3xl">
              {escolas.heading}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-wepac-text-secondary">
              {escolas.corpo}
            </p>
            <a
              href={`mailto:${escolas.ctaEmail}`}
              className="mt-6 inline-block text-sm font-bold text-wepac-white underline-offset-4 hover:underline"
            >
              {escolas.ctaEmail}
            </a>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
