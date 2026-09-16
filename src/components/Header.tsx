"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Link } from "@/i18n/navigation";
import { useMobileDrawer } from "@/lib/useMobileDrawer";

const navigation = [
  { key: "about", href: "/sobre" },
  { key: "wessex", href: "/wessex" },
  { key: "easyPeasy", href: "/projetos/easy-peasy" },
  { key: "arteACapela", href: "/arte-a-capela" },
  { key: "artists", href: "/artist" },
  { key: "agenda", href: "/programacao" },
  { key: "society", href: "/society" },
  { key: "contact", href: "/contacto" },
] as const;

export function Header() {
  const t = useTranslations("Navigation.site");
  const common = useTranslations("Common");
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const { toggleRef, drawerRef } = useMobileDrawer<HTMLButtonElement, HTMLDivElement>(
    menuOpen,
    closeMenu
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-wepac-black/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="font-barlow text-xl font-bold tracking-tight text-wepac-white">
          wepac
        </Link>

        {/* Desktop nav */}
        <div className="hidden xl:flex xl:items-center xl:gap-7">
          {navigation.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="font-inter text-sm text-wepac-white/70 transition-colors hover:text-wepac-white"
            >
              {t(item.key)}
            </Link>
          ))}
          <LocaleSwitcher />
        </div>

        {/* Mobile menu button */}
        <button
          ref={toggleRef}
          className="text-wepac-white xl:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={menuOpen ? common("closeMenu") : common("openMenu")}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-nav-menu"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={common("navigation")}
          tabIndex={-1}
          className="border-t border-white/10 bg-wepac-black xl:hidden"
        >
          <div className="flex flex-col px-6 py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="font-inter text-base text-wepac-white/70 transition-colors hover:text-wepac-white"
                onClick={closeMenu}
              >
                {t(item.key)}
              </Link>
            ))}
            <LocaleSwitcher className="pt-2" />
          </div>
        </div>
      )}
    </header>
  );
}
