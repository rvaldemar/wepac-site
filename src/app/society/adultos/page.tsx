import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  applyHref,
  closing,
  hero,
  howToApply,
  potentialEnergy,
  recognition,
  whatItIsNot,
  whatsReal,
} from "@/data/campanha-adultos";

export const metadata: Metadata = {
  title: { absolute: "WEPAC Society — para quem já carrega peso a sério | WEPAC" },
  description:
    "Achas que tens mais para dar do que estás a converter? Um mentor atribuído, sessões marcadas e um Life Map privado. A candidatura é gratuita, e o primeiro Life Map também.",
};

export default function CampanhaAdultosPage() {
  return (
    <div className="min-h-screen bg-wepac-black">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 lg:px-12">
        <Link href="/">
          <Image
            src="/logo/email/wepacker-lockup-white.png"
            alt="WEPACKER"
            width={144}
            height={72}
            className="h-9 w-auto"
            priority
          />
        </Link>
        <Link
          href="/society"
          className="text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-white"
        >
          WEPAC Society
        </Link>
      </header>

      {/* 1. Hero — speaks straight to the adult carrying real weight */}
      <section className="px-6 pt-8 pb-24 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            {hero.eyebrow}
          </p>
          <h1 className="mt-4 font-barlow text-4xl font-bold leading-tight text-wepac-white sm:text-5xl md:text-6xl">
            {hero.h1}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-wepac-text-secondary">
            {hero.dek}
          </p>
          <div className="mt-10">
            <a
              href={applyHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              {hero.ctaLabel}
            </a>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
              {hero.microcopy}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Recognition — the reader sees their own week described back */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {recognition.heading}
          </h2>
          <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3">
            {recognition.items.map((item) => (
              <li
                key={item}
                className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. The spine — potential energy, engineering not motivation */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="font-barlow text-2xl font-bold leading-snug text-wepac-white md:text-3xl">
            {potentialEnergy}
          </p>
        </div>
      </section>

      {/* 4. What's real today */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mx-auto max-w-2xl text-center text-lg leading-relaxed text-wepac-text-secondary">
            {whatsReal.intro}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {whatsReal.items.map((item) => (
              <div key={item.title} className="border border-wepac-border bg-wepac-card p-6">
                <p className="font-barlow text-lg font-bold text-wepac-white">{item.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-wepac-text-secondary">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl border border-wepac-white bg-wepac-card px-6 py-5 text-center text-sm font-medium leading-relaxed text-wepac-white">
            {whatsReal.privacyLine}
          </p>
        </div>
      </section>

      {/* 5. What it is not */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {whatItIsNot.heading}
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-3">
            {whatItIsNot.items.map((item) => (
              <li
                key={item}
                className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. How you get in */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {howToApply.heading}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-wepac-text-secondary">
            {howToApply.body}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-wepac-white">
            {howToApply.emphasis}
          </p>
          <div className="mt-10">
            <a
              href={applyHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              {howToApply.ctaLabel}
            </a>
          </div>
        </div>
      </section>

      {/* 7. Closing */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {closing.heading}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
            {closing.body}
          </p>
          <div className="mt-10">
            <a
              href={applyHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              {closing.ctaLabel}
            </a>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
              {closing.microcopy}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-wepac-border px-6 py-12 lg:px-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <span className="font-barlow text-2xl font-bold text-wepac-white">WEPAC Society</span>
          <p className="text-xs text-wepac-text-tertiary">
            WEPAC Society — a camada de pertença da WEPAC, Companhia de Artes
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-wepac-text-tertiary">
            <Link href="/society" className="transition-colors hover:text-wepac-white">
              WEPAC Society
            </Link>
            <Link href="/sobre" className="transition-colors hover:text-wepac-white">
              A WEPAC
            </Link>
            <Link href="/contacto" className="transition-colors hover:text-wepac-white">
              Contacto
            </Link>
            <Link href="/privacidade" className="transition-colors hover:text-wepac-white">
              Política de privacidade
            </Link>
          </nav>
          <Link
            href="/wepacker/login"
            className="mt-2 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-white"
          >
            Já tens conta? Entrar
          </Link>
        </div>
      </footer>
    </div>
  );
}
