import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/FadeIn";
import { projects } from "@/data/projects";
import { getLocale } from "next-intl/server";
import { getInstitutionalPagesCopy } from "@/i18n/copy/institutional-pages";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getInstitutionalPagesCopy(await getLocale()).projects;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function ProjetosPage() {
  const copy = getInstitutionalPagesCopy(await getLocale()).projects;
  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 text-lg text-wepac-white/60">
              {copy.introduction}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-wepac-dark px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-24">
          {projects.map((sourceProject, i) => {
            const project = copy.bySlug[sourceProject.slug] ?? sourceProject;
            return (
            <FadeIn key={sourceProject.slug}>
              <Link
                href={`/projetos/${sourceProject.slug}`}
                className="group grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center"
              >
                <div className={i % 2 === 1 ? "md:order-2" : ""}>
                  <div className="aspect-[16/10] overflow-hidden bg-wepac-gray/10">
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/5 to-white/0 transition-colors group-hover:from-white/10">
                      <span className="font-barlow text-3xl md:text-5xl font-bold text-wepac-white/10 transition-colors group-hover:text-wepac-white/20">
                        {project.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={i % 2 === 1 ? "md:order-1" : ""}>
                  <p className="text-sm font-bold uppercase tracking-widest text-wepac-white/40">
                    {project.tagline}
                  </p>
                  <h2 className="mt-2 font-barlow text-3xl font-bold text-wepac-white md:text-4xl">
                    {project.name}
                  </h2>
                  <p className="mt-4 leading-relaxed text-wepac-white/60">
                    {project.description}
                  </p>
                  <span className="mt-6 inline-block font-barlow text-sm font-bold uppercase tracking-wider text-wepac-white/50 transition-colors group-hover:text-wepac-white">
                    {copy.learnMore}
                  </span>
                </div>
              </Link>
            </FadeIn>
            );
          })}
        </div>
      </section>
    </div>
  );
}
