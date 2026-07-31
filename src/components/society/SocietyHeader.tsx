"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import { useMobileDrawer } from "@/lib/useMobileDrawer";
import { getSocietyIntakeHref } from "@/lib/society/intake-source";

const navigation = [
  { key: "lifePlan", href: "/society/life-plan" },
  { key: "families", href: "/society/familias" },
  { key: "academy", href: "/academy" },
  { key: "artsCompany", href: "/companhia-de-artes" },
] as const;

export function SocietyHeader() {
  const t = useTranslations("Navigation.society");
  const common = useTranslations("Common");
  const pathname = usePathname();
  const intakeHref = getSocietyIntakeHref(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const { toggleRef, drawerRef } = useMobileDrawer<HTMLButtonElement, HTMLDivElement>(
    menuOpen,
    closeMenu
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <nav
        className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12"
        aria-label={common("navigation")}
      >
        <Link href="/society" className="flex items-center gap-4" aria-label="WEPAC Society">
          <Image
            src="/logo/wepac/wordmark-white.png"
            alt="WEPAC"
            width={151}
            height={38}
            className="h-5 w-auto sm:h-6"
            priority
          />
          <span className="hidden border-l border-white/25 pl-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60 sm:block">
            Society
          </span>
        </Link>

        <div className="hidden items-center gap-4 2xl:flex">
          {navigation.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="text-[13px] font-medium text-white/65 transition-colors hover:text-white"
            >
              {t(item.key)}
            </Link>
          ))}
          <Link
            href="/wepacker/login"
            className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60 transition-colors hover:text-white"
          >
            {t("openBackpack")}
          </Link>
          <Link
            href={intakeHref}
            className="border border-white bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-wepac-gray"
          >
            {t("startLifePlan")}
          </Link>
          <LocaleSwitcher />
        </div>

        <div className="flex items-center gap-2 2xl:hidden">
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
          className="border-t border-white/10 bg-black px-5 py-7 2xl:hidden"
        >
          <div className="mx-auto flex max-w-[1440px] flex-col">
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
              href={intakeHref}
              onClick={closeMenu}
              className="mt-3 bg-white px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-black"
            >
              {t("startLifePlan")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
