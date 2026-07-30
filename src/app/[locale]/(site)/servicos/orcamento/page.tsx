import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";
import { OrcamentoTabs } from "@/components/wessex/OrcamentoTabs";
import { getLocale } from "next-intl/server";
import { getInstitutionalPagesCopy } from "@/i18n/copy/institutional-pages";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getInstitutionalPagesCopy(await getLocale()).quote;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function OrcamentoPage() {
  const copy = getInstitutionalPagesCopy(await getLocale()).quote;
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/50">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-3 text-base text-wepac-white/60">
              {copy.introduction}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-8 md:py-12 lg:px-8 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl">
          <OrcamentoTabs />
        </div>
      </section>
    </div>
  );
}
