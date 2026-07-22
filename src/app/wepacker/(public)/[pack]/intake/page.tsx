import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getActivePacksPublic } from "@/lib/wepacker/actions/admin";
import { CandidaturaFormClient } from "./page-client";

interface PageProps {
  params: Promise<{ pack: string }>;
}

async function resolvePack(slug: string) {
  if (slug !== "artist") return null;
  const packs = await getActivePacksPublic();
  return packs.find((p) => p.slug === slug) ?? null;
}

function disciplineName(): string {
  return "Arts";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pack: slug } = await params;
  const pack = await resolvePack(slug);
  if (!pack) return { title: "WEPACKER" };
  return {
    title: `Intake — ${disciplineName()}`,
    description: pack.tagline || pack.description || undefined,
  };
}

export default async function CandidaturaPage({ params }: PageProps) {
  const { pack: slug } = await params;
  const pack = await resolvePack(slug);
  if (!pack) notFound();
  const displayName = disciplineName();

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
            Intake · {displayName}
          </p>
          <h1 className="mt-3 font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
            Explora a Discipline {displayName}
          </h1>
          {pack.tagline && (
            <p className="mt-4 text-lg font-medium text-wepac-gray">{pack.tagline}</p>
          )}
          {pack.description && (
            <p className="mt-4 text-base leading-relaxed text-wepac-text-secondary">
              {pack.description}
            </p>
          )}
          <p className="mt-6 text-sm text-wepac-text-tertiary">
            Preenche o formulário. A equipa analisa o teu perfil e entra em contacto.
          </p>

          <div className="mt-10">
            <CandidaturaFormClient packSlug={pack.slug} />
          </div>
        </div>
      </section>
    </div>
  );
}
