import type { Metadata } from "next";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Link } from "@/i18n/navigation";
import {
  AGE_RANGE,
  APPLICATION_DEADLINE,
  APPLY_ENABLED,
  COST_CEILING_EUR,
  EXACT_DATES,
  FUNDED_PLACES_AVAILABLE,
  MENTORS,
  PLACE_COUNT,
  REPLY_DATE,
} from "@/data/universidade-verao";
import { universitySummerCopy } from "@/i18n/copy/society-surfaces-campaigns";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const copy = universitySummerCopy[locale].metadata;
  return {
    title: { absolute: copy.title },
    description: copy.description,
  };
}

// Conditional facts that only exist once the founder decides them — see the
// TODO block at the top of src/data/universidade-verao.ts.
function dynamicFacts(
  locale: AppLocale,
  copy: (typeof universitySummerCopy)[AppLocale]["dynamicFacts"],
): { label: string; value: string }[] {
  const extra: { label: string; value: string }[] = [];

  if (EXACT_DATES) {
    extra.push({
      label: copy.when,
      value:
        EXACT_DATES.mode === "exact"
          ? EXACT_DATES.date
          : `${copy.between} ${EXACT_DATES.from} ${locale === "pt-PT" ? "e" : "and"} ${EXACT_DATES.to}`,
    });
  }

  if (PLACE_COUNT) {
    extra.push({
      label: copy.places,
      value: `${copy.upTo} ${PLACE_COUNT.max}`,
    });
  }

  if (REPLY_DATE) {
    extra.push({ label: copy.repliesBy, value: REPLY_DATE });
  }

  return extra;
}

