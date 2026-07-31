"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { getSocietyIntakeHref } from "@/lib/society/intake-source";

export function SocietyFooter() {
  const t = useTranslations("SocietyFooter");
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
              {t("description")}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
              {t("home")}
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/65">
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
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
              {t("paths")}
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/65">
              <Link href={intakeHref} className="hover:text-white">
                {t("startLifePlan")}
              </Link>
              <Link href="/wepacker/login" className="hover:text-white">{t("openBackpack")}</Link>
              <Link href="/bilheteira" className="hover:text-white">{t("ticketing")}</Link>
              <Link href="/wessex" className="hover:text-white">Wessex</Link>
              <Link href="/arte-a-capela" className="hover:text-white">Arte à Capela</Link>
              <Link href="/contacto" className="hover:text-white">{t("contact")}</Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
              {t("follow")}
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
            <Link href="/privacidade" className="hover:text-white">{t("privacy")}</Link>
            <span>From packers to WEPACkers.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
