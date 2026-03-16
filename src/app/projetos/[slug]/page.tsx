import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";
import { projects } from "@/data/projects";

export async function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.description,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) notFound();

  return (
    <div className="pt-20">
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <Link
              href="/projetos"
              className="text-sm text-wepac-white/40 transition-colors hover:text-wepac-white"
            >
              ← Projetos
            </Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-widest text-wepac-white/40">
              {project.tagline}
            </p>
            <h1 className="mt-4 font-barlow text-4xl font-bold text-wepac-white md:text-6xl lg:text-7xl">
              {project.name}
            </h1>
          </FadeIn>
        </div>
      </section>

      {/* Image placeholder */}
      <section className="bg-wepac-dark">
        <div className="mx-auto max-w-7xl">
          <div className="aspect-[21/9] bg-wepac-gray/10">
            <div className="flex h-full items-center justify-center">
              <span className="font-barlow text-6xl font-bold text-wepac-white/5">
                {project.name}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <p className="text-lg leading-relaxed text-wepac-white/70 md:text-xl">
              {project.longDescription}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-wepac-dark px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <h2 className="font-barlow text-2xl font-bold text-wepac-white md:text-3xl">
              Destaques
            </h2>
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {project.highlights.map((highlight, i) => (
              <FadeIn key={highlight} delay={i * 0.1}>
                <div className="border-l-2 border-wepac-white/20 pl-6 py-4">
                  <p className="font-barlow text-lg font-bold text-wepac-white">
                    {highlight}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-wepac-black px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <p className="text-lg text-wepac-white/50">
              Interessado neste projeto?
            </p>
            <Link
              href="/contacto"
              className="mt-6 inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
            >
              Entre em contacto
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