export default async function UniversidadeVeraoPage() {
  const locale = (await getLocale()) as AppLocale;
  const copy = universitySummerCopy[locale];
  const allFacts = [...copy.facts, ...dynamicFacts(locale, copy.dynamicFacts)];

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

      {/* 1. Hero */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            {copy.hero.subtitle}
          </p>
          <h1 className="mt-4 font-barlow text-4xl font-bold leading-tight text-wepac-white sm:text-5xl md:text-6xl">
            {copy.hero.title}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-wepac-text-secondary">
            {copy.hero.lead}
          </p>

          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {allFacts.map((fact) => (
              <div
                key={fact.label}
                className="border border-wepac-border bg-wepac-card p-4 text-left"
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-wepac-text-tertiary">
                  {fact.label}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-wepac-white">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2. The weekend in one paragraph */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {copy.weekendHeading}
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-5 text-sm leading-relaxed text-wepac-text-secondary">
            {copy.weekendSummary.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The shape, hour by hour */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            {copy.scheduleEyebrow}
          </p>
          <h2 className="mt-3 text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {copy.scheduleHeading}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            {copy.scheduleIntro}
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {copy.schedule.map((day) => (
              <div
                key={day.day}
                className="border border-wepac-border bg-wepac-card p-6"
              >
                <p className="font-barlow text-2xl font-bold text-wepac-white">
                  {day.day}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-wepac-text-tertiary">
                  {day.theme}
                </p>
                <ol className="mt-6 space-y-5 border-l border-wepac-border pl-5">
                  {day.blocks.map((block) => (
                    <li key={`${day.day}-${block.time}`}>
                      <p className="text-xs font-medium uppercase tracking-wide text-wepac-gray">
                        {block.time}
                      </p>
                      <p className="mt-1 font-barlow text-sm font-bold text-wepac-white">
                        {block.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-wepac-text-secondary">
                        {block.body}
                      </p>
                      {block.why && (
                        <p className="mt-1 text-xs italic leading-relaxed text-wepac-text-tertiary">
                          {copy.whyPrefix}: {block.why}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Safeguards */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {copy.safeguardsHeading}
          </h2>
          <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3">
            {copy.safeguards.map((item) => (
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

      {/* 5. What you leave with */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {copy.takeawaysHeading}
          </h2>
          <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {copy.takeaways.map((item) => (
              <li
                key={item}
                className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary"
              >
                {item}
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-14 max-w-2xl text-center text-sm font-medium leading-relaxed text-wepac-white">
            {copy.notTakeawaysIntro}
          </p>
          <ul className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-3">
            {copy.notTakeaways.map((item) => (
              <li
                key={item}
                className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            {copy.followUpPromise}
          </p>
        </div>
      </section>

      {/* 6. What it is not */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {copy.whatItIsNotHeading}
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-3">
            {copy.whatItIsNot.map((item) => (
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

      {/* 7. The secrecy ruling */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {copy.secrecyHeading}
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-4 text-sm leading-relaxed text-wepac-text-secondary">
            {copy.secrecy.kept.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-medium leading-relaxed text-wepac-white">
            {copy.secrecy.open}
          </p>
        </div>
      </section>

      {/* 8. Cost — only renders once a ceiling has been decided */}
      {COST_CEILING_EUR !== null && (
        <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              {copy.cost.heading}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
              {copy.cost.ceilingPrefix} {COST_CEILING_EUR}{" "}
              {copy.cost.ceilingSuffix}
            </p>
            {FUNDED_PLACES_AVAILABLE && (
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
                {copy.cost.funded}
              </p>
            )}
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
              {copy.cost.decline}
            </p>
          </div>
        </section>
      )}

      {/* 9. Selection */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {copy.selectionHeading}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            {copy.selectionNote}
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {copy.selectionCriteria.map((criterion) => (
              <div
                key={criterion.title}
                className="border border-wepac-border bg-wepac-card p-6"
              >
                <p className="font-barlow text-sm font-bold uppercase tracking-wide text-wepac-white">
                  {criterion.title}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-wepac-text-secondary">
                  {criterion.body}
                </p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-wepac-text-tertiary">
            {copy.crisisNote}
          </p>

          <div className="mx-auto mt-14 max-w-2xl">
            <h3 className="text-center font-barlow text-xl font-bold text-wepac-white">
              {copy.questionsHeading}
            </h3>
            <ul className="mt-6 grid grid-cols-1 gap-3">
              {copy.applicationQuestions.map((question, index) => (
                <li
                  key={question}
                  className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary"
                >
                  <span className="text-wepac-text-tertiary">
                    {index + 1}.{" "}
                  </span>
                  {question}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 10. Mentors — only renders once named/confirmed */}
      {MENTORS && MENTORS.length > 0 && (
        <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              {copy.mentorsHeading}
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {MENTORS.map((mentor) => (
                <div
                  key={mentor.name}
                  className="border border-wepac-border bg-wepac-card p-6"
                >
                  <p className="font-barlow text-lg font-bold text-wepac-white">
                    {mentor.name}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-wepac-text-secondary">
                    {mentor.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11. Closing / apply */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            {copy.closing.heading}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
            {copy.closing.body}
          </p>
          <div className="mt-10">
            {APPLY_ENABLED ? (
              <Link
                href="/wepacker/intake"
                className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
              >
                {copy.closing.apply}
              </Link>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="inline-block cursor-not-allowed border border-wepac-border bg-wepac-card px-8 py-3 text-sm font-bold text-wepac-text-tertiary"
              >
                {copy.closing.disabled}
              </button>
            )}
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
              {copy.closing.deadlinePrefix}{" "}
              {locale === "pt-PT" ? APPLICATION_DEADLINE : "August 10, 2026"}.{" "}
              {copy.closing.agePrefix} {AGE_RANGE.min} {copy.closing.ageJoin}{" "}
              {AGE_RANGE.max} {copy.closing.ageSuffix}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-wepac-border px-6 py-12 lg:px-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <span className="font-barlow text-2xl font-bold text-wepac-white">
            A Travessia
          </span>
          <p className="text-xs text-wepac-text-tertiary">
            {copy.footerDescription}
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
        </div>
      </footer>
    </div>
  );
}
