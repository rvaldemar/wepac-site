import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CandidaturaFormClient,
  type GenericIntakeSource,
} from "../[pack]/intake/page-client";

export const metadata: Metadata = {
  title: "Life Plan — WEPACKER",
  description:
    "Encontra o teu ponto de partida. O Life Plan ajuda-te a perceber onde estás, para onde queres ir e qual é o próximo passo.",
  alternates: { canonical: "/wepacker/intake" },
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ source?: string | string[] }>;
}

const GENERIC_INTAKE_SOURCES: Record<string, GenericIntakeSource> = {
  society: "society",
  "/society": "society",
  "life-plan": "life-plan",
  "/life-plan": "life-plan",
  familias: "familias",
  "/familias": "familias",
  academy: "academy",
  "/academy": "academy",
  "upgraded-backpack": "upgraded-backpack",
  "/upgraded-backpack": "upgraded-backpack",
};

const INTAKE_CONTEXT: Partial<
  Record<
    GenericIntakeSource,
    {
      eyebrow: string;
      intro: string;
    }
  >
> = {
  familias: {
    eyebrow: "Life Plan · Famílias",
    intro:
      "Conta-nos em que momento está a tua família e o que gostariam de construir em conjunto.",
  },
  academy: {
    eyebrow: "Life Plan · Academy",
    intro:
      "Conta-nos em que momento estás e o que queres desenvolver através da educação.",
  },
  "upgraded-backpack": {
    eyebrow: "Life Plan · Continuidade",
    intro:
      "A continuidade começa por perceber o teu ponto de partida. Conta-nos onde estás e o que procuras acompanhar.",
  },
};

function resolveSource(
  rawSource: string | string[] | undefined
): GenericIntakeSource | undefined {
  if (typeof rawSource !== "string") return undefined;
  return GENERIC_INTAKE_SOURCES[rawSource.trim().toLowerCase()];
}

// Generic intake: apply to WEPACKER itself without choosing a legacy
// delivery Discipline first.
export default async function GeneralIntakePage({ searchParams }: PageProps) {
  const { source: rawSource } = await searchParams;
  const source = resolveSource(rawSource);
  const context = source ? INTAKE_CONTEXT[source] : undefined;

  return (
    <div className="min-h-screen bg-wepac-black">
      <header className="flex items-center justify-between px-6 py-6 lg:px-12">
        <Link href="/society">
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
          href="/wepacker/login"
          className="text-xs text-wepac-text-tertiary transition-colors hover:text-wepac-white"
        >
          Entrar
        </Link>
      </header>

      <section className="px-6 py-12 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            {context?.eyebrow ?? "Life Plan · Ponto de partida"}
          </p>
          <h1 className="mt-3 font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
            Onde estás. Para onde vais. O que fazes a seguir.
          </h1>
          <p className="mt-4 text-lg font-medium text-wepac-gray">
            Tudo começa no Life Plan.
          </p>
          <p className="mt-4 text-base leading-relaxed text-wepac-text-secondary">
            {context?.intro ??
              "Conta-nos em que momento estás e o que gostarias de construir."}{" "}
            Ajudamos-te a encontrar direção e a transformar essa direção num
            próximo passo.
          </p>
          <p className="mt-6 text-sm text-wepac-text-tertiary">
            Este é um primeiro contacto, não precisas de ter as respostas todas.
            A equipa entra em contacto para encontrar contigo o ponto de partida.
          </p>

          <div className="mt-10">
            <CandidaturaFormClient
              key={source ?? "generic"}
              packSlug="wepacker"
              variant="generic"
              source={source}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
