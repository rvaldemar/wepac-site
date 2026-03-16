"use client";

import Link from "next/link";
import { useState } from "react";

const navigation = [
  { name: "A WEPAC", href: "/sobre" },
  { name: "Projetos", href: "/projetos" },
  { name: "Metodologia", href: "/metodologia" },
  { name: "Impacto", href: "/impacto" },
  { name: "Programação", href: "/programacao" },
  { name: "Serviços", href: "/servicos" },
  { name: "Media", href: "/media" },
  { name: "Contacto", href: "/contacto" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-wepac-black/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="font-barlow text-xl font-bold tracking-tight text-wepac-white">
          wepac
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex lg:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="font-inter text-sm text-wepac-white/70 transition-colors hover:text-wepac-white"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden text-wepac-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
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
        <div className="lg:hidden bg-wepac-black border-t border-white/10">
          <div className="flex flex-col px-6 py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="font-inter text-lg text-wepac-white/70 transition-colors hover:text-wepac-white"
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
