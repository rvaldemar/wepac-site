"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Link } from "@/i18n/navigation";
import { useMobileDrawer } from "@/lib/useMobileDrawer";

type WessexHeaderProps = {
  navAbout: string;
  navEvents: string;
  navIdea: string;
  navTestimonials: string;
  calculate: string;
};

export function WessexHeader({
  navAbout,
  navEvents,
  navIdea,
  navTestimonials,
  calculate,
}: WessexHeaderProps) {
  const common = useTranslations("Common");
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const { toggleRef, drawerRef } = useMobileDrawer<HTMLButtonElement, HTMLDivElement>(
    menuOpen,
    closeMenu,
  );
  const navigation = [
    { label: navAbout, href: "#quem-somos" },
    { label: navEvents, href: "#eventos" },
    { label: navIdea, href: "#big-ideia" },
    { label: navTestimonials, href: "#depoimentos" },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="h-[80px] lg:h-[100px] px-6 md:px-10 xl:px-16 flex items-center justify-between max-w-[1600px] mx-auto">
        <Link href="/wessex" className="flex min-h-11 items-center text-white">
          <Image
            src="/images/wessex/logo/main-white.png"
            alt="Wessex"
            width={981}
            height={282}
            sizes="(min-width: 1024px) 181px, (min-width: 640px) 153px, 125px"
            priority
            className="h-9 sm:h-11 lg:h-[52px] w-auto"
          />
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <nav
            className="hidden lg:flex items-center gap-8 xl:gap-14 text-[15px] xl:text-[18px] font-medium tracking-wider text-white"
            aria-label={common("navigation")}
          >
            {navigation.map((item) => (
              <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center hover:text-[#B8A042] transition">
                {item.label}
              </a>
            ))}
          </nav>
          <LocaleSwitcher />
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center border border-white/40 text-white lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="wessex-mobile-menu"
            aria-label={menuOpen ? common("closeMenu") : common("openMenu")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-6 w-6"
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
      </div>

      {menuOpen && (
        <div
          id="wessex-mobile-menu"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={common("navigation")}
          tabIndex={-1}
          className="max-h-[calc(var(--usable-viewport-height)-5rem)] overflow-y-auto overscroll-contain border-t border-white/20 bg-black/95 px-6 py-6 backdrop-blur-md lg:hidden"
        >
          <nav className="mx-auto flex max-w-[1600px] flex-col" aria-label={common("navigation")}>
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="flex min-h-11 items-center border-b border-white/15 py-3 text-lg font-medium tracking-wider text-white"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/servicos/orcamento"
              onClick={closeMenu}
              className="mt-6 flex min-h-11 items-center justify-center rounded-[12px] bg-[#B8A042] px-5 py-3 font-medium text-black"
            >
              {calculate}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
