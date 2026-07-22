import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  behindItBody,
  closing,
  complaintsBody,
  dataPrivacyBody,
  emergencyBand,
  noPhotosBody,
  ourThreeThings,
  phoneNumber,
  pillarsClosing,
  pillarsIntro,
  pricingClosing,
  pricingIntro,
  pricingLines,
  primaryCta,
  processClosing,
  processSteps,
  sixPillars,
  situations,
  teamPolicy,
  threeThingsFirst,
  whatItIsNot,
  whoItIsFor,
  whyMusic,
} from "@/data/clinica";

// Clínica WEPAC — landing page. Built to a three-lens review board's synthesis
// (scratchpad `clinica-proposta.md`): a calmer, off-white register than the
// rest of the site, "você" instead of "tu", no scroll-reveal, no photographs
// of children, no testimonials, no percentages, no scarcity devices. Every
// pending founder decision is tracked at the top of `src/data/clinica.ts` and
// rendered safely (omitted, not invented) until confirmed.

export const metadata: Metadata = {
  title: { absolute: "Clínica WEPAC — dos 0 aos 24 anos | WEPAC" },
  description:
    "A Clínica WEPAC junta uma equipa pedagógica e uma equipa clínica para crianças e jovens dos 0 aos 24 anos. Abre em Lisboa em setembro de 2026.",
};

// Static placeholder CTA — deliberately not wired to any submission
// endpoint. See TODO 18 in src/data/clinica.ts before adding an onClick or a
// form action here. This is NOT the WEPACKER intake/candidatura pipeline —
// another front owns and is actively changing that flow, and the synthesis's
// own clinical veto forbids any transactional booking before the Clínica is
// registered/licensed and physically open.
function PrimaryCta({ idSuffix }: { idSuffix: string }) {
  return (
    <button
      type="button"
      aria-describedby={`cta-note-${idSuffix}`}
      className="inline-block bg-wepac-black px-8 py-3 text-sm font-bold text-white transition-opacity hover:opacity-85"
    >
      {primaryCta.label}
    </button>
  );
}

