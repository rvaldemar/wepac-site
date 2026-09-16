import type { Metadata } from "next";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CandidaturaFormClient } from "./page-client";
import {
  intakePageSurfaceCopy,
  type GenericIntakeSource,
  type IntakePageSurfaceCopy,
} from "@/i18n/copy/society-surfaces";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const copy = intakePageSurfaceCopy[locale].metadata;

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: "/wepacker/intake" },
    robots: { index: false, follow: false },
  };
}

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
  organizations: "organizations",
  "/organizations": "organizations",
  organizacoes: "organizations",
  "/organizacoes": "organizations",
  organization: "organizations",
  "/organization": "organizations",
  rh: "organizations",
  "/rh": "organizations",
};

function resolveSource(
  rawSource: string | string[] | undefined,
): GenericIntakeSource | undefined {
  if (typeof rawSource !== "string") return undefined;
  return GENERIC_INTAKE_SOURCES[rawSource.trim().toLowerCase()];
}

// Generic intake: apply to WEPACKER itself without choosing a legacy
// delivery Discipline first.
export default async function GeneralIntakePage({ searchParams }: PageProps) {
  const locale = (await getLocale()) as AppLocale;
  const copy: IntakePageSurfaceCopy = intakePageSurfaceCopy[locale];
  const { source: rawSource } = await searchParams;
  const source = resolveSource(rawSource);
  const context = source ? copy.contexts[source] : undefined;

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
          {copy.signIn}
        </Link>
      </header>

      <section className="px-6 py-12 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-wepac-gray">
            {context?.eyebrow ?? copy.defaultEyebrow}
          </p>
          <h1 className="mt-3 font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-lg font-medium text-wepac-gray">
            {copy.subtitle}
          </p>
          <p className="mt-4 text-base leading-relaxed text-wepac-text-secondary">
            {context?.intro ?? copy.defaultIntro} {copy.directionLine}
          </p>
          <p className="mt-6 text-sm text-wepac-text-tertiary">
            {copy.reassurance}
          </p>

          <div className="mt-10">
            <CandidaturaFormClient key={source ?? "generic"} source={source} />
          </div>
        </div>
      </section>
    </div>
  );
}
