import type { ReactNode } from "react";
import { FadeIn } from "@/components/FadeIn";
import type { LegalPage } from "@/i18n/copy/institutional-legal";

// Same layout as the privacy policy, for the other legal pages.
export function LegalPageView({ page, children }: { page: LegalPage; children?: ReactNode }) {
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-16 md:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h1 className="font-barlow text-3xl font-bold text-wepac-white md:text-5xl">{page.title}</h1>
            <p className="mt-4 text-sm text-wepac-white/40">{page.updated}</p>
          </FadeIn>
        </div>
      </section>
      <section className="bg-wepac-dark px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-wepac-white/70">
          {page.sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-barlow text-lg font-bold text-wepac-white">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
          {children}
        </div>
      </section>
    </div>
  );
}
