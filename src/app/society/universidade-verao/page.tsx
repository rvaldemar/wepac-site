import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AGE_RANGE,
  APPLICATION_DEADLINE,
  APPLICATION_QUESTIONS,
  APPLY_ENABLED,
  COST_CEILING_EUR,
  CRISIS_NOTE,
  EXACT_DATES,
  FACTS,
  FOLLOW_UP_PROMISE,
  FUNDED_PLACES_AVAILABLE,
  HERO,
  MENTORS,
  NOT_TAKEAWAYS,
  NOT_TAKEAWAYS_INTRO,
  PLACE_COUNT,
  REPLY_DATE,
  SAFEGUARDS,
  SCHEDULE,
  SECRECY_RULING,
  SELECTION_CRITERIA,
  SELECTION_NOTE,
  TAKEAWAYS,
  WEEKEND_SUMMARY,
  WHAT_IT_IS_NOT,
} from "@/data/universidade-verao";

export const metadata: Metadata = {
  title: {
    absolute: "Universidade de Verão WEPAC Society — a Travessia | WEPAC",
  },
  description:
    "Um fim de semana residencial para transformar energia potencial em energia, dos 18 aos 26 anos. Local e programa revelados a quem for convocado; candidaturas até " +
    APPLICATION_DEADLINE +
    ".",
};

// Conditional facts that only exist once the founder decides them — see the
// TODO block at the top of src/data/universidade-verao.ts.
function dynamicFacts(): { label: string; value: string }[] {
  const extra: { label: string; value: string }[] = [];

  if (EXACT_DATES) {
    extra.push({
      label: "Quando",
      value:
        EXACT_DATES.mode === "exact"
          ? EXACT_DATES.date
          : `Entre ${EXACT_DATES.from} e ${EXACT_DATES.to}`,
    });
  }

  if (PLACE_COUNT) {
    extra.push({ label: "Lugares", value: `Até ${PLACE_COUNT.max}` });
  }

  if (REPLY_DATE) {
    extra.push({ label: "Respostas até", value: REPLY_DATE });
  }

  return extra;
}

