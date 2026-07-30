"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSocietyIntakeHref } from "@/lib/society/intake-source";

export function SocietyFooter() {
  const intakeHref = getSocietyIntakeHref(usePathname());

  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/society" aria-label="WEPAC Society">
              <Image
                src="/logo/wepac/lockup-white.png"
                alt="WEPAC"
                width={236}
                height={118}
                className="h-14 w-auto"
              />
            </Link>
            <p className="mt-6 max-w-sm font-barlow text-xl font-bold leading-relaxed text-white/70">
              Educação para uma vida inteira. A pessoa antes da performance, o carácter antes da
              habilidade e a família como primeiro lugar do caminho.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
              A casa
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/65">
              <Link href="/society" className="hover:text-white">Society</Link>
              <Link href="/society/life-plan" className="hover:text-white">Life Plan</Link>
              <Link href="/society/familias" className="hover:text-white">Famílias</Link>
              <Link href="/academy" className="hover:text-white">WEPAC Academy</Link>
              <Link href="/companhia-de-artes" className="hover:text-white">
                Companhia de Artes
              </Link>
              <Link href="/society#mission" className="hover:text-white">WEPAC Mission</Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
              Caminhos
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/65">
              <Link href={intakeHref} className="hover:text-white">
                Começar Life Plan
              </Link>
              <Link href="/wepacker/login" className="hover:text-white">Abrir Backpack</Link>
              <Link href="/bilheteira" className="hover:text-white">Bilheteira</Link>
              <Link href="/wessex" className="hover:text-white">Wessex</Link>
              <Link href="/arte-a-capela" className="hover:text-white">Arte à Capela</Link>
              <Link href="/contacto" className="hover:text-white">Contacto</Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
              Seguir
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/65">
              <a
                href="https://www.instagram.com/wepac.oficial/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                Instagram ↗
              </a>
              <a href="mailto:info@wepac.pt" className="hover:text-white">
                info@wepac.pt
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} WEPAC · Carcavelos, Portugal</p>
          <div className="flex gap-5">
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <span>From packers to WEPACkers.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
