"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import { useMobileDrawer } from "@/lib/useMobileDrawer";
import { getSocietyIntakeHref } from "@/lib/society/intake-source";

const societyNavigation = [
  { key: "lifePlan", href: "/society/life-plan" },
  { key: "families", href: "/society/familias" },
  { key: "academy", href: "/academy" },
  { key: "artsCompany", href: "/companhia-de-artes" },
] as const;

// WEPAC Society is the parent brand; the Companhia de Artes is its artistic
// arm and gets its own navigation on its sections.
const companhiaNavigation = [
  { key: "wessex", href: "/wessex" },
  { key: "arteACapela", href: "/arte-a-capela" },
  { key: "ticketing", href: "/bilheteira" },
  { key: "artists", href: "/artist" },
  { key: "society", href: "/society" },
] as const;

const COMPANHIA_SECTIONS = [
  "/companhia-de-artes",
  "/wessex",
  "/arte-a-capela",
  "/bilheteira",
  "/artist",
  "/servicos",
];

function inSection(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SocietyHeader() {
  const t = useTranslations("Navigation.society");
  const common = useTranslations("Common");
  const pathname = usePathname();
  const intakeHref = getSocietyIntakeHref(pathname);
  const companhia = COMPANHIA_SECTIONS.some((href) => inSection(pathname, href));
  const navigation = companhia ? companhiaNavigation : societyNavigation;
  const cta = companhia
    ? { href: "/bilheteira", label: t("seeTickets") }
    : { href: intakeHref, label: t("startLifePlan") };
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const { toggleRef, drawerRef } = useMobileDrawer<HTMLButtonElement, HTMLDivElement>(
    menuOpen,
    closeMenu
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <nav
        className="mx-auto flex h-20 max-w-[1760px] items-center justify-between px-5 sm:px-8 lg:px-12"
        aria-label={common("navigation")}
      >
        <Link
          href={companhia ? "/companhia-de-artes" : "/society"}
          className="flex items-center gap-4"
          aria-label={companhia ? `WEPAC ${t("artsCompany")}` : "WEPAC Society"}
        >
          <Image
            src="/logo/wepac/wordmark-white.png"
            alt="WEPAC"
            width={151}
            height={38}
            className="h-5 w-auto sm:h-6"
            priority
          />
          <span className="hidden border-l border-white/25 pl-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75 sm:block">
            {companhia ? t("artsCompany") : "Society"}
          </span>
        </Link>

        <div className="hidden items-center gap-4 xl:flex">
          {navigation.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={inSection(pathname, item.href) ? "page" : undefined}
              className={`text-[13px] font-medium transition-colors hover:text-white ${
                inSection(pathname, item.href) ? "text-white" : "text-white/70"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
          <Link
            href="/wepacker/login"
            className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75 transition-colors hover:text-white"
          >
            {t("openBackpack")}
          </Link>
          <Link
            href={cta.href}
            className="border border-white bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-wepac-gray"
          >
            {cta.label}
          </Link>
          <LocaleSwitcher />
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <LocaleSwitcher className="[&_select]:w-32 sm:[&_select]:w-48" />
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center border border-white/15 text-white"
            aria-expanded={menuOpen}
            aria-controls="society-mobile-menu"
            aria-label={menuOpen ? common("closeMenu") : common("openMenu")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path strokeLinecap="round" d="M5 5l14 14M19 5 5 19" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="society-mobile-menu"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={common("navigation")}
          tabIndex={-1}
          className="max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-t border-white/10 bg-black px-5 py-7 xl:hidden"
        >
          <div className="mx-auto flex max-w-[1760px] flex-col">
            {navigation.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={closeMenu}
                className="border-b border-white/10 py-4 font-barlow text-2xl font-bold text-white"
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              href="/wepacker/login"
              onClick={closeMenu}
              className="mt-6 border border-white/25 px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-white"
            >
              {t("openBackpack")}
            </Link>
            <Link
              href={cta.href}
              onClick={closeMenu}
              className="mt-3 bg-white px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-black"
            >
              {cta.label}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
