import type { Metadata } from "next";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Link } from "@/i18n/navigation";
import { adultsCampaignCopy } from "@/i18n/copy/society-surfaces-campaigns";
import type { AppLocale } from "@/i18n/routing";

const applyHref = "/wepacker/intake?source=life-plan";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const copy = adultsCampaignCopy[locale].metadata;

  return {
    title: { absolute: copy.title },
    description: copy.description,
  };
}

export default async function CampanhaAdultosPage() {
  const locale = (await getLocale()) as AppLocale;
  const copy = adultsCampaignCopy[locale];
  const {
    closing,
    hero,
    howToApply,
    potentialEnergy,
    recognition,
    whatItIsNot,
    whatsReal,
  } = copy;

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
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/society"
            className="hidden text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-white sm:inline"
          >
            WEPAC Society
          </Link>
          <LocaleSwitcher className="[&_select]:w-32 sm:[&_select]:w-auto" />
        </div>
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
            <Link
              href={applyHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              {hero.ctaLabel}
            </Link>
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
              <div
                key={item.title}
                className="border border-wepac-border bg-wepac-card p-6"
              >
                <p className="font-barlow text-lg font-bold text-wepac-white">
                  {item.title}
                </p>
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
            <Link
              href={applyHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              {howToApply.ctaLabel}
            </Link>
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
            <Link
              href={applyHref}
              className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
            >
              {closing.ctaLabel}
            </Link>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
              {closing.microcopy}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-wepac-border px-6 py-12 lg:px-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <span className="font-barlow text-2xl font-bold text-wepac-white">
            WEPAC Society
          </span>
          <p className="text-xs text-wepac-text-tertiary">
            {copy.footer.description}
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-wepac-text-tertiary">
            <Link
              href="/society"
              className="transition-colors hover:text-wepac-white"
            >
              WEPAC Society
            </Link>
            <Link
              href="/sobre"
              className="transition-colors hover:text-wepac-white"
            >
              {copy.footer.about}
            </Link>
            <Link
              href="/contacto"
              className="transition-colors hover:text-wepac-white"
            >
              {copy.footer.contact}
            </Link>
            <Link
              href="/privacidade"
              className="transition-colors hover:text-wepac-white"
            >
              {copy.footer.privacy}
            </Link>
          </nav>
          <Link
            href="/wepacker/login"
            className="mt-2 text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-white"
          >
            {copy.footer.signIn}
          </Link>
        </div>
      </footer>
    </div>
  );
}