export default function ClinicaPage() {
  return (
    <div className="min-h-screen bg-[#F7F6F3] font-inter text-wepac-black">
      {/* Header — the phone number stays visible at any scroll position.
          TODO 6 (src/data/clinica.ts): no dedicated Clínica line confirmed
          yet, so this reuses the real, already-public general WEPAC number
          from /contacto rather than a fabricated one. */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-wepac-black/10 bg-[#F7F6F3]/95 px-4 py-3 backdrop-blur sm:px-6">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo/wepac/lockup-black.png"
            alt="WEPAC"
            width={120}
            height={32}
            className="h-7 w-auto sm:h-8"
            priority
          />
        </Link>
        <a
          href={phoneNumber.href}
          className="text-sm font-semibold text-wepac-black underline-offset-4 hover:underline sm:text-base"
        >
          {phoneNumber.display}
        </a>
      </header>

      <main>
        {/* Bloco 1 — Hero */}
        <section className="px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-14">
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-black/60">
              Clínica WEPAC · uma área da WEPAC · abre em Lisboa em setembro de 2026
            </p>
            <h1 className="mt-5 font-barlow text-3xl font-bold leading-tight text-wepac-black sm:text-4xl md:text-5xl">
              Alguma coisa lhe chamou a atenção. Isso chega para começarmos.
            </h1>
            <p className="mt-6 text-lg leading-loose text-wepac-black/80">
              A Clínica WEPAC junta no mesmo sítio uma equipa pedagógica e uma equipa clínica que
              falam entre si, para crianças e jovens dos 0 aos 24 anos. Começa sempre da mesma
              maneira: uma conversa em que ouvimos o que tem reparado — sem lhe pedir relatórios,
              sem lhe pedir que prove nada, sem lhe pedir um diagnóstico prévio. Não substituímos o
              seu médico, não substituímos a escola e não substituímos nenhum acompanhamento que já
              esteja a decorrer. E não lhe prometemos resultados que ninguém pode garantir.
            </p>
            <p className="mt-6 text-lg font-semibold leading-loose text-wepac-black">
              Dos 0 aos 24 anos. Também aos 19, aos 22 e aos 24 — a idade a que quase todas as
              portas se fecham.
            </p>
            <div className="mt-8">
              <PrimaryCta idSuffix="hero" />
              <p id="cta-note-hero" className="mt-4 max-w-md text-sm leading-relaxed text-wepac-black/60">
                Abrimos em Lisboa em setembro de 2026. Até lá, deixe-nos o seu contacto e
                ligamos-lhe.
              </p>
            </div>
          </div>
        </section>

        {/* Bloco 2 — Banda de encaminhamento. Immediately after the hero,
            before any persuasive text. Not negotiable, repeats near the final
            CTA (Bloco 13). */}
        <section className="border-y border-wepac-black/10 bg-wepac-gray px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <p className="text-lg font-bold leading-snug text-wepac-black">
              {emergencyBand.heading}
            </p>
            <p className="mt-3 text-base leading-relaxed text-wepac-black/80">
              {emergencyBand.body}
            </p>
          </div>
        </section>

        {/* Bloco 3 — Talvez esteja aqui por uma destas razões */}
        <section className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-barlow text-2xl font-bold text-wepac-black sm:text-3xl">
              Talvez esteja aqui por uma destas razões.
            </h2>
            <div className="mt-8 space-y-5">
              {situations.map((line) => (
                <p key={line} className="text-lg leading-loose text-wepac-black/80">
                  {line}
                </p>
              ))}
            </div>
            <p className="mt-10 text-lg font-bold text-wepac-black">Antes de mais, três coisas.</p>
            <div className="mt-5 space-y-5">
              {threeThingsFirst.map((line) => (
                <p key={line} className="text-lg leading-loose text-wepac-black/80">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Bloco 4 — Para quem é, e para quem não é.
            TODO 8 (src/data/clinica.ts): the "primeira conversa só com o
            pai/mãe" sentence is intentionally not rendered — not approved
            yet. */}
        <section className="border-t border-wepac-black/10 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-barlow text-2xl font-bold text-wepac-black sm:text-3xl">
              Para quem é — e para quem não é
            </h2>
            <div className="mt-8 space-y-5">
              <p className="text-lg leading-loose text-wepac-black/80">{whoItIsFor.ageScope}</p>
              <p className="text-lg leading-loose text-wepac-black/80">
                {whoItIsFor.notForUrgentCare}
              </p>
            </div>
          </div>
        </section>

        {/* Bloco 5 — O que acontece, por ordem. Each step carries its own
            limit in the same line and the same type size as the rest of the
            step — never a separate small-print limitations section. */}
        <section className="border-t border-wepac-black/10 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-barlow text-2xl font-bold text-wepac-black sm:text-3xl">
              O que acontece, por ordem
            </h2>
            <p className="mt-3 text-base text-wepac-black/60">
              Sem letra pequena e sem etapas que só descobre no fim.
            </p>
            <div className="mt-8 space-y-7">
              {processSteps.map((step) => (
                <p key={step.number} className="text-lg leading-loose text-wepac-black/80">
                  <strong className="text-wepac-black">
                    {step.number} · {step.title}
                  </strong>{" "}
                  {step.body}
                </p>
              ))}
            </div>
            <div className="mt-10 space-y-5">
              <p className="text-lg leading-loose text-wepac-black/80">
                <strong className="text-wepac-black">{processClosing.boldLead}</strong>{" "}
                {processClosing.body}
              </p>
              <p className="text-lg italic leading-loose text-wepac-black/70">
                {processClosing.closingLine}
              </p>
            </div>
          </div>
        </section>

        {/* Bloco 6 — Não começamos pelo que falta (Six Pillars + music) */}
        <section className="border-t border-wepac-black/10 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-barlow text-2xl font-bold text-wepac-black sm:text-3xl">
              Não começamos pelo que falta
            </h2>
            <p className="mt-6 text-lg leading-loose text-wepac-black/80">{pillarsIntro}</p>
            <div className="mt-8 space-y-3">
              {sixPillars.map((pillar) => (
                <p key={pillar.label} className="text-lg leading-loose text-wepac-black/80">
                  <strong className="text-wepac-black">{pillar.label}</strong> — {pillar.body}
                </p>
              ))}
            </div>
            <p className="mt-8 text-lg leading-loose text-wepac-black/80">{pillarsClosing}</p>
            <p className="mt-10 text-lg font-bold text-wepac-black">
              E porquê música numa clínica?
            </p>
            <p className="mt-3 text-lg leading-loose text-wepac-black/80">{whyMusic}</p>
          </div>
        </section>

        {/* Bloco 7 — Três coisas nossas, e o que cada uma é. Naming honours
            the clinical-ethics veto: "Trabalho Neurosensorial WEPAC", never
            "Terapia Neurosensorial" in public. */}
        <section className="border-t border-wepac-black/10 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-barlow text-2xl font-bold text-wepac-black sm:text-3xl">
              Três coisas nossas, e o que cada uma é
            </h2>
            <div className="mt-8 space-y-6">
              {ourThreeThings.map((thing) => (
                <p key={thing.name} className="text-lg leading-loose text-wepac-black/80">
                  <strong className="text-wepac-black">{thing.name}</strong> {thing.body}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Bloco 8 — O que a Clínica WEPAC não é. Every refusal points
            inward. */}
        <section className="border-t border-wepac-black/10 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-barlow text-2xl font-bold text-wepac-black sm:text-3xl">
              O que a Clínica WEPAC não é
            </h2>
            <div className="mt-8 space-y-5">
              {whatItIsNot.map((line) => (
                <p key={line} className="text-lg leading-loose text-wepac-black/80">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Bloco 9 — Quem vai estar na sala.
            TODO 2 (src/data/clinica.ts, LAUNCH BLOCKER): no names, formação
            or cédula numbers exist yet. Nothing is invented here — only the
            generic policy paragraph is rendered. The team roster itself goes
            directly below this comment, once confirmed. */}
        <section className="border-t border-wepac-black/10 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-barlow text-2xl font-bold text-wepac-black sm:text-3xl">
              Quem vai estar na sala
            </h2>
            <p className="mt-8 text-lg leading-loose text-wepac-black/80">{teamPolicy}</p>
          </div>
        </section>

        {/* Bloco 10 — Quanto custa. Placed after the team and immediately
            before the close, per the synthesis's own ruling. No "~" ranges,
            no financial-aid sentence and no insurance line until real
            mechanisms exist — see TODO 9-11 in src/data/clinica.ts. */}
        <section className="border-t border-wepac-black/10 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-barlow text-2xl font-bold text-wepac-black sm:text-3xl">
              Quanto custa
            </h2>
            <p className="mt-6 text-lg leading-loose text-wepac-black/80">{pricingIntro}</p>
            <div className="mt-8 space-y-4">
              {pricingLines.map((line) => (
                <p key={line.label} className="text-lg leading-loose text-wepac-black/80">
                  <strong className="text-wepac-black">{line.label}</strong> — {line.value}
                </p>
              ))}
            </div>
            <p className="mt-8 text-lg leading-loose text-wepac-black/80">{pricingClosing}</p>
          </div>
        </section>

        {/* Bloco 11 — Informação, imagem, reclamações */}
        <section className="border-t border-wepac-black/10 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-barlow text-2xl font-bold text-wepac-black sm:text-3xl">
              A informação do seu filho
            </h2>
            <div className="mt-8 space-y-5">
              <p className="text-lg leading-loose text-wepac-black/80">{dataPrivacyBody}</p>
              <p className="text-lg leading-loose text-wepac-black/80">{noPhotosBody}</p>
              <p className="text-lg leading-loose text-wepac-black/80">{complaintsBody}</p>
            </div>
          </div>
        </section>

        {/* Bloco 12 — Quem está por trás. Zero WEPACker vocabulary, zero
            Society CTA. */}
        <section className="border-t border-wepac-black/10 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-barlow text-2xl font-bold text-wepac-black sm:text-3xl">
              Quem está por trás
            </h2>
            <p className="mt-6 text-lg leading-loose text-wepac-black/80">{behindItBody}</p>
            <Link
              href="/sobre"
              className="mt-6 inline-block text-base font-bold text-wepac-black underline-offset-4 hover:underline"
            >
              Conhecer a WEPAC →
            </Link>
          </div>
        </section>

        {/* Bloco 13 — Fecho + CTA. The emergency band repeats here, near the
            final CTA, in its shorter form. TODO 3 (src/data/clinica.ts):
            address intentionally omitted, not confirmed yet. */}
        <section className="border-t border-wepac-black/10 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <p className="text-lg leading-loose text-wepac-black/80">{closing.intro}</p>
            <div className="mt-8">
              <PrimaryCta idSuffix="closing" />
              <p id="cta-note-closing" className="mt-4 text-base leading-relaxed text-wepac-black/70">
                {closing.ctaCaption}
              </p>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-wepac-black/60">{closing.formNote}</p>
            <p className="mt-4 text-lg leading-loose text-wepac-black/80">{closing.openingLine}</p>
          </div>
        </section>

        <section className="border-y border-wepac-black/10 bg-wepac-gray px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <p className="text-base leading-relaxed text-wepac-black/80">
              {closing.emergencyRepeat}
            </p>
          </div>
        </section>
      </main>

      {/* Bloco 14 — Rodapé.
          TODO 4 (src/data/clinica.ts, LAUNCH BLOCKER): entidade operadora,
          NIPC, morada, diretor técnico, número de registo ERS e de
          licenciamento — none confirmed, none rendered. Only structural
          navigation links. */}
      <footer className="border-t border-wepac-black/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="font-barlow text-xl font-bold text-wepac-black">Clínica WEPAC</span>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-wepac-black/60">
            <Link href="/" className="transition-colors hover:text-wepac-black">
              wepac.pt
            </Link>
            <Link href="/privacidade" className="transition-colors hover:text-wepac-black">
              Política de privacidade
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
