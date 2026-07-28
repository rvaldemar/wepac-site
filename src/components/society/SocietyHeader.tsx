"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMobileDrawer } from "@/lib/useMobileDrawer";

const navigation = [
  { name: "Society", href: "/society" },
  { name: "Academy", href: "/academy" },
  { name: "Companhia de Artes", href: "/companhia-de-artes" },
  { name: "Plataformas", href: "/society#plataformas" },
];

export function SocietyHeader() {
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
        aria-label="Navegação principal"
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

        <div className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-[13px] font-medium text-white/65 transition-colors hover:text-white"
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/wepacker/login"
            className="border border-white/25 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            Abrir Backpack
          </Link>
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="grid h-11 w-11 place-items-center border border-white/15 text-white lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="society-mobile-menu"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
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
      </nav>

      {menuOpen && (
        <div
          id="society-mobile-menu"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          tabIndex={-1}
          className="border-t border-white/10 bg-black px-5 py-7 lg:hidden"
        >
          <div className="mx-auto flex max-w-[1440px] flex-col">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMenu}
                className="border-b border-white/10 py-4 font-barlow text-2xl font-bold text-white"
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/wepacker/login"
              onClick={closeMenu}
              className="mt-6 bg-white px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-black"
            >
              Abrir Backpack
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
