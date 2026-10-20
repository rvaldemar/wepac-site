"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { getLegalCopy } from "@/i18n/copy/institutional-legal";
import { Link, usePathname } from "@/i18n/navigation";
import { getSocietyIntakeHref } from "@/lib/society/intake-source";

export function SocietyFooter() {
  const t = useTranslations("SocietyFooter");
  const intakeHref = getSocietyIntakeHref(usePathname());
  const nav = useTranslations("Navigation.society");
  const legal = getLegalCopy(useLocale()).footer;

  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-[1760px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
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
            <p className="mt-6 max-w-sm font-barlow text-xl font-bold leading-relaxed text-white/80">
              {t("description")}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
              {t("home")}
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/80">
              <Link href="/society" className="hover:text-white">Society</Link>
              <Link href="/society/life-plan" className="hover:text-white">Life Plan</Link>
              <Link href="/society/familias" className="hover:text-white">{t("families")}</Link>
              <Link href="/academy" className="hover:text-white">WEPAC Academy</Link>
              <Link href="/companhia-de-artes" className="hover:text-white">
                {t("artsCompany")}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
              {t("paths")}
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/80">
              <Link href="/wepacker/login" className="hover:text-white">{t("openBackpack")}</Link>
              <Link href={intakeHref} className="hover:text-white">
                {t("startLifePlan")}
              </Link>
              <Link href="/bilheteira" className="hover:text-white">{t("ticketing")}</Link>
              <Link href="/wessex" className="hover:text-white">Wessex</Link>
              <Link href="/arte-a-capela" className="hover:text-white">Arte à Capela</Link>
              <Link href="/artist" className="hover:text-white">{nav("artists")}</Link>
              <Link href="/contacto" className="hover:text-white">{t("contact")}</Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
              {t("follow")}
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/80">
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

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-white/60 lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {new Date().getFullYear()} WEPAC — Companhia de Artes, Lda · NIPC 518 267 342 · Carcavelos, Portugal
          </p>
          <nav aria-label={legal.privacy} className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacidade" className="hover:text-white">{legal.privacy}</Link>
            <Link href="/cookies" className="hover:text-white">{legal.cookies}</Link>
            <Link href="/termos" className="hover:text-white">{legal.terms}</Link>
            <a
              href="https://www.livroreclamacoes.pt/Inicio/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              {legal.complaints}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
