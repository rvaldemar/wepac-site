import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ApplicationFormClient } from "./page-client";

export const metadata: Metadata = {
  title: "Intake — WEPACKER",
  description:
    "Candidata-te ao WEPACKER — o caminho de desenvolvimento humano integral da WEPAC. Não precisas de escolher uma Discipline: começa aqui.",
};

export default async function GeneralIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ artisticArea?: string }>;
}) {
  const { artisticArea } = await searchParams;

  return (
    <div className="min-h-screen bg-wepac-black">
      <header className="flex items-center justify-between px-6 py-6 lg:px-12">
        <Link href="/wepacker">
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
            <ApplicationFormClient initialArtisticArea={artisticArea} />
          </div>
        </div>
      </section>
    </div>
  );
}
