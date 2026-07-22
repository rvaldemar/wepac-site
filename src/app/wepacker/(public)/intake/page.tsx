import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getActivePacksPublic } from "@/lib/wepacker/actions/admin";
import { CandidaturaFormClient } from "../[pack]/intake/page-client";

export const metadata: Metadata = {
  title: "Intake — WEPACKER",
  description:
    "Candidata-te ao WEPACKER — o caminho de desenvolvimento humano integral da WEPAC. Não precisas de escolher uma Discipline: começa aqui.",
};

export const revalidate = 300;

// Generic intake: apply to WEPACKER itself without choosing a legacy
// delivery Discipline first.
export default async function GeneralIntakePage() {
  const packs = (await getActivePacksPublic()).filter(
    (pack) => pack.slug === "artist"
  );

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
            Intake · WEPACKER
          </p>
          <h1 className="mt-3 font-barlow text-3xl font-bold text-wepac-white md:text-5xl">
            Torna-te WEPACker
          </h1>
          <p className="mt-4 text-lg font-medium text-wepac-gray">
            From packers to WEPACkers.
          </p>
          <p className="mt-4 text-base leading-relaxed text-wepac-text-secondary">
            Um wepacker carrega o seu próprio peso — e ainda entrega valor à
            comunidade. Não precisas de escolher já uma Discipline: conta-nos quem és
            e o que queres desenvolver, e a equipa encontra contigo o caminho
            certo.
          </p>
          <p className="mt-6 text-sm text-wepac-text-tertiary">
            Preenche o formulário. A equipa analisa o teu perfil e entra em
            contacto.
          </p>

          <div className="mt-10">
            <CandidaturaFormClient packSlug="wepacker" />
          </div>

          {packs.length > 0 && (
            <div className="mt-12 border-t border-wepac-border pt-8">
              <p className="text-sm text-wepac-text-tertiary">
                Já sabes qual Discipline queres explorar? Escolhe-a diretamente:
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {packs.map((pack) => (
                  <Link
                    key={pack.slug}
                    href={`/wepacker/${pack.slug}/intake`}
                    className="border border-wepac-border px-4 py-2 text-sm text-wepac-text-secondary transition-colors hover:border-wepac-white hover:text-wepac-white"
                  >
                    Arts →
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