export default function UniversidadeVeraoPage() {
  const allFacts = [...FACTS, ...dynamicFacts()];

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

      {/* 1. Hero */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            {HERO.subtitle}
          </p>
          <h1 className="mt-4 font-barlow text-4xl font-bold leading-tight text-wepac-white sm:text-5xl md:text-6xl">
            {HERO.title}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-wepac-text-secondary">
            {HERO.lead}
          </p>

          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {allFacts.map((fact) => (
              <div key={fact.label} className="border border-wepac-border bg-wepac-card p-4 text-left">
                <dt className="text-xs font-medium uppercase tracking-wide text-wepac-text-tertiary">
                  {fact.label}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-wepac-white">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2. The weekend in one paragraph */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            O fim de semana, num parágrafo
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-5 text-sm leading-relaxed text-wepac-text-secondary">
            {WEEKEND_SUMMARY.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The shape, hour by hour */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            Hora a hora
          </p>
          <h2 className="mt-3 text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            A forma do fim de semana
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            O local é surpresa. Isto não é: é quase à letra o que vais viver.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {SCHEDULE.map((day) => (
              <div key={day.day} className="border border-wepac-border bg-wepac-card p-6">
                <p className="font-barlow text-2xl font-bold text-wepac-white">{day.day}</p>
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
                          Para quê: {block.why}
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
            Salvaguardas não negociáveis
          </h2>
          <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3">
            {SAFEGUARDS.map((item) => (
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
            O que levas
          </h2>
          <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {TAKEAWAYS.map((item) => (
              <li
                key={item}
                className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary"
              >
                {item}
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-14 max-w-2xl text-center text-sm font-medium leading-relaxed text-wepac-white">
            {NOT_TAKEAWAYS_INTRO}
          </p>
          <ul className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-3">
            {NOT_TAKEAWAYS.map((item) => (
              <li
                key={item}
                className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            {FOLLOW_UP_PROMISE}
          </p>
        </div>
      </section>

      {/* 6. What it is not */}
      <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            O que isto não é
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-3">
            {WHAT_IT_IS_NOT.map((item) => (
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
            Porque é que o local é segredo
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-4 text-sm leading-relaxed text-wepac-text-secondary">
            {SECRECY_RULING.kept.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-medium leading-relaxed text-wepac-white">
            {SECRECY_RULING.open}
          </p>
        </div>
      </section>

      {/* 8. Cost — only renders once a ceiling has been decided */}
      {COST_CEILING_EUR !== null && (
        <section className="border-t border-wepac-border bg-wepac-dark px-6 py-16 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
              Quanto custa
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
              Não mais de {COST_CEILING_EUR} € por pessoa. Inclui dormida, todas as refeições e a
              viagem a partir do ponto de encontro. Não há extras. Não há nada mais a pagar, nem
              lá, nem depois.
            </p>
            {FUNDED_PLACES_AVAILABLE && (
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
                Se o dinheiro for um obstáculo, não é um obstáculo. Há lugares financiados, e não
                perguntamos nada sobre a tua situação financeira no formulário. Se fores convocado
                e o valor não der, respondes uma linha ao email: «preciso de lugar financiado.»
                Sem explicação, sem documentos, sem conversa.
              </p>
            )}
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
              Podes dizer que não. Se fores convocado e não conseguires vir, respondes «não vou
              conseguir» e acabou — sem motivo, sem efeito em candidaturas futuras.
            </p>
          </div>
        </section>
      )}

      {/* 9. Selection */}
      <section className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
            A seleção
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-wepac-text-secondary">
            {SELECTION_NOTE}
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SELECTION_CRITERIA.map((criterion) => (
              <div key={criterion.title} className="border border-wepac-border bg-wepac-card p-6">
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
            {CRISIS_NOTE}
          </p>

          <div className="mx-auto mt-14 max-w-2xl">
            <h3 className="text-center font-barlow text-xl font-bold text-wepac-white">
              O que te vamos perguntar
            </h3>
            <ul className="mt-6 grid grid-cols-1 gap-3">
              {APPLICATION_QUESTIONS.map((question, index) => (
                <li
                  key={question}
                  className="border border-wepac-border bg-wepac-card p-4 text-sm leading-relaxed text-wepac-text-secondary"
                >
                  <span className="text-wepac-text-tertiary">{index + 1}. </span>
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
              Quem te acompanha
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {MENTORS.map((mentor) => (
                <div key={mentor.name} className="border border-wepac-border bg-wepac-card p-6">
                  <p className="font-barlow text-lg font-bold text-wepac-white">{mentor.name}</p>
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
            From packer to WEPACker.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-wepac-text-secondary">
            A comporta não se abre sozinha. A Travessia é o troço que não se rema — carrega-se, e
            não se carrega sozinho.
          </p>
          <div className="mt-10">
            {APPLY_ENABLED ? (
              <a
                href="/wepacker/intake"
                className="inline-block border border-wepac-border bg-wepac-white px-8 py-3 text-sm font-bold text-wepac-black transition-colors hover:bg-wepac-accent-muted"
              >
                Candidatar-me à Travessia
              </a>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="inline-block cursor-not-allowed border border-wepac-border bg-wepac-card px-8 py-3 text-sm font-bold text-wepac-text-tertiary"
              >
                Candidaturas abrem em breve
              </button>
            )}
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-wepac-text-tertiary">
              Candidaturas até {APPLICATION_DEADLINE}. Idades entre os {AGE_RANGE.min} e os{" "}
              {AGE_RANGE.max} anos.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-wepac-border px-6 py-12 lg:px-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <span className="font-barlow text-2xl font-bold text-wepac-white">A Travessia</span>
          <p className="text-xs text-wepac-text-tertiary">
            Universidade de Verão WEPAC Society — uma porta da WEPAC Society
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
        </div>
      </footer>
    </div>
  );
}
