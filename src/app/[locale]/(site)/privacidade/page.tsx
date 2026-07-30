import { Metadata } from "next";
import { FadeIn } from "@/components/FadeIn";
import { getLocale } from "next-intl/server";
import { getPrivacyCopy } from "@/i18n/copy/institutional-privacy";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getPrivacyCopy(await getLocale());
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function PrivacidadePage() {
  const copy = getPrivacyCopy(await getLocale());
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-16 md:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h1 className="font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 text-sm text-wepac-white/40">
              {copy.updated}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-10 text-sm leading-relaxed text-wepac-white/70">
          {copy.sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-barlow text-lg font-bold text-wepac-white">
                {section.title}
              </h2>
              {section.bullets && (
                <ul className="mt-3 ml-4 list-disc space-y-2 text-wepac-white/60">
                  {section.bullets.map((item) => (
                    <li key={item.label}>
                      <strong className="text-wepac-white/80">
                        {item.label}
                      </strong>{" "}
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
              {section.paragraphs?.map((paragraph, index) => (
                <p key={paragraph} className="mt-3">
                  {paragraph}
                  {section.contactLink && index === 0 && (
                    <>
                      {" "}
                      <a
                        href="mailto:info@wepac.pt"
                        className="text-wepac-gray underline"
                      >
                        info@wepac.pt
                      </a>
                      .
                    </>
                  )}
                  {section.authorityLink && index === 0 && (
                    <>
                      {" "}
                      <a
                        href="https://www.cnpd.pt/"
                        className="text-wepac-gray underline"
                        rel="noreferrer"
                        target="_blank"
                      >
                        cnpd.pt
                      </a>
                      .
                    </>
                  )}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
